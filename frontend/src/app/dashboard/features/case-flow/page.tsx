"use client";

import { useState } from "react";
import { featureApi, type CaseFlowResponse } from "@/lib/api";
import { Map, AlertTriangle, BookOpen, Clock, ChevronRight } from "lucide-react";

const CASE_TYPES = [
  "Criminal (FIR / Trial)",
  "Bail Application (Non-Bailable Offence)",
  "Civil Property Dispute",
  "Motor Accident Compensation",
  "Divorce (Contested)",
  "Consumer Complaint",
  "Cheque Bounce (Section 138 NI Act)",
  "Writ Petition (High Court)",
  "Labour / Wrongful Termination",
];

const COURT_MAP: Record<string, string> = {
  "Criminal (FIR / Trial)": "Sessions Court",
  "Bail Application (Non-Bailable Offence)": "Sessions Court / High Court",
  "Civil Property Dispute": "District Court",
  "Motor Accident Compensation": "Motor Accident Claims Tribunal",
  "Divorce (Contested)": "Family Court",
  "Consumer Complaint": "District Consumer Commission",
  "Cheque Bounce (Section 138 NI Act)": "Magistrate Court (JMFC / CJM)",
  "Writ Petition (High Court)": "High Court",
  "Labour / Wrongful Termination": "Labour Court / Industrial Tribunal",
};

const STATES = [
  "All India", "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Uttar Pradesh",
  "Rajasthan", "Gujarat", "West Bengal", "Telangana", "Kerala",
];

export default function CaseFlowPage() {
  const [caseType, setCaseType] = useState(CASE_TYPES[0]);
  const [state, setState] = useState("All India");
  const [result, setResult] = useState<CaseFlowResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const courtLevel = COURT_MAP[caseType] ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await featureApi.caseFlow({
        case_type: caseType,
        court_level: courtLevel,
        state: state === "All India" ? undefined : state,
      });
      setResult(data);
      setExpanded(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Case Flow Explainer</h1>
        <p className="text-sm text-muted-fg mt-1">
          Step-by-step legal process with typical timelines and key references. Useful for setting client expectations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3 items-end">
        <div className="space-y-1 md:col-span-2">
          <label className="block text-sm font-medium">Case Type</label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            value={caseType}
            onChange={(e) => setCaseType(e.target.value)}
          >
            {CASE_TYPES.map((ct) => <option key={ct}>{ct}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">State (optional)</label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            {STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="md:col-span-3">
          <div className="text-xs text-muted-fg mb-2">Court: <span className="font-medium text-foreground">{courtLevel}</span></div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-50 transition"
          >
            {loading ? "Loading..." : "Show Case Flow"}
          </button>
        </div>
      </form>

      {result && (
        <div className="space-y-4">
          {result.warning && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {result.warning}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm font-semibold">
            <Map className="w-4 h-4 text-primary" />
            {result.case_type}
            {result.court_level && <span className="text-muted-fg font-normal">· {result.court_level}</span>}
          </div>

          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-3">
              {(result.steps as any[]).map((step: any, idx: number) => {
                const isOpen = expanded === idx;
                const stepNum = step.step ?? idx + 1;
                return (
                  <div
                    key={idx}
                    className="relative pl-12 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : idx)}
                  >
                    <div className="absolute left-3 top-3 w-5 h-5 rounded-full border-2 border-primary bg-background flex items-center justify-center text-xs font-bold text-primary">
                      {stepNum}
                    </div>
                    <div className={`rounded-xl border ${isOpen ? "border-primary/30 bg-primary/5" : "border-border bg-surface"} p-4 transition-colors`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-sm">{step.title}</div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {step.typical_duration && (
                            <div className="flex items-center gap-1 text-xs text-muted-fg bg-border/50 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" /> {step.typical_duration}
                            </div>
                          )}
                          <ChevronRight className={`w-4 h-4 text-muted-fg transition-transform ${isOpen ? "rotate-90" : ""}`} />
                        </div>
                      </div>
                      {isOpen && step.description && (
                        <p className="text-sm text-muted-fg mt-2 leading-relaxed">{step.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {result.references.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-1.5 text-sm font-semibold mb-2">
                <BookOpen className="w-4 h-4 text-primary" /> Legal References
              </div>
              <ul className="space-y-1">
                {result.references.map((ref, i) => (
                  <li key={i} className="text-xs text-muted-fg">· {ref}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
