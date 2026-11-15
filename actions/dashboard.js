"use server";

import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

export async function getUserAccounts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  try {
    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Serialize accounts before sending to client
    const serializedAccounts = accounts.map(serializeTransaction);

    return serializedAccounts;
  } catch (error) {
    console.error(error.message);
  }
}

export async function createAccount(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Convert balance to float before saving
    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    // Check if this is the user's first account
    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    // If it's the first account, make it default regardless of user input
    // If not, use the user's preference
    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    // If this account should be default, unset other default accounts
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create new account
    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault, // Override the isDefault based on our logic
      },
    });

    // Serialize the account before returning
    const serializedAccount = serializeTransaction(account);

    revalidatePath("/dashboard");
    return { success: true, data: serializedAccount };
  } catch (error) {
    throw new Error(error.message);
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get all user transactions with account details
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  return transactions.map(serializeTransaction);
}

function generateDeterministicInsights(summary) {
  const savingsRate = summary.savingsRate || 0;
  const netSavings = summary.netSavings || 0;
  const totalExpenses = summary.totalExpenses || 0;
  const totalIncome = summary.totalIncome || 0;
  const budgetUsage = summary.budgetPercentage || 0;
  const recurringTotal = summary.recurringExpenses || 0;
  const topCat = summary.topCategories?.[0] || { name: "General Expenses", amount: 0, percentage: 0 };

  let score = 50;
  if (savingsRate >= 30) score += 30;
  else if (savingsRate >= 15) score += 20;
  else if (savingsRate > 0) score += 10;
  else score -= 25;

  if (summary.budgetAmount) {
    if (budgetUsage < 70) score += 15;
    else if (budgetUsage <= 85) score += 5;
    else score -= 15;
  } else {
    score += 5;
  }

  if (summary.anomaliesCount === 0) score += 5;
  else score -= Math.min(15, summary.anomaliesCount * 5);

  const finalScore = Math.max(10, Math.min(98, Math.round(score)));

  let healthStatus = "MODERATE";
  if (finalScore >= 80) healthStatus = "EXCELLENT";
  else if (finalScore >= 68) healthStatus = "HEALTHY";
  else if (finalScore >= 50) healthStatus = "MODERATE";
  else if (finalScore >= 35) healthStatus = "CAUTION";
  else healthStatus = "AT_RISK";

  const keyObservations = [];

  if (netSavings >= 0) {
    keyObservations.push({
      type: "positive",
      title: "Positive Net Cash Flow",
      description: `Retained $${netSavings.toFixed(2)} with a ${savingsRate.toFixed(1)}% savings rate across the selected timeframe.`,
    });
  } else {
    keyObservations.push({
      type: "warning",
      title: "Cash Flow Deficit Detected",
      description: `Outflows exceed inflows by $${Math.abs(netSavings).toFixed(2)}. Living expenses are outpacing current revenue.`,
    });
  }

  if (topCat.amount > 0) {
    keyObservations.push({
      type: topCat.percentage > 35 ? "warning" : "neutral",
      title: `Dominant Category: ${topCat.name}`,
      description: `${topCat.name} accounts for ${topCat.percentage}% ($${topCat.amount.toFixed(2)}) of total expenditure.`,
    });
  }

  if (recurringTotal > 0) {
    const recRatio = totalIncome > 0 ? (recurringTotal / totalIncome) * 100 : 0;
    keyObservations.push({
      type: recRatio > 40 ? "warning" : "neutral",
      title: "Fixed Commitments & Recurring Outflows",
      description: `$${recurringTotal.toFixed(2)} is committed to recurring subscriptions, bills, or loan obligations.`,
    });
  }

  return {
    executiveSummary: netSavings >= 0
      ? `Your portfolio maintained positive liquidity with $${totalIncome.toFixed(2)} in total revenue against $${totalExpenses.toFixed(2)} in operational expenses, yielding a solid ${savingsRate.toFixed(1)}% savings retention rate.`
      : `Spending ran at a deficit during this period with $${totalExpenses.toFixed(2)} in outflows exceeding $${totalIncome.toFixed(2)} in total inflows. Immediate attention to non-essential expense categories is recommended.`,
    healthScore: finalScore,
    healthStatus,
    keyObservations,
    topDriver: `${topCat.name} is your highest expense category ($${topCat.amount.toFixed(2)}). Reining in discretionary sub-items here provides the fastest path to increasing liquid cash flow.`,
    actionableRecommendations: [
      savingsRate < 20
        ? `Target a 20% minimum savings threshold by capping discretionary spending in ${topCat.name}.`
        : `Consider deploying surplus liquidity of $${netSavings.toFixed(2)} into automated high-yield savings or investment allocations.`,
      recurringTotal > 0
        ? `Review your ${summary.recurringCount || "active"} recurring subscriptions totaling $${recurringTotal.toFixed(2)} to identify redundant software or service fees.`
        : "Set up recurring tracking for regular utility and living commitments to improve predictive budgeting.",
      summary.budgetAmount
        ? `Maintain weekly tracking against your $${summary.budgetAmount.toFixed(2)} monthly budget to prevent late-month overruns.`
        : "Establish a formal monthly budget for your primary checking account to lock in baseline spending targets.",
    ],
  };
}

