"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, FileText, Settings, Scale, ArrowRight, Clock, Users, Coins, Shield, Map, GraduationCap, BookOpen } from "lucide-react";
import { adminApi, type UsageStats } from "@/lib/api";
import { useChatStore } from "@/lib/store";

const quickActions = [
  { href: "/dashboard/chat", label: "Ask a Legal Question", description: "RAG-powered answers from your documents", icon: MessageSquare, primary: true },
  { href: "/dashboard/documents", label: "Upload Documents", description: "PDF, DOCX — chunk, embed, and index", icon: FileText },
  { href: "/dashboard/features/bail-predictor", label: "Bail Predictor", description: "Score bail likelihood quickly", icon: Shield },
  { href: "/dashboard/features/case-time", label: "Case Duration", description: "Set realistic client timelines", icon: Clock },
  { href: "/dashboard/features/cost-estimator", label: "Stamp Duty", description: "Calculate registration costs", icon: Coins },
  { href: "/dashboard/features/client-qa", label: "Client FAQ", description: "Quick answers to common queries", icon: Users },
];

const tools = [
  { href: "/dashboard/features/case-flow", icon: Map, label: "Case Flow" },
  { href: "/dashboard/features/drafting", icon: BookOpen, label: "Drafting" },
  { href: "/dashboard/features/compensation", icon: Scale, label: "Compensation" },
  { href: "/dashboard/features/intern-training", icon: GraduationCap, label: "Training" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const { conversations } = useChatStore();

  useEffect(() => {
    adminApi.stats().then((res) => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-fg mt-1">Your AI-powered Indian legal practice workspace.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Documents", value: stats.total_documents },
            { label: "Conversations", value: stats.total_conversations },
            { label: "Messages", value: stats.total_messages },
            { label: "Queries Today", value: stats.queries_today },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-fg mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-muted-fg uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {quickActions.map(({ href, label, description, icon: Icon, primary }) => (
            <Link
              key={href}
              href={href}
              className={`group rounded-xl border p-4 flex items-start gap-3 transition-all hover:shadow-sm ${primary ? "border-primary bg-primary/5 hover:bg-primary/10" : "border-border bg-surface hover:border-primary/30"}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${primary ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{label}</div>
                <p className="text-xs text-muted-fg mt-0.5">{description}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-fg group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-fg uppercase tracking-wide">Recent Conversations</h2>
            <Link href="/dashboard/chat" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {conversations.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-6 text-center">
              <MessageSquare className="w-8 h-8 text-muted-fg mx-auto mb-2" />
              <p className="text-sm text-muted-fg">No conversations yet.</p>
              <Link href="/dashboard/chat" className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
                Start your first conversation <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.slice(0, 5).map((conv) => (
                <Link
                  key={conv.id}
                  href="/dashboard/chat"
                  className="block rounded-xl border border-border bg-surface px-4 py-3 hover:border-primary/30 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">{conv.title}</div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-fg group-hover:text-primary flex-shrink-0" />
                  </div>
                  <div className="text-xs text-muted-fg mt-0.5">{conv.message_count} message{conv.message_count !== 1 ? "s" : ""}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-fg uppercase tracking-wide">More Tools</h2>
            <Link href="/dashboard/features" className="text-xs text-primary hover:underline">All tools</Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {tools.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-xl border border-border bg-surface p-4 flex items-center gap-3 hover:border-primary/30 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">{label}</span>
              </Link>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-sm font-semibold mb-1">
              <Settings className="w-4 h-4 text-muted-fg" /> Workspace
            </div>
            <p className="text-xs text-muted-fg mb-3">Configure your workspace, manage users, and ingest your legal corpus.</p>
            <Link href="/dashboard/admin" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Open Admin Panel <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
