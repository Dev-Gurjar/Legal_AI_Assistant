"use client";

import { useState } from "react";
import { featureApi, type ClientQaResponse } from "@/lib/api";
import { Search, MessageCircleQuestion, BookOpen, Tag, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import { getApiError } from "@/lib/api";

const QUICK_QUESTIONS = [
  "What are my rights if arrested?",
  "How do I file a consumer complaint?",
  "What is anticipatory bail?",
  "How long does mutual consent divorce take?",
  "What is gratuity and when am I eligible?",
  "What is cheque bounce and what are the consequences?",
];

export default function ClientQaPage() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<ClientQaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  async function search(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    setExpanded(null);
    try {
      const { data } = await featureApi.clientQa({ question: q, top_k: 3 });
      setResult(data);
    } catch (err: any) {
      toast.error(getApiError(err, "Search failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await search(question);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Client QA Assistant</h1>
        <p className="text-sm text-muted-fg mt-1">
          Find answers to common Indian legal questions from a curated corpus of 37+ Q&As covering criminal, family, property, and employment law.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How do I file an FIR?"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-50 transition"
        >
          {loading ? "..." : "Search"}
        </button>
      </form>

      {!result && !loading && (
        <div>
          <div className="text-xs font-semibold text-muted-fg uppercase tracking-wide mb-3">Common Questions</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => { setQuestion(q); search(q); }}
                className="text-left px-4 py-3 rounded-xl border border-border bg-surface hover:border-primary/40 transition text-sm text-muted-fg hover:text-foreground flex items-start gap-2"
              >
                <MessageCircleQuestion className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-fg animate-pulse">
          <Search className="w-4 h-4" /> Searching corpus...
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="text-sm text-muted-fg">
            Showing {result.results.length} result{result.results.length !== 1 ? "s" : ""} for <span className="font-medium text-foreground">&ldquo;{result.query}&rdquo;</span>
          </div>
          {result.results.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted-fg text-sm">
              No matching answers found. Try rephrasing your question.
            </div>
          )}
          {result.results.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-surface overflow-hidden"
            >
              <button
                className="w-full text-left px-5 py-4 flex items-start justify-between gap-3"
                onClick={() => setExpanded(expanded === idx ? null : idx)}
              >
                <div className="flex items-start gap-3">
                  <MessageCircleQuestion className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span className="font-semibold text-sm">{item.question}</span>
                </div>
                {expanded === idx ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-muted-fg" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-fg" />}
              </button>

              {expanded === idx && (
                <div className="px-5 pb-5 space-y-3 border-t border-border">
                  <p className="text-sm leading-relaxed pt-4">{item.answer}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                  {item.reference && (
                    <div className="flex items-start gap-1.5 text-xs text-muted-fg">
                      <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{item.reference}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
