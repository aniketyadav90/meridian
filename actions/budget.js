"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { sendEmail } from "./send-email";
import EmailTemplate from "@/emails/template";

export async function getCurrentBudget(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const budget = await db.budget.findFirst({
      where: {
        userId: user.id,
      },
    });

    // Get current month's expenses
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        ...(accountId ? { accountId } : {}),
      },
      _sum: {
        amount: true,
      },
    });

    return {
      budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
      currentExpenses: expenses._sum.amount
        ? expenses._sum.amount.toNumber()
        : 0,
    };
  } catch (error) {
    console.error("Error fetching budget:", error);
    throw error;
  }
}

export async function updateBudget(amount) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Update or create budget
    const budget = await db.budget.upsert({
      where: {
        userId: user.id,
      },
      update: {
        amount,
      },
      create: {
        userId: user.id,
        amount,
      },
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: error.message };
  }
}

function isNewDayOrNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getDate() !== currentDate.getDate() ||
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

export async function checkBudgetAlert(userId, accountId) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { accounts: true },
    });

    if (!user || !user.email) return;

    const budget = await db.budget.findFirst({
      where: { userId: user.id },
    });

    if (!budget || !budget.amount) return;

    const budgetAmount = budget.amount.toNumber
      ? budget.amount.toNumber()
      : parseFloat(budget.amount);

    if (budgetAmount <= 0) return;

    const targetAccount =
      user.accounts.find((a) => a.id === accountId && a.isDefault) ||
      user.accounts.find((a) => a.isDefault) ||
      user.accounts.find((a) => a.id === accountId) ||
      user.accounts[0];

    if (!targetAccount) return;

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        accountId: targetAccount.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalExpenses = expenses._sum.amount
      ? (expenses._sum.amount.toNumber ? expenses._sum.amount.toNumber() : parseFloat(expenses._sum.amount))
      : 0;

    const percentageUsed = (totalExpenses / budgetAmount) * 100;

    // Trigger if expenses >= 80% of budget
    if (percentageUsed >= 80) {
      const shouldSend =
        !budget.lastAlertSent ||
        isNewDayOrNewMonth(new Date(budget.lastAlertSent), currentDate);

      if (shouldSend) {
        console.log(`[Budget Alert] Threshold reached (${percentageUsed.toFixed(1)}%). Sending alert to ${user.email}`);

        const result = await sendEmail({
          to: user.email,
          subject: `⚠️ Budget Alert: ${percentageUsed >= 100 ? "Budget Limit Exceeded" : "80% of Budget Used"} (${targetAccount.name})`,
          react: EmailTemplate({
            userName: user.name || "User",
            type: "budget-alert",
            data: {
              percentageUsed,
              budgetAmount: budgetAmount.toFixed(1),
              totalExpenses: totalExpenses.toFixed(1),
              accountName: targetAccount.name,
            },
          }),
        });

        if (result?.success) {
          await db.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: new Date() },
          });
          console.log(`[Budget Alert] Successfully sent alert to ${user.email}`);
        } else {
          console.error(`[Budget Alert] Resend failed:`, result?.error);
        }
      }
    }
  } catch (error) {
    console.error("Error in checkBudgetAlert:", error);
  }
}

export async function testSendBudgetAlert() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { accounts: true },
    });

    if (!user || !user.email) throw new Error("User email not found");

    const budget = await db.budget.findFirst({
      where: { userId: user.id },
    });

    const defaultAccount =
      user.accounts.find((a) => a.isDefault) || user.accounts[0];

    const budgetAmount = budget?.amount
      ? (budget.amount.toNumber ? budget.amount.toNumber() : parseFloat(budget.amount))
      : 1000;

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const expenses = await db.transaction.aggregate({
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        ...(defaultAccount ? { accountId: defaultAccount.id } : {}),
      },
      _sum: {
        amount: true,
      },
    });

    const totalExpenses = expenses._sum.amount
      ? (expenses._sum.amount.toNumber ? expenses._sum.amount.toNumber() : parseFloat(expenses._sum.amount))
      : 850;

    const percentageUsed = (totalExpenses / budgetAmount) * 100;

    console.log(`[testSendBudgetAlert] Sending test email to ${user.email}`);

    const result = await sendEmail({
      to: user.email,
      subject: `[Test] Budget Alert: ${percentageUsed >= 100 ? "Limit Exceeded" : "80% of Budget Used"} (${defaultAccount?.name || "Main Account"})`,
      react: EmailTemplate({
        userName: user.name || "User",
        type: "budget-alert",
        data: {
          percentageUsed,
          budgetAmount: budgetAmount.toFixed(1),
          totalExpenses: totalExpenses.toFixed(1),
          accountName: defaultAccount?.name || "Main Account",
        },
      }),
    });

    if (result.success) {
      return {
        success: true,
        recipient: result.recipient || user.email,
        message: `Email successfully sent to ${result.recipient || user.email}!`,
      };
    } else {
      return {
        success: false,
        error: result.error,
        recipient: user.email,
      };
    }
  } catch (error) {
    console.error("Error in testSendBudgetAlert:", error);
    return { success: false, error: error.message };
  }
}

