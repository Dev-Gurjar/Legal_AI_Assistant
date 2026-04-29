"use client";

import { useState } from "react";
import { featureApi, type CaseTimeEstimateResponse } from "@/lib/api";
import { Clock, AlertTriangle, Info, TrendingUp } from "lucide-react";

const CASE_COURTS: Record<string, string[]> = {
  "Criminal": ["Sessions Court", "High Court", "Supreme Court"],
  "Civil": ["District Court", "High Court", "Supreme Court"],
  "Motor Accident": ["Motor Accident Claims Tribunal", "High Court"],
  "Matrimonial": ["Family Court", "High Court"],
  "Property Dispute": ["District Court", "High Court"],
  "Consumer": ["District Consumer Forum", "State Consumer Commission"],
  "Cheque Bounce": ["Magistrate Court"],
  "Labour": ["Labour Court", "High Court"],
};

function fmtDays(days: number) {
  if (days === 0) return "N/A";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  const y = Math.floor(days / 365);
  const m = Math.round((days % 365) / 30);
  return m > 0 ? `${y}y ${m}mo` : `${y}y`;
}

export default function CaseTimeEstimatorPage() {
  const [caseType, setCaseType] = useState("Criminal");
  const [court, setCourt] = useState("Sessions Court");
  const [result, setResult] = useState<CaseTimeEstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  function handleCaseTypeChange(val: string) {
    setCaseType(val);
    setCourt(CASE_COURTS[val]?.[0] ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await featureApi.caseTimeEstimate({ case_type: caseType, court });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Case Duration Estimator</h1>
        <p className="text-sm text-muted-fg mt-1">
          Statistical estimates from sample Indian court data. Plan client timelines with confidence intervals.
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Estimates are based on a sample dataset. The P25–P75 range represents where 50% of cases fall. Actual timelines vary by judge, district, and case complexity.</span>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3 items-end">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Case Type</label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            value={caseType}
            onChange={(e) => handleCaseTypeChange(e.target.value)}
          >
            {Object.keys(CASE_COURTS).map((ct) => <option key={ct}>{ct}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Court</label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            value={court}
            onChange={(e) => setCourt(e.target.value)}
          >
            {(CASE_COURTS[caseType] ?? []).map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-50 transition"
        >
          {loading ? "Estimating..." : "Estimate Duration"}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          {result.warning && (
            <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {result.warning}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Fastest 25%", value: result.p25_days, sub: fmtDays(result.p25_days), color: "emerald" },
              { label: "Median (Typical)", value: result.median_days, sub: fmtDays(result.median_days), color: "primary" },
              { label: "Slower 25%", value: result.p75_days, sub: fmtDays(result.p75_days), color: "amber" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className={`rounded-xl border border-border bg-surface p-5 text-center`}>
                <div className="text-xs text-muted-fg font-medium uppercase tracking-wide mb-1">{label}</div>
                <div className="text-3xl font-bold">{value > 0 ? value : "—"}</div>
                <div className="text-sm text-muted-fg mt-0.5">{value > 0 ? `days  (≈ ${sub})` : "No data"}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="w-4 h-4 text-primary" /> Duration Distribution
              </div>
              <div className="text-xs text-muted-fg">n = {result.sample_size} cases</div>
            </div>

            {result.histogram.length > 0 ? (
              <div className="space-y-2">
                {(() => {
                  const maxCount = Math.max(...result.histogram.map((b) => b.count));
                  return result.histogram.map((bucket, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="text-xs text-muted-fg w-24 text-right">{bucket.range}d</div>
                      <div className="flex-1 h-5 rounded bg-border/50 overflow-hidden">
                        <div
                          className="h-full rounded bg-primary/60 transition-all"
                          style={{ width: maxCount > 0 ? `${(bucket.count / maxCount) * 100}%` : "0%" }}
                        />
                      </div>
                      <div className="text-xs text-muted-fg w-8">{bucket.count}</div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="text-sm text-muted-fg">No histogram data available</div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-fg">
            <Clock className="w-3.5 h-3.5" />
            <span>Source: {result.data_source} data — {result.case_type} at {result.court}</span>
          </div>
        </div>
      )}
    </div>
  );
}
