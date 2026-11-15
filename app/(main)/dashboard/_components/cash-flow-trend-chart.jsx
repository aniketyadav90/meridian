"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, startOfWeek, startOfMonth } from "date-fns";

export function CashFlowTrendChart({ transactions = [] }) {
  const [chartType, setChartType] = useState("area"); // "area" | "cumulative" | "bar"
  const [granularity, setGranularity] = useState("daily"); // "daily" | "weekly" | "monthly"

  // Process transactions into time series
  const seriesData = useMemo(() => {
    if (!transactions.length) return [];

    // Sort chronologically ascending for trend
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

    const bucketMap = new Map();

    sorted.forEach((tx) => {
      const txDate = new Date(tx.date);
      let bucketKey = "";
      let label = "";

      if (granularity === "monthly") {
        bucketKey = format(startOfMonth(txDate), "yyyy-MM");
        label = format(txDate, "MMM yyyy");
      } else if (granularity === "weekly") {
        bucketKey = format(startOfWeek(txDate), "yyyy-MM-dd");
        label = `Wk ${format(txDate, "MMM dd")}`;
      } else {
        bucketKey = format(txDate, "yyyy-MM-dd");
        label = format(txDate, "MMM dd");
      }

      if (!bucketMap.has(bucketKey)) {
        bucketMap.set(bucketKey, {
          key: bucketKey,
          label,
          income: 0,
          expense: 0,
          net: 0,
          cumulativeNet: 0,
        });
      }

      const item = bucketMap.get(bucketKey);
      const amt = parseFloat(tx.amount);
      if (tx.type === "INCOME") {
        item.income += amt;
      } else {
        item.expense += amt;
      }
      item.net = item.income - item.expense;
    });

    const list = Array.from(bucketMap.values());
    let runningNet = 0;
    list.forEach((entry) => {
      runningNet += entry.net;
      entry.cumulativeNet = runningNet;
      entry.income = parseFloat(entry.income.toFixed(2));
      entry.expense = parseFloat(entry.expense.toFixed(2));
      entry.net = parseFloat(entry.net.toFixed(2));
      entry.cumulativeNet = parseFloat(entry.cumulativeNet.toFixed(2));
    });

    return list;
  }, [transactions, granularity]);

  const totalIn = seriesData.reduce((acc, d) => acc + d.income, 0);
  const totalOut = seriesData.reduce((acc, d) => acc + d.expense, 0);
  const netTotal = totalIn - totalOut;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[180px]">
        <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1">
          {data.label}
        </p>
        <div className="flex justify-between items-center text-emerald-400">
          <span>Inflow (Income):</span>
          <span className="font-mono font-medium">${data.income.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-rose-400">
          <span>Outflow (Expense):</span>
          <span className="font-mono font-medium">${data.expense.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-slate-300 border-t border-slate-800/80 pt-1 mt-1 font-semibold">
          <span>Period Net:</span>
          <span
            className={`font-mono ${
              data.net >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {data.net >= 0 ? "+" : ""}${data.net.toLocaleString()}
          </span>
        </div>
        {chartType === "cumulative" && (
          <div className="flex justify-between items-center text-indigo-300 font-semibold pt-1">
            <span>Cumulative Balance:</span>
            <span className="font-mono">${data.cumulativeNet.toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            Cash Flow & Trend Analytics
            <span className="text-xs font-normal px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Net: {netTotal >= 0 ? "+" : ""}${netTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Chronological inflow vs outflow velocity and cumulative liquidity curve
          </CardDescription>
        </div>

        {/* Chart View & Granularity Controls */}
        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
          {/* Mode Switch */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setChartType("area")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                chartType === "area"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Inflow vs Outflow
            </button>
            <button
              onClick={() => setChartType("cumulative")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                chartType === "cumulative"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cumulative Flow
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                chartType === "bar"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bars
            </button>
          </div>

          {/* Granularity Switch */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs ml-1">
            <button
              onClick={() => setGranularity("daily")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                granularity === "daily"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setGranularity("weekly")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                granularity === "weekly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setGranularity("monthly")}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                granularity === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {seriesData.length === 0 ? (
          <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
            No transaction records match the active criteria.
          </div>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <ComposedChart data={seriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                    iconType="circle"
                  />
                  <Bar dataKey="income" name="Inflow (Income)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Outflow (Expense)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="net"
                    name="Net Margin"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              ) : chartType === "cumulative" ? (
                <AreaChart data={seriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCumNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
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
                    tickFormatter={(val) => `$${val >= 1000 || val <= -1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cumulativeNet"
                    name="Cumulative Net Capital"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCumNet)"
                  />
                </AreaChart>
              ) : (
                <AreaChart data={seriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Inflow (Income)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Outflow (Expense)"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
