"use client";

import { useState, useMemo, useCallback } from "react";
import {
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  isWithinInterval,
  format,
} from "date-fns";
import {
  LayoutDashboard,
  TrendingUp,
  PieChart as PieIcon,
  Sparkles,
  Table as TableIcon,
  Building,
  PenBox,
  Download,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { DashboardFilters } from "./dashboard-filters";
import { KpiMetricsGrid } from "./kpi-metrics-grid";
import { CashFlowTrendChart } from "./cash-flow-trend-chart";
import { CategoryAnalysisCharts } from "./category-analysis-charts";
import { RecurringAnalysis } from "./recurring-analysis";
import { AiInsightsPanel } from "./ai-insights-panel";
import { AnomaliesAlertsPanel } from "./anomalies-alerts-panel";
import { AdvancedDataTable } from "./advanced-data-table";
import { AccountsBudgetSection } from "./accounts-budget-section";

const DEFAULT_FILTERS = {
  datePreset: "30D",
  customStart: "",
  customEnd: "",
  accountId: "ALL",
  type: "ALL",
  category: "ALL",
  search: "",
};

export function DashboardContainer({
  accounts = [],
  transactions = [],
  budgetData = null,
}) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState("OVERVIEW"); // "OVERVIEW" | "TRENDS" | "CATEGORIES" | "AI_ADVISORY" | "LEDGER" | "ACCOUNTS"

  // 1. Calculate Date Intervals (Current Window & Equivalent Previous Window)
  const { currentInterval, previousInterval, periodLabel, daysInPeriod } = useMemo(() => {
    const now = new Date();
    let currStart, currEnd;
    let prevStart, prevEnd;
    let days = 30;
    let label = "Last 30 Days";

    switch (filters.datePreset) {
      case "7D":
        days = 7;
        label = "Last 7 Days";
        currStart = subDays(now, 7);
        currEnd = now;
        prevStart = subDays(currStart, 7);
        prevEnd = currStart;
        break;

      case "30D":
        days = 30;
        label = "Last 30 Days";
        currStart = subDays(now, 30);
        currEnd = now;
        prevStart = subDays(currStart, 30);
        prevEnd = currStart;
        break;

      case "THIS_MONTH":
        label = "This Month";
        currStart = startOfMonth(now);
        currEnd = endOfMonth(now);
        days = now.getDate();
        prevStart = startOfMonth(subMonths(now, 1));
        prevEnd = endOfMonth(subMonths(now, 1));
        break;

      case "LAST_MONTH":
        label = "Last Month";
        currStart = startOfMonth(subMonths(now, 1));
        currEnd = endOfMonth(subMonths(now, 1));
        days = 30;
        prevStart = startOfMonth(subMonths(now, 2));
        prevEnd = endOfMonth(subMonths(now, 2));
        break;

      case "90D":
        days = 90;
        label = "Last 90 Days";
        currStart = subDays(now, 90);
        currEnd = now;
        prevStart = subDays(currStart, 90);
        prevEnd = currStart;
        break;

      case "YTD":
        label = "Year to Date";
        currStart = startOfYear(now);
        currEnd = now;
        days = Math.max(1, Math.round((now - currStart) / (1000 * 60 * 60 * 24)));
        prevStart = startOfYear(subDays(currStart, 1));
        prevEnd = subDays(currStart, 1);
        break;

      case "CUSTOM":
        label = "Custom Range";
        if (filters.customStart && filters.customEnd) {
          currStart = new Date(filters.customStart);
          currEnd = new Date(filters.customEnd);
          days = Math.max(1, Math.round((currEnd - currStart) / (1000 * 60 * 60 * 24)));
          prevStart = subDays(currStart, days);
          prevEnd = currStart;
        } else {
          currStart = subDays(now, 30);
          currEnd = now;
          days = 30;
          prevStart = subDays(currStart, 30);
          prevEnd = currStart;
        }
        break;

      case "ALL":
      default:
        label = "All Time";
        currStart = new Date(0);
        currEnd = new Date(2100, 0, 1);
        prevStart = null;
        prevEnd = null;
        days = 365;
        break;
    }

    return {
      currentInterval: { start: currStart, end: currEnd },
      previousInterval: prevStart && prevEnd ? { start: prevStart, end: prevEnd } : null,
      periodLabel: label,
      daysInPeriod: days,
    };
  }, [filters.datePreset, filters.customStart, filters.customEnd]);

  // 2. Filter transactions based on active slicers
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = new Date(t.date);

      // Date check
      if (
        currentInterval &&
        !isWithinInterval(txDate, {
          start: currentInterval.start,
          end: currentInterval.end,
        })
      ) {
        return false;
      }

      // Account check
      if (filters.accountId !== "ALL" && t.accountId !== filters.accountId) {
        return false;
      }

      // Type check
      if (filters.type === "RECURRING") {
        if (!t.isRecurring) return false;
      } else if (filters.type !== "ALL" && t.type !== filters.type) {
        return false;
      }

      // Category check
      if (filters.category !== "ALL" && t.category !== filters.category) {
        return false;
      }

      // Search check
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const cat = (t.category || "").toLowerCase();
        const acct = (t.account?.name || "").toLowerCase();
        const amt = t.amount.toString();
        if (
          !desc.includes(query) &&
          !cat.includes(query) &&
          !acct.includes(query) &&
          !amt.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, currentInterval, filters]);

  // 3. Transactions for Previous Period (for comparative KPI metrics)
  const previousTransactions = useMemo(() => {
    if (!previousInterval) return [];

    return transactions.filter((t) => {
      const txDate = new Date(t.date);
      if (
        !isWithinInterval(txDate, {
          start: previousInterval.start,
          end: previousInterval.end,
        })
      ) {
        return false;
      }
      if (filters.accountId !== "ALL" && t.accountId !== filters.accountId) {
        return false;
      }
      return true;
    });
  }, [transactions, previousInterval, filters.accountId]);

  // 4. Aggregate KPI Metrics
  const kpiData = useMemo(() => {
    // Current period metrics
    let curInc = 0;
    let curExp = 0;
    let recExp = 0;
    let recCount = 0;

    filteredTransactions.forEach((t) => {
      const amt = parseFloat(t.amount);
      if (t.type === "INCOME") {
        curInc += amt;
      } else {
        curExp += amt;
        if (t.isRecurring) {
          recExp += amt;
          recCount += 1;
        }
      }
    });

    // Previous period metrics
    let prevInc = 0;
    let prevExp = 0;
    previousTransactions.forEach((t) => {
      const amt = parseFloat(t.amount);
      if (t.type === "INCOME") prevInc += amt;
      else prevExp += amt;
    });

    const netSavings = curInc - curExp;
    const prevNetSavings = prevInc - prevExp;

    const incomeChange = prevInc > 0 ? ((curInc - prevInc) / prevInc) * 100 : curInc > 0 ? 100 : 0;
    const expenseChange = prevExp > 0 ? ((curExp - prevExp) / prevExp) * 100 : curExp > 0 ? 100 : 0;
    const savingsRate = curInc > 0 ? Math.max(0, (netSavings / curInc) * 100) : 0;

    // Total liquid balance across accounts
    const totalLiquidBalance = accounts.reduce(
      (sum, ac) => sum + (parseFloat(ac.balance) || 0),
      0
    );

    return {
      totalBalance: totalLiquidBalance,
      accountsCount: accounts.length,
      currentIncome: curInc,
      previousIncome: prevInc,
      incomeChange,
      currentExpense: curExp,
      previousExpense: prevExp,
      expenseChange,
      netSavings,
      previousNetSavings: prevNetSavings,
      savingsRate,
      recurringExpenses: recExp,
      recurringCount: recCount,
    };
  }, [filteredTransactions, previousTransactions, accounts]);

  // 5. Category ranking & top drivers
  const topCategories = useMemo(() => {
    const catMap = new Map();
    filteredTransactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const cat = t.category || "other";
        const amt = parseFloat(t.amount);
        catMap.set(cat, (catMap.get(cat) || 0) + amt);
      });

    const totalExp = kpiData.currentExpense;
    return Array.from(catMap.entries())
      .map(([name, amount]) => ({
        name: name.replace("-", " "),
        amount: parseFloat(amount.toFixed(2)),
        percentage: totalExp > 0 ? parseFloat(((amount / totalExp) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredTransactions, kpiData.currentExpense]);

  // 6. AI Summary data for Gemini
  const aiSummaryData = useMemo(() => {
    return {
      period: periodLabel,
      totalIncome: kpiData.currentIncome,
      totalExpenses: kpiData.currentExpense,
      netSavings: kpiData.netSavings,
      savingsRate: kpiData.savingsRate,
      budgetAmount: budgetData?.budget?.amount ? parseFloat(budgetData.budget.amount) : null,
      currentExpenses: budgetData?.currentExpenses || 0,
      budgetPercentage:
        budgetData?.budget?.amount && budgetData.budget.amount > 0
          ? ((budgetData.currentExpenses || 0) / parseFloat(budgetData.budget.amount)) * 100
          : null,
      recurringExpenses: kpiData.recurringExpenses,
      recurringCount: kpiData.recurringCount,
      topCategories,
      accountCount: accounts.length,
      anomaliesCount: 0,
    };
  }, [periodLabel, kpiData, budgetData, topCategories, accounts]);

  // Filter change handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // CSV Export
  const handleExportCSV = useCallback(() => {
    if (!filteredTransactions.length) return;

    const headers = [
      "ID",
      "Date",
      "Description",
      "Category",
      "Type",
      "Amount",
      "Account",
      "Recurring",
      "RecurringInterval",
    ];

    const rows = filteredTransactions.map((t) => [
      t.id,
      format(new Date(t.date), "yyyy-MM-dd"),
      `"${(t.description || "").replace(/"/g, '""')}"`,
      t.category,
      t.type,
      t.amount,
      `"${t.account?.name || ""}"`,
      t.isRecurring ? "TRUE" : "FALSE",
      t.recurringInterval || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `meridian-analytics-${format(new Date(), "yyyyMMdd-HHmm")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      {/* 1. Power BI Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Financial Intelligence & Analytics
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-xs px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse inline-block" />
              Live Database Connected
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time cash flow monitoring, multi-account ledger, and Gemini-powered predictive intelligence
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <Link href="/transaction/create">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9">
              <PenBox className="h-3.5 w-3.5 mr-1.5" />
              Add Transaction
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="border-slate-200 text-slate-700 text-xs h-9"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
            Export Data
          </Button>
        </div>
      </div>

      {/* 2. Power BI Slicer Toolbar */}
      <DashboardFilters
        accounts={accounts}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onExportCSV={handleExportCSV}
        totalResultsCount={filteredTransactions.length}
      />

      {/* 3. KPI Metric Cards */}
      <KpiMetricsGrid
        totalBalance={kpiData.totalBalance}
        accountsCount={kpiData.accountsCount}
        currentIncome={kpiData.currentIncome}
        previousIncome={kpiData.previousIncome}
        incomeChange={kpiData.incomeChange}
        currentExpense={kpiData.currentExpense}
        previousExpense={kpiData.previousExpense}
        expenseChange={kpiData.expenseChange}
        netSavings={kpiData.netSavings}
        previousNetSavings={kpiData.previousNetSavings}
        savingsRate={kpiData.savingsRate}
        budgetAmount={budgetData?.budget?.amount ? parseFloat(budgetData.budget.amount) : null}
        currentMonthExpenses={budgetData?.currentExpenses || 0}
        recurringExpenses={kpiData.recurringExpenses}
        recurringCount={kpiData.recurringCount}
        daysInPeriod={daysInPeriod}
      />

      {/* 4. Power BI View Mode Switcher (Tabs) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 text-xs sm:text-sm font-medium">
        <button
          onClick={() => setActiveTab("OVERVIEW")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === "OVERVIEW"
              ? "border-blue-600 text-blue-600 bg-blue-50/40 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Executive Overview
        </button>

        <button
          onClick={() => setActiveTab("TRENDS")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === "TRENDS"
              ? "border-blue-600 text-blue-600 bg-blue-50/40 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Cash Flow & Trends
        </button>

        <button
          onClick={() => setActiveTab("CATEGORIES")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === "CATEGORIES"
              ? "border-blue-600 text-blue-600 bg-blue-50/40 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <PieIcon className="h-4 w-4" />
          Category Deep Dive
        </button>

        <button
          onClick={() => setActiveTab("AI_ADVISORY")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === "AI_ADVISORY"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/40 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="h-4 w-4 text-indigo-500" />
          AI Intelligence & Audits
        </button>

        <button
          onClick={() => setActiveTab("LEDGER")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === "LEDGER"
              ? "border-blue-600 text-blue-600 bg-blue-50/40 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <TableIcon className="h-4 w-4" />
          Transaction Ledger
        </button>

        <button
          onClick={() => setActiveTab("ACCOUNTS")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
            activeTab === "ACCOUNTS"
              ? "border-blue-600 text-blue-600 bg-blue-50/40 font-semibold"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Building className="h-4 w-4" />
          Accounts & Budget ({accounts.length})
        </button>
      </div>

      {/* 5. Tab Content Views */}

      {/* VIEW: EXECUTIVE OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          <CashFlowTrendChart transactions={filteredTransactions} />

          <CategoryAnalysisCharts
            transactions={filteredTransactions}
            onSelectCategory={(catId) => handleFilterChange("category", catId)}
            selectedCategory={filters.category}
          />

          <AnomaliesAlertsPanel
            transactions={filteredTransactions}
            budgetAmount={budgetData?.budget?.amount ? parseFloat(budgetData.budget.amount) : null}
            currentMonthExpenses={budgetData?.currentExpenses || 0}
            totalIncome={kpiData.currentIncome}
            totalExpense={kpiData.currentExpense}
            recurringExpenses={kpiData.recurringExpenses}
          />

          <RecurringAnalysis
            transactions={filteredTransactions}
            totalIncome={kpiData.currentIncome}
          />

          <AdvancedDataTable
            transactions={filteredTransactions}
            onExportCSV={handleExportCSV}
          />
        </div>
      )}

      {/* VIEW: CASH FLOW & TRENDS */}
      {activeTab === "TRENDS" && (
        <div className="space-y-6">
          <CashFlowTrendChart transactions={filteredTransactions} />
          <RecurringAnalysis
            transactions={filteredTransactions}
            totalIncome={kpiData.currentIncome}
          />
        </div>
      )}

      {/* VIEW: CATEGORY DEEP DIVE */}
      {activeTab === "CATEGORIES" && (
        <div className="space-y-6">
          <CategoryAnalysisCharts
            transactions={filteredTransactions}
            onSelectCategory={(catId) => handleFilterChange("category", catId)}
            selectedCategory={filters.category}
          />
        </div>
      )}

      {/* VIEW: AI INTELLIGENCE & AUDITS */}
      {activeTab === "AI_ADVISORY" && (
        <div className="space-y-6">
          <AiInsightsPanel summaryData={aiSummaryData} />
          <AnomaliesAlertsPanel
            transactions={filteredTransactions}
            budgetAmount={budgetData?.budget?.amount ? parseFloat(budgetData.budget.amount) : null}
            currentMonthExpenses={budgetData?.currentExpenses || 0}
            totalIncome={kpiData.currentIncome}
            totalExpense={kpiData.currentExpense}
            recurringExpenses={kpiData.recurringExpenses}
          />
        </div>
      )}

      {/* VIEW: TRANSACTION LEDGER */}
      {activeTab === "LEDGER" && (
        <div className="space-y-6">
          <AdvancedDataTable
            transactions={filteredTransactions}
            onExportCSV={handleExportCSV}
          />
        </div>
      )}

      {/* VIEW: ACCOUNTS & BUDGET */}
      {activeTab === "ACCOUNTS" && (
        <div className="space-y-6">
          <AccountsBudgetSection accounts={accounts} budgetData={budgetData} />
        </div>
      )}
    </div>
  );
}
