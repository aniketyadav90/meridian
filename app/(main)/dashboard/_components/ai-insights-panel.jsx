"use client";

import { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  Award,
  Bot,
  BrainCircuit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDashboardAIInsights } from "@/actions/dashboard";
import { toast } from "sonner";

export function AiInsightsPanel({ summaryData }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerateInsights = async () => {
    setLoading(true);
    try {
      const res = await getDashboardAIInsights(summaryData);
      if (res?.success && res?.data) {
        setInsights(res.data);
        setHasGenerated(true);
        if (res.isAiGenerated) {
          toast.success("AI Financial Intelligence generated via Gemini");
        } else {
          toast.info("Intelligence generated using deterministic financial heuristics");
        }
      } else {
        toast.error("Could not generate insights");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate AI insights");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "EXCELLENT":
        return <Badge className="bg-emerald-500 text-white font-bold">Excellent</Badge>;
      case "HEALTHY":
        return <Badge className="bg-emerald-600 text-white font-bold">Healthy</Badge>;
      case "MODERATE":
        return <Badge className="bg-blue-600 text-white font-bold">Moderate</Badge>;
      case "CAUTION":
        return <Badge className="bg-amber-500 text-white font-bold">Caution</Badge>;
      case "AT_RISK":
        return <Badge className="bg-rose-600 text-white font-bold">At Risk</Badge>;
      default:
        return <Badge variant="secondary">Evaluated</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 mb-6 relative overflow-hidden">
      {/* Decorative accent top glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            AI Financial Intelligence & Strategic Advisory
            <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
              Powered by Google Gemini
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Automated reasoning over your active cash flow, budget velocity, and category allocations
          </CardDescription>
        </div>

        <Button
          size="sm"
          onClick={handleGenerateInsights}
          disabled={loading}
          className="h-9 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Synthesizing Portfolio...
            </>
          ) : (
            <>
              <BrainCircuit className="h-3.5 w-3.5 mr-1.5" />
              {hasGenerated ? "Refresh Analysis" : "Generate AI Insights"}
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent className="pt-1">
        {!hasGenerated && !loading ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl border border-dashed border-slate-200 bg-white/60">
            <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 mb-3 shadow-inner">
              <Bot className="h-7 w-7" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">
              Personalized AI Intelligence is Ready
            </h4>
            <p className="text-xs text-slate-500 max-w-md mt-1 mb-4">
              Click &quot;Generate AI Insights&quot; to prompt Google Gemini to analyze your {summaryData.period} cash flow, detect spending drivers, and prescribe high-impact recommendations.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateInsights}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs"
            >
              Analyze Dataset Now
            </Button>
          </div>
        ) : loading ? (
          <div className="py-12 space-y-4">
            <div className="flex items-center justify-center gap-2 text-xs text-indigo-700 font-medium">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analyzing cash flow distributions, variance ratios, and budget velocity...</span>
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          </div>
        ) : insights ? (
          <div className="space-y-4">
            {/* Health Score & Executive Summary */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Score card */}
              <div className="md:col-span-3 bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Financial Health Score
                </span>
                <div className="relative flex items-center justify-center my-2">
                  <div className="text-4xl font-extrabold font-mono text-slate-900">
                    {insights.healthScore}
                    <span className="text-sm text-slate-400 font-normal">/100</span>
                  </div>
                </div>
                <div>{getStatusBadge(insights.healthStatus)}</div>
              </div>

              {/* Executive Summary */}
              <div className="md:col-span-9 bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-center shadow-xs text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-indigo-600" />
                  <span className="font-semibold text-slate-800">Portfolio Executive Summary</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {insights.executiveSummary}
                </p>
                {insights.topDriver && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] text-slate-700">
                    <span className="font-bold text-slate-900">Primary Outflow Driver: </span>
                    {insights.topDriver}
                  </div>
                )}
              </div>
            </div>

            {/* Observations & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Key Observations */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                <h5 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 border-b pb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                  Strategic Observations
                </h5>
                <div className="space-y-2 text-xs">
                  {insights.keyObservations?.map((obs, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                        obs.type === "positive"
                          ? "bg-emerald-50/60 border-emerald-100 text-emerald-900"
                          : obs.type === "warning"
                          ? "bg-amber-50/60 border-amber-100 text-amber-900"
                          : "bg-slate-50 border-slate-100 text-slate-800"
                      }`}
                    >
                      {obs.type === "positive" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold">{obs.title}</span>
                        <p className="text-[11px] opacity-90 mt-0.5">{obs.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                <h5 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 border-b pb-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  Actionable Recommendations
                </h5>
                <div className="space-y-2 text-xs">
                  {insights.actionableRecommendations?.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-start gap-2.5 text-slate-700"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

