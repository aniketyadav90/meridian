"use client";

import { AccountCard } from "./account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { BudgetProgress } from "./budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Building2 } from "lucide-react";

export function AccountsBudgetSection({
  accounts = [],
  budgetData = null,
}) {
  return (
    <div className="space-y-6 mb-6">
      {/* Budget Progress (Default Account) */}
      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />

      {/* Connected Accounts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-900">
              Connected Accounts & Wallets
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {accounts.length} Active Account{accounts.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CreateAccountDrawer>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30">
              <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full py-8">
                <div className="p-2.5 rounded-full bg-blue-100 text-blue-600 mb-2">
                  <Plus className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-800">Add New Account</p>
                <p className="text-xs text-slate-500 mt-0.5">Checking, Savings, or Cash Account</p>
              </CardContent>
            </Card>
          </CreateAccountDrawer>

          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      </div>
    </div>
  );
}
