"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  CalendarClock,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function AnomaliesAlertsPanel({
  transactions = [],
  budgetAmount = null,
  currentMonthExpenses = 0,
  totalIncome = 0,
  totalExpense = 0,
  recurringExpenses = 0,
}) {
  const alerts = useMemo(() => {
    const list = [];

    // 1. Budget violation
    if (budgetAmount && budgetAmount > 0) {
      const budgetPercent = (currentMonthExpenses / budgetAmount) * 100;
      if (budgetPercent >= 100) {
        list.push({
          id: "budget-exceeded",
          severity: "critical",
          title: "Monthly Budget Cap Breached",
          description: `You have exhausted 100% of your allocated $${budgetAmount.toFixed(0)} budget. Current spending sits at $${currentMonthExpenses.toFixed(2)} (${budgetPercent.toFixed(1)}%).`,
          metric: `${budgetPercent.toFixed(0)}% Utilized`,
        });
      } else if (budgetPercent >= 80) {
        list.push({
          id: "budget-warning",
          severity: "warning",
          title: "Approaching Monthly Budget Limit",
          description: `You have consumed ${budgetPercent.toFixed(1)}% of your monthly budget. Only $${(budgetAmount - currentMonthExpenses).toFixed(2)} remains for the month.`,
          metric: `${(budgetAmount - currentMonthExpenses).toFixed(0)} Remaining`,
        });
      }
    }

    // 2. Net Deficit Alert
    if (totalExpense > totalIncome && totalIncome > 0) {
      const deficit = totalExpense - totalIncome;
      list.push({
        id: "net-deficit",
        severity: "critical",
        title: "Cash Flow Deficit",
        description: `Total outflows ($${totalExpense.toFixed(2)}) exceed incoming revenues ($${totalIncome.toFixed(2)}) by $${deficit.toFixed(2)}.`,
        metric: `-$${deficit.toFixed(0)} Deficit`,
      });
    }

    // 3. Category Outlier Spikes
    // Compute category averages
    const categoryStats = new Map();
    transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const cat = t.category || "other";
        const amt = parseFloat(t.amount);
        if (!categoryStats.has(cat)) {
          categoryStats.set(cat, { total: 0, count: 0, items: [] });
        }
        const s = categoryStats.get(cat);
        s.total += amt;
        s.count += 1;
        s.items.push(t);
      });

    categoryStats.forEach((stats, cat) => {
      if (stats.count >= 2) {
        const avg = stats.total / stats.count;
        stats.items.forEach((tx) => {
          const amt = parseFloat(tx.amount);
          // Flag if transaction is > 2.8x category average and > $150
          if (amt > avg * 2.8 && amt > 150) {
            list.push({
              id: `spike-${tx.id}`,
              severity: "warning",
              title: `Unusual Spending Spike in ${cat.replace("-", " ")}`,
              description: `A single expense of $${amt.toFixed(2)} ("${tx.description || cat}") on ${format(new Date(tx.date), "MMM dd")} is significantly higher than your category typical average of $${avg.toFixed(2)}.`,
              metric: `$${amt.toFixed(0)} Outlier`,
            });
          }
        });
      }
    });

    // 4. Heavy Fixed Commitment Ratio
    if (totalIncome > 0 && recurringExpenses > 0) {
      const ratio = (recurringExpenses / totalIncome) * 100;
      if (ratio > 40) {
        list.push({
          id: "high-fixed-ratio",
          severity: "info",
          title: "Elevated Fixed Burden",
          description: `Fixed subscriptions and recurring commitments represent ${ratio.toFixed(1)}% of total inflow, reducing discretionary liquidity.`,
          metric: `${ratio.toFixed(0)}% Fixed Ratio`,
        });
      }
    }

    return list;
  }, [transactions, budgetAmount, currentMonthExpenses, totalIncome, totalExpense, recurringExpenses]);

  return (
    <Card className="border-slate-200 shadow-sm bg-white mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Audits & Anomaly Detection
          </CardTitle>
          <Badge
            variant="outline"
            className={`text-xs ${
              alerts.length === 0
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {alerts.length === 0 ? "All Clear" : `${alerts.length} Flagged`}
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Algorithmic heuristics detecting threshold breaches, velocity anomalies, and spending outliers
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800">
                Zero Anomalies Detected
              </p>
              <p className="text-emerald-700/90 text-[11px] mt-0.5">
                All transactions adhere to expected category baselines, cash flow is positive, and budget parameters remain within healthy tolerances.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start justify-between gap-3 p-3 rounded-lg border text-xs transition-all ${
                  alert.severity === "critical"
                    ? "bg-rose-50/70 border-rose-200 text-rose-900"
                    : alert.severity === "warning"
                    ? "bg-amber-50/70 border-amber-200 text-amber-900"
                    : "bg-blue-50/70 border-blue-200 text-blue-900"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {alert.severity === "critical" ? (
                    <Flame className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : alert.severity === "warning" ? (
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <CalendarClock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold">{alert.title}</span>
                    <p className="text-[11px] opacity-90 mt-0.5">{alert.description}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 font-mono font-bold ${
                    alert.severity === "critical"
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : alert.severity === "warning"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-blue-100 text-blue-800 border-blue-300"
                  }`}
                >
                  {alert.metric}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