export async function getDashboardAIInsights(summary) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (!process.env.GEMINI_API_KEY) {
      return {
        success: true,
        data: generateDeterministicInsights(summary),
        isAiGenerated: false,
      };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
You are a senior financial data analyst and wealth intelligence system.
Analyze the following personal finance dataset for the period "${summary.period}":

Metrics:
- Total Inflow (Income): $${summary.totalIncome.toFixed(2)}
- Total Outflow (Expenses): $${summary.totalExpenses.toFixed(2)}
- Net Cash Flow: $${summary.netSavings.toFixed(2)} (Savings Rate: ${summary.savingsRate.toFixed(1)}%)
- Active Budget Target: $${summary.budgetAmount ? summary.budgetAmount.toFixed(2) : "None"}
- Current Month Expenses: $${summary.currentExpenses ? summary.currentExpenses.toFixed(2) : 0}
- Budget Usage: ${summary.budgetPercentage ? summary.budgetPercentage.toFixed(1) + "%" : "N/A"}
- Fixed/Recurring Outflows: $${summary.recurringExpenses.toFixed(2)} across ${summary.recurringCount} commitments
- Top Spending Categories: ${JSON.stringify(summary.topCategories)}
- Flagged Anomalies/Outliers: ${summary.anomaliesCount}

Provide a deep, realistic, actionable intelligence report formatted strictly as JSON with this structure:
{
  "executiveSummary": "2-3 precise sentences summarizing portfolio performance and cash flow velocity.",
  "healthScore": 82, // integer between 0 and 100 evaluating financial health
  "healthStatus": "EXCELLENT" | "HEALTHY" | "MODERATE" | "CAUTION" | "AT_RISK",
  "keyObservations": [
    { "type": "positive" | "warning" | "neutral", "title": "Short title", "description": "Specific finding based on the numbers" },
    { "type": "positive" | "warning" | "neutral", "title": "Short title", "description": "Specific finding based on the numbers" },
    { "type": "positive" | "warning" | "neutral", "title": "Short title", "description": "Specific finding based on the numbers" }
  ],
  "topDriver": "Clear explanation of primary expenditure driver and its impact on the user's capital.",
  "actionableRecommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2",
    "Specific recommendation 3"
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      success: true,
      data: parsed,
      isAiGenerated: true,
    };
  } catch (error) {
    console.error("Gemini AI insights generation error:", error);
    return {
      success: true,
      data: generateDeterministicInsights(summary),
      isAiGenerated: false,
    };
  }
}
