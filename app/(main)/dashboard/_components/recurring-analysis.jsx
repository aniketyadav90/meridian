"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

export function RecurringAnalysis({
  transactions = [],
  totalIncome = 0,
}) {
  const recurringItems = useMemo(() => {
    return transactions.filter((t) => t.isRecurring && t.type === "EXPENSE");
  }, [transactions]);

  // Normalized monthly recurring cost
  const monthlyRecurringTotal = useMemo(() => {
    return recurringItems.reduce((acc, t) => {
      const amt = parseFloat(t.amount);
      switch (t.recurringInterval) {
        case "DAILY":
          return acc + amt * 30;
        case "WEEKLY":
          return acc + amt * 4.33;
        case "MONTHLY":
          return acc + amt;
        case "YEARLY":
          return acc + amt / 12;
        default:
          return acc + amt;
      }
    }, 0);
  }, [recurringItems]);

  const fixedToIncomeRatio = totalIncome > 0 ? (monthlyRecurringTotal / totalIncome) * 100 : 0;
  const isHighFixedRatio = fixedToIncomeRatio > 40;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
      {/* Ratio Card */}
      <Card className="lg:col-span-4 border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-purple-600" />
            Fixed Obligations Ratio
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Share of monthly income dedicated to recurring fixed costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-slate-900">
              {fixedToIncomeRatio.toFixed(1)}%
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${
                isHighFixedRatio
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isHighFixedRatio ? "High Fixed Load" : "Healthy Baseline"}
            </Badge>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                isHighFixedRatio ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, fixedToIncomeRatio))}%` }}
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Projected 30-Day Fixed Burn:</span>
              <span className="font-semibold text-slate-900">
                ${monthlyRecurringTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Projected Annual Outlay:</span>
              <span className="font-semibold text-slate-900">
                ${(monthlyRecurringTotal * 12).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Active Subscriptions/Bills:</span>
              <span className="font-semibold text-slate-900">
                {recurringItems.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List of Recurring Subscriptions / Bills */}
      <Card className="lg:col-span-8 border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
            <span>Active Recurring Commitments & Subscriptions</span>
            <span className="text-xs font-normal text-muted-foreground">
              {recurringItems.length} active schedule{recurringItems.length === 1 ? "" : "s"}
            </span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Automated recurring outflows processed by Inngest workflows
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {recurringItems.length === 0 ? (
            <div className="h-[180px] flex flex-col items-center justify-center text-muted-foreground text-xs space-y-1">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1" />
              <p className="font-medium text-slate-700">No active recurring commitments</p>
              <p className="text-slate-400">Recurring payments marked in transactions will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {recurringItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-slate-800">
                      {item.description || "Recurring Outflow"}
                    </p>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <span className="capitalize">{item.category}</span>
                      <span>•</span>
                      <span>Account: {item.account?.name || "Main"}</span>
                      {item.nextRecurringDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-purple-600 font-medium">
                            <Clock className="h-3 w-3" />
                            Next: {format(new Date(item.nextRecurringDate), "MMM dd, yyyy")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                      {item.recurringInterval}
                    </Badge>
                    <span className="font-mono font-bold text-rose-600">
                      ${parseFloat(item.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
