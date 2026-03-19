"use client";

import Link from "next/link";
import {
  Scale,
  MessageSquare,
  FileText,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Nav ──────────────────────────────────────────── */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Scale className="w-6 h-6 text-primary" />
            <span>RAG Legal Assistant</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-hover transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary-light px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-4 h-4" /> AI-Powered Legal Workflow Assistant
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Your legal documents,
            <br />
            <span className="text-primary">understood and drafted instantly.</span>
          </h1>
          <p className="text-lg text-muted-fg max-w-xl mx-auto mb-10">
            Upload case files, contracts, and notices. Summarize documents,
            discover related cases, draft legal text, and get cited answers in
            seconds.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover transition"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-lg border border-border hover:bg-muted transition"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/50 px-6 py-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              icon: MessageSquare,
              title: "Legal Query Answering",
              desc: "Ask legal questions in plain language and receive focused answers with supporting context from your files.",
            },
            {
              icon: FileText,
              title: "Summarization & Drafting",
              desc: "Generate concise legal summaries and structured drafts such as notices, petitions, and contract clauses.",
            },
            {
              icon: Shield,
              title: "Case Discovery",
              desc: "Retrieve related case context quickly using semantic search over your indexed legal corpus.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-background rounded-xl border border-border p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-muted-fg text-sm leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-fg">
        © {new Date().getFullYear()} RAG Legal Assistant. Built for legal
        professionals.
      </footer>
    </div>
  );
}
