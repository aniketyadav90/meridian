"use client";

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarClock,
  PiggyBank,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function MetricCard({
  title,
  value,
  previousValue,
  changePercent,
  isPositiveChangeGood = true,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
  tooltipText,
  badgeText,
  badgeVariant = "neutral",
  progressValue = null,
  progressColor = "bg-blue-600",
}) {
  const isNeutral = changePercent === null || changePercent === undefined || changePercent === 0;
  const isUp = changePercent > 0;
  const isGood = isPositiveChangeGood ? isUp : !isUp;

  return (
    <Card className="border border-slate-200/80 shadow-sm hover:shadow transition-all bg-white overflow-hidden relative group">
      <CardContent className="p-4 sm:p-5">
        {/* Top Header: Title, Tooltip, Icon */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {title}
            </span>
            {tooltipText && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help text-slate-400 hover:text-slate-600">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs p-2">
                    {tooltipText}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className={`p-2 rounded-lg ${iconBg} ${iconColor} shrink-0`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        {/* Big Metric Value */}
        <div className="flex items-baseline justify-between gap-2 my-1">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
          {badgeText && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                badgeVariant === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : badgeVariant === "danger"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : badgeVariant === "warning"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>

        {/* Change Comparison Pill or Progress */}
        {progressValue !== null && (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
                style={{ width: `${Math.min(100, Math.max(0, progressValue))}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            {changePercent !== null && changePercent !== undefined ? (
              <span
                className={`flex items-center font-medium ${
                  isNeutral
                    ? "text-slate-500"
                    : isGood
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {isNeutral ? (
                  <Minus className="h-3 w-3 mr-0.5" />
                ) : isUp ? (
                  <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                )}
                {Math.abs(changePercent).toFixed(1)}%
              </span>
            ) : null}

            {previousValue !== undefined && previousValue !== null ? (
              <span className="text-[11px] text-slate-500 ml-1">
                vs prior ({typeof previousValue === "number" ? `$${previousValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : previousValue})
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">{subtitle}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiMetricsGrid({
  totalBalance = 0,
  accountsCount = 0,
  currentIncome = 0,
  previousIncome = 0,
  incomeChange = 0,
  currentExpense = 0,
  previousExpense = 0,
  expenseChange = 0,
  netSavings = 0,
  previousNetSavings = 0,
  savingsRate = 0,
  budgetAmount = null,
  currentMonthExpenses = 0,
  recurringExpenses = 0,
  recurringCount = 0,
  daysInPeriod = 30,
}) {
  const dailyBurnRate = daysInPeriod > 0 ? currentExpense / daysInPeriod : 0;
  const budgetUtilization = budgetAmount && budgetAmount > 0 ? (currentMonthExpenses / budgetAmount) * 100 : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
      {/* 1. Net Liquid Assets */}
      <MetricCard
        title="Total Liquid Capital"
        value={`$${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subtitle={`${accountsCount} Active Account${accountsCount === 1 ? "" : "s"}`}
        icon={Wallet}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
        tooltipText="Current aggregated liquid balance across all connected checking and savings accounts."
        badgeText={`${accountsCount} Accounts`}
        badgeVariant="neutral"
      />

      {/* 2. Total Inflow */}
      <MetricCard
        title="Total Inflow"
        value={`$${currentIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        previousValue={previousIncome}
        changePercent={incomeChange}
        isPositiveChangeGood={true}
        icon={TrendingUp}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
        tooltipText="Total earned revenue, salary, and deposits in the selected date range vs prior equivalent period."
        badgeText={incomeChange >= 0 ? "Growth" : "Dip"}
        badgeVariant={incomeChange >= 0 ? "success" : "warning"}
      />

      {/* 3. Total Outflow */}
      <MetricCard
        title="Total Outflow"
        value={`$${currentExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        previousValue={previousExpense}
        changePercent={expenseChange}
        isPositiveChangeGood={false} // Decreasing expense is good!
        subtitle={`Avg $${dailyBurnRate.toFixed(1)}/day`}
        icon={TrendingDown}
        iconColor="text-rose-600"
        iconBg="bg-rose-50"
        tooltipText="Total operational spending and expenses incurred in the selected timeframe vs prior equivalent period."
        badgeText={`$${dailyBurnRate.toFixed(0)}/day`}
        badgeVariant={expenseChange > 15 ? "danger" : "neutral"}
      />

      {/* 4. Net Cash Flow & Savings Rate */}
      <MetricCard
        title="Net Cash Flow"
        value={`${netSavings >= 0 ? "+" : ""}$${netSavings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        previousValue={previousNetSavings}
        changePercent={
          previousNetSavings !== 0
            ? ((netSavings - previousNetSavings) / Math.abs(previousNetSavings)) * 100
            : 0
        }
        isPositiveChangeGood={true}
        icon={PiggyBank}
        iconColor="text-indigo-600"
        iconBg="bg-indigo-50"
        tooltipText="Net retained capital (Inflow minus Outflow) with realized personal savings rate."
        badgeText={`${savingsRate.toFixed(1)}% Saved`}
        badgeVariant={savingsRate >= 20 ? "success" : savingsRate > 0 ? "warning" : "danger"}
      />

      {/* 5. Monthly Budget Health */}
      <MetricCard
        title="Budget Utilization"
        value={
          budgetAmount
            ? `$${currentMonthExpenses.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            : "No Limit"
        }
        subtitle={
          budgetAmount
            ? `$${(budgetAmount - currentMonthExpenses).toFixed(0)} remaining`
            : "Set budget to track"
        }
        icon={AlertCircle}
        iconColor={budgetUtilization > 90 ? "text-rose-600" : "text-amber-600"}
        iconBg={budgetUtilization > 90 ? "bg-rose-50" : "bg-amber-50"}
        tooltipText="Current month actual spending on default account vs established budget cap."
        badgeText={
          budgetUtilization !== null
            ? `${budgetUtilization.toFixed(0)}% Used`
            : "Uncapped"
        }
        badgeVariant={
          budgetUtilization === null
            ? "neutral"
            : budgetUtilization >= 100
            ? "danger"
            : budgetUtilization >= 80
            ? "warning"
            : "success"
        }
        progressValue={budgetUtilization}
        progressColor={
          budgetUtilization >= 100
            ? "bg-rose-600"
            : budgetUtilization >= 80
            ? "bg-amber-500"
            : "bg-emerald-500"
        }
      />

      {/* 6. Recurring Commitments */}
      <MetricCard
        title="Fixed Commitments"
        value={`$${recurringExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subtitle={`${recurringCount} Active Subscription${recurringCount === 1 ? "" : "s"}`}
        icon={CalendarClock}
        iconColor="text-purple-600"
        iconBg="bg-purple-50"
        tooltipText="Monthly committed obligations (bills, subscriptions, utilities, recurring transfers)."
        badgeText={`${recurringCount} Active`}
        badgeVariant="neutral"
      />
    </div>
  );
}
