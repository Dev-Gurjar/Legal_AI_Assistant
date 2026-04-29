"use client";

import Link from "next/link";
import { Clock3, Coins, Scale, Shield, Users, GraduationCap, Map, FileText, ArrowRight } from "lucide-react";

const tools = [
  {
    href: "/dashboard/features/bail-predictor",
    title: "Bail Predictor",
    tagline: "\"What are his chances of getting bail?\"",
    description: "Score bail likelihood using CrPC/BNSS factors: offence type, flight risk, evidence strength, medical grounds. Get a 0-100 score with key factors and cautions to argue in court.",
    icon: Shield,
    color: "amber",
    who: "Criminal lawyers",
  },
  {
    href: "/dashboard/features/case-time",
    title: "Case Duration Estimator",
    tagline: "\"How long will this case take?\"",
    description: "Statistical P25/Median/P75 duration estimates by case type and court — Criminal, Civil, Family, Consumer, MACT, and more. Set realistic client expectations backed by data.",
    icon: Clock3,
    color: "blue",
    who: "All practitioners",
  },
  {
    href: "/dashboard/features/cost-estimator",
    title: "Stamp Duty Calculator",
    tagline: "\"How much will registration cost?\"",
    description: "State-wise stamp duty and registration fee estimates for Sale Deeds, Gift Deeds, Mortgages, POAs, Leases, and more across 14 Indian states. Saves clients from surprises.",
    icon: Coins,
    color: "emerald",
    who: "Property lawyers",
  },
  {
    href: "/dashboard/features/compensation",
    title: "Compensation Calculators",
    tagline: "\"How much compensation can we claim?\"",
    description: "Motor accident (Sarla Verma multiplier method), gratuity (Payment of Gratuity Act), and interim alimony estimators — all based on Supreme Court guidance.",
    icon: Scale,
    color: "primary",
    who: "Litigation counsel",
  },
  {
    href: "/dashboard/features/client-qa",
    title: "Client QA Assistant",
    tagline: "\"I keep answering the same client questions\"",
    description: "Search 37+ curated Q&As covering bail, FIR, divorce, property, employment, consumer rights, and POCSO — each with statutory references. Answer client calls faster.",
    icon: Users,
    color: "purple",
    who: "Junior associates",
  },
  {
    href: "/dashboard/features/case-flow",
    title: "Case Flow Explainer",
    tagline: "\"Client doesn't understand what happens next\"",
    description: "Step-by-step legal process for 9 case types — FIR/trial, bail, civil disputes, MACT, divorce, consumer, cheque bounce, writ, and labour — with typical timelines.",
    icon: Map,
    color: "teal",
    who: "Client-facing lawyers",
  },
  {
    href: "/dashboard/features/drafting",
    title: "Legal Drafting Templates",
    tagline: "\"Draft a legal notice for this client\"",
    description: "Professional templates for Legal Notice, Bail Application, Vakalatnama, Affidavit, Sale Agreement, Section 138 Demand Notice, and Leave & Licence Agreement. Export as DOCX.",
    icon: FileText,
    color: "rose",
    who: "Associates & paralegals",
  },
  {
    href: "/dashboard/features/intern-training",
    title: "Intern Training Academy",
    tagline: "\"Our interns need structured training\"",
    description: "5 structured modules on Constitutional Law, BNSS/CrPC, Property Law, Family Law, and Corporate Law — each with checklists, key cases, practice tasks, and graded quizzes.",
    icon: GraduationCap,
    color: "indigo",
    who: "Law firm managers",
  },
];

const colorMap: Record<string, string> = {
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  primary: "bg-primary/10 text-primary",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
};

export default function FeaturesHome() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold">Legal Practice Tools</h1>
        <p className="text-base text-muted-fg mt-2 leading-relaxed">
          Deterministic calculators and intelligent assistants built for Indian law practice — no AI hallucinations, verified statutory sources.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-2xl border border-border bg-surface p-5 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[tool.color]}`}>
                <tool.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{tool.title}</h2>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-border text-muted-fg">{tool.who}</span>
                </div>
                <p className="text-sm font-medium text-primary mt-0.5">{tool.tagline}</p>
                <p className="text-xs text-muted-fg mt-1.5 leading-relaxed">{tool.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-fg group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 flex items-start gap-4">
        <div className="w-2 h-full rounded-full bg-primary flex-shrink-0 self-stretch" />
        <div>
          <div className="font-semibold text-sm">All calculations are deterministic</div>
          <p className="text-xs text-muted-fg mt-1">These tools use verified statutory formulas and curated data — not AI generation. Results include the source statute or Supreme Court judgment used. Always verify with the relevant authority before advising clients.</p>
        </div>
      </div>
    </div>
  );
}
