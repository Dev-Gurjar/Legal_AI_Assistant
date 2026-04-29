"use client";

import { useState } from "react";
import { featureApi, type CostEstimateResponse } from "@/lib/api";
import { Coins, Info, BookOpen } from "lucide-react";

const DOCUMENT_TYPES = [
  "Sale Deed",
  "Gift Deed",
  "Lease Agreement",
  "Mortgage Deed",
  "Power of Attorney",
  "Affidavit",
  "Settlement Deed",
  "Partnership Deed",
];

const STATES = [
  "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Uttar Pradesh",
  "Rajasthan", "Gujarat", "West Bengal", "Telangana", "Kerala",
  "Madhya Pradesh", "Andhra Pradesh", "Punjab", "Haryana",
];

function inr(value: number) {
  if (value === 0) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export default function CostEstimatorPage() {
  const [documentType, setDocumentType] = useState("Sale Deed");
  const [state, setState] = useState("Maharashtra");
  const [value, setValue] = useState(5000000);
  const [result, setResult] = useState<CostEstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await featureApi.costEstimate({
        document_type: documentType,
        state,
        transaction_value: value,
      });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Stamp Duty & Registration Fee Estimator</h1>
        <p className="text-sm text-muted-fg mt-1">
          State-wise stamp duty and registration costs for Indian property and legal documents.
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>Stamp duty is calculated on the higher of market value or agreement value. Registration fee is typically 1% of value (state-specific caps apply). Always verify with the Sub-Registrar office.</span>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3 items-end">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Document Type</label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            {DOCUMENT_TYPES.map((dt) => <option key={dt}>{dt}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">State</label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            {STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Transaction Value (₹)</label>
          <input
            type="number" min={0} step={10000}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="md:col-span-3 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-50 transition"
        >
          {loading ? "Calculating..." : "Calculate Stamp Duty"}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="px-6 py-5 bg-primary/5 border-b border-border">
              <div className="flex items-center gap-3">
                <Coins className="w-6 h-6 text-primary" />
                <div>
                  <div className="text-xs text-muted-fg font-medium uppercase tracking-wide">Total Estimated Cost</div>
                  <div className="text-3xl font-bold text-primary">{inr(result.total_fee)}</div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {[
                { label: "Transaction Value", value: inr(result.transaction_value) },
                { label: "Base / Minimum Fee", value: inr(result.base_fee) },
                { label: "Stamp Duty Rate", value: result.rate_percent > 0 ? `${result.rate_percent}%` : "Flat fee" },
                { label: "Variable Fee (rate × value)", value: result.rate_percent > 0 ? inr(result.transaction_value * result.rate_percent / 100) : "—" },
                { label: "Cap / Maximum", value: result.max_fee > 0 ? inr(result.max_fee) : "No cap" },
                { label: "Stamp Duty Total", value: inr(result.total_fee), bold: true },
              ].map(({ label, value, bold }) => (
                <div key={label} className={`flex justify-between items-center px-6 py-3 ${bold ? "font-semibold bg-primary/5" : ""}`}>
                  <span className="text-sm text-muted-fg">{label}</span>
                  <span className={`text-sm ${bold ? "text-primary" : ""}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-xs text-muted-fg">
            <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <span className="font-semibold text-foreground">Source: </span>
              {result.source}
              <p className="mt-1">Note: Registration fee (typically 1% of value) is payable separately to the Sub-Registrar and is not included above.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
