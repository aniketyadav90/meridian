"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { defaultCategories, categoryColors } from "@/data/categories";
import { PieChart as PieIcon, Calendar } from "lucide-react";

const DEFAULT_PALETTE = [
  "#3b82f6",
  "#10b981",
  "#f43f5e",
  "#8b5cf6",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#64748b",
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CategoryAnalysisCharts({
  transactions = [],
  onSelectCategory,
  selectedCategory = "ALL",
}) {
  const [breakdownType, setBreakdownType] = useState("EXPENSE"); // "EXPENSE" | "INCOME"
  const [activeSlice, setActiveSlice] = useState(null);

  // 1. Group by category
  const { categoryList, totalAmount } = useMemo(() => {
    const filtered = transactions.filter((t) => t.type === breakdownType);
    const catMap = new Map();
    let sum = 0;

    filtered.forEach((t) => {
      const catKey = t.category || "other-expense";
      const amt = parseFloat(t.amount);
      sum += amt;

      if (!catMap.has(catKey)) {
        const catMeta = defaultCategories.find((c) => c.id === catKey);
        catMap.set(catKey, {
          id: catKey,
          name: catMeta ? catMeta.name : catKey.replace("-", " "),
          color: catMeta ? catMeta.color : categoryColors[catKey] || "#64748b",
          value: 0,
          count: 0,
        });
      }

      const item = catMap.get(catKey);
      item.value += amt;
      item.count += 1;
    });

    const list = Array.from(catMap.values())
      .map((c) => ({
        ...c,
        value: parseFloat(c.value.toFixed(2)),
        percentage: sum > 0 ? parseFloat(((c.value / sum) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return { categoryList: list, totalAmount: sum };
  }, [transactions, breakdownType]);

  // 2. Day of Week distribution
  const dayOfWeekData = useMemo(() => {
    const days = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
      day: DAYS_OF_WEEK[i],
      expense: 0,
      income: 0,
      txCount: 0,
    }));

    transactions.forEach((tx) => {
      const d = new Date(tx.date).getDay();
      const amt = parseFloat(tx.amount);
      if (tx.type === "EXPENSE") {
        days[d].expense += amt;
      } else {
        days[d].income += amt;
      }
      days[d].txCount += 1;
    });

    return days.map((d) => ({
      ...d,
      expense: parseFloat(d.expense.toFixed(2)),
      income: parseFloat(d.income.toFixed(2)),
    }));
  }, [transactions]);

  const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;

    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1 border border-slate-800">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: item.color }}
          />
          {item.name}
        </div>
        <div className="flex justify-between gap-4 text-slate-300">
          <span>Amount:</span>
          <span className="font-mono font-medium">${item.value.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4 text-slate-400">
          <span>Share:</span>
          <span className="font-mono">{item.percentage}%</span>
        </div>
        <div className="flex justify-between gap-4 text-slate-400">
          <span>Transactions:</span>
          <span className="font-mono">{item.count}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
      {/* Donut Chart: Distribution */}
      <Card className="lg:col-span-6 border-slate-200 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-blue-600" />
              Category Allocation
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Interactive allocation breakdown (Click any slice to filter)
            </CardDescription>
          </div>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setBreakdownType("EXPENSE")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                breakdownType === "EXPENSE"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setBreakdownType("INCOME")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                breakdownType === "INCOME"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Income
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {categoryList.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              No {breakdownType.toLowerCase()} data for selected criteria.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Donut Chart */}
              <div className="h-[260px] w-full sm:w-[260px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryList}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveSlice(categoryList[index])}
                      onMouseLeave={() => setActiveSlice(null)}
                      onClick={(entry) => onSelectCategory && onSelectCategory(entry.id)}
                      className="cursor-pointer"
                    >
                      {categoryList.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]}
                          stroke={selectedCategory === entry.id ? "#0f172a" : "#fff"}
                          strokeWidth={selectedCategory === entry.id ? 3 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {activeSlice ? activeSlice.name : "Total"}
                  </span>
                  <span className="text-base font-bold text-slate-900">
                    ${(activeSlice ? activeSlice.value : totalAmount).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  {activeSlice && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {activeSlice.percentage}%
                    </span>
                  )}
                </div>
              </div>

              {/* Top 5 Legend items with clickable filter */}
              <div className="flex-1 w-full space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                {categoryList.slice(0, 6).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition-all text-left ${
                      selectedCategory === cat.id
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium text-slate-700 truncate">{cat.name}</span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-mono text-slate-900 font-medium">
                        ${cat.value.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1.5">
                        ({cat.percentage}%)
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day of Week Spending Heat / Patterns */}
      <Card className="lg:col-span-6 border-slate-200 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              Day-of-Week Spending Velocity
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Weekend vs weekday expenditure behavior pattern
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value, name) => [`$${value.toLocaleString()}`, name === "expense" ? "Expenses" : "Income"]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
