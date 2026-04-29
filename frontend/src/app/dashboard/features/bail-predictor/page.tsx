"use client";

import { useState } from "react";
import { featureApi, type BailPredictResponse } from "@/lib/api";
import { ShieldCheck, ShieldAlert, ShieldOff, AlertTriangle, CheckCircle, Info } from "lucide-react";

const OFFENSE_OPTIONS = [
  "BNS Section 103 (Murder)",
  "BNS Section 64 (Rape)",
  "BNS Section 310 (Dacoity)",
  "BNS Section 309 (Robbery)",
  "BNS Section 317 (Extortion)",
  "BNS Section 85 (Cruelty by husband/relatives)",
  "BNS Section 318 (Cheating)",
  "BNS Section 308 (Theft)",
  "BNS Section 115 (Voluntarily causing hurt)",
  "NDPS Act - Commercial Quantity",
  "NDPS Act - Small Quantity",
  "Prevention of Corruption Act",
  "IBC - Section 69 (Fraudulent trading)",
  "NI Act Section 138 (Cheque bounce)",
  "Other non-bailable offence",
];

function fmt(score: number) {
  if (score >= 70) return { label: "High Likelihood", color: "emerald", Icon: ShieldCheck };
  if (score >= 40) return { label: "Moderate Likelihood", color: "amber", Icon: ShieldAlert };
  return { label: "Low Likelihood", color: "red", Icon: ShieldOff };
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      {hint && <p className="text-xs text-muted-fg">{hint}</p>}
      {children}
    </div>
  );
}

export default function BailPredictorPage() {
  const [offenseType, setOffenseType] = useState(OFFENSE_OPTIONS[7]);
  const [maxPunishment, setMaxPunishment] = useState(3);
  const [isBailable, setIsBailable] = useState(false);
  const [hasPrior, setHasPrior] = useState(false);
  const [flightRisk, setFlightRisk] = useState("low");
  const [evidenceStrength, setEvidenceStrength] = useState("medium");
  const [age, setAge] = useState(32);
  const [medical, setMedical] = useState(false);
  const [womanChild, setWomanChild] = useState(false);
  const [custodyDays, setCustodyDays] = useState(14);
  const [result, setResult] = useState<BailPredictResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await featureApi.bailPredict({
        offense_type: offenseType,
        max_punishment_years: maxPunishment,
        is_bailable: isBailable,
        has_prior_conviction: hasPrior,
        flight_risk: flightRisk,
        evidence_strength: evidenceStrength,
        accused_age: age,
        has_medical_grounds: medical,
        is_woman_or_child: womanChild,
        custody_days: custodyDays,
      });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  const verdict = result ? fmt(result.likelihood_score) : null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Bail Predictor</h1>
        <p className="text-sm text-muted-fg mt-1">
          Heuristic scoring under CrPC/BNSS bail principles. Not legal advice — use as a first assessment tool.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Offence" hint="Select the primary offence charged">
            <select
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              value={offenseType}
              onChange={(e) => setOffenseType(e.target.value)}
            >
              {OFFENSE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>

          <Field label="Maximum Punishment (years)" hint="As prescribed by the offence statute">
            <input
              type="number" min={0} max={99}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              value={maxPunishment}
              onChange={(e) => setMaxPunishment(Number(e.target.value))}
            />
          </Field>

          <Field label="Flight Risk">
            <select
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              value={flightRisk}
              onChange={(e) => setFlightRisk(e.target.value)}
            >
              <option value="low">Low — Strong roots in society, surrendered voluntarily</option>
              <option value="medium">Medium — Some concern, travel history</option>
              <option value="high">High — Absconded before, foreign ties, no fixed address</option>
            </select>
          </Field>

          <Field label="Evidence Strength">
            <select
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              value={evidenceStrength}
              onChange={(e) => setEvidenceStrength(e.target.value)}
            >
              <option value="low">Weak — Circumstantial, no eyewitness</option>
              <option value="medium">Medium — Mixed direct and indirect evidence</option>
              <option value="high">Strong — CCTV, eyewitnesses, forensics on record</option>
            </select>
          </Field>

          <Field label="Accused Age">
            <input
              type="number" min={14} max={99}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
            />
          </Field>

          <Field label="Days in Custody">
            <input
              type="number" min={0}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              value={custodyDays}
              onChange={(e) => setCustodyDays(Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {[
            { state: isBailable, set: setIsBailable, label: "Bailable Offence" },
            { state: hasPrior, set: setHasPrior, label: "Prior Conviction" },
            { state: medical, set: setMedical, label: "Medical Grounds" },
            { state: womanChild, set: setWomanChild, label: "Woman / Child" },
          ].map(({ state, set, label }) => (
            <label key={label} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${state ? "border-primary bg-primary/5" : "border-border"}`}>
              <input type="checkbox" className="hidden" checked={state} onChange={(e) => set(e.target.checked)} />
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${state ? "border-primary bg-primary" : "border-muted-fg"}`}>
                {state && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-50 transition"
        >
          {loading ? "Analysing..." : "Assess Bail Likelihood"}
        </button>
      </form>

      {result && verdict && (
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-${verdict.color}-100 dark:bg-${verdict.color}-900/20`}>
              <verdict.Icon className={`w-8 h-8 text-${verdict.color}-600`} />
            </div>
            <div>
              <div className="text-2xl font-bold">{result.likelihood_score.toFixed(0)}<span className="text-base font-normal text-muted-fg">/100</span></div>
              <div className={`text-sm font-semibold text-${verdict.color}-600 mt-0.5`}>{verdict.label}</div>
            </div>
            <div className="ml-auto">
              <div className="w-32 h-2.5 rounded-full bg-border overflow-hidden">
                <div
                  className={`h-full rounded-full bg-${verdict.color}-500 transition-all`}
                  style={{ width: `${result.likelihood_score}%` }}
                />
              </div>
            </div>
          </div>

          {result.key_factors.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 mb-2">
                <CheckCircle className="w-4 h-4" /> Factors Favouring Bail
              </div>
              <div className="flex flex-wrap gap-2">
                {result.key_factors.map((f, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium dark:bg-emerald-900/20 dark:text-emerald-400">{f}</span>
                ))}
              </div>
            </div>
          )}

          {result.cautions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-red-700 mb-2">
                <AlertTriangle className="w-4 h-4" /> Grounds Likely to be Raised Against Bail
              </div>
              <div className="flex flex-wrap gap-2">
                {result.cautions.map((c, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium dark:bg-red-900/20 dark:text-red-400">{c}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-muted-fg border-t border-border pt-4">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>{result.reference}</span>
          </div>
        </div>
      )}
    </div>
  );
}
