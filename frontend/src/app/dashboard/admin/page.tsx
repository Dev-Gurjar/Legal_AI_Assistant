"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  FileText,
  MessageSquare,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface UsageStats {
  total_documents: number;
  total_chunks: number;
  total_conversations: number;
  total_messages: number;
}

export default function AdminPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.tenant(), adminApi.stats()])
      .then(([tenantRes, statsRes]) => {
        setTenant(tenantRes.data);
        setStats(statsRes.data);
      })
      .catch(() => toast.error("Failed to load admin data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-fg">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  const statCards = [
    {
      label: "Documents",
      value: stats?.total_documents ?? 0,
      icon: FileText,
      color: "text-primary",
    },
    {
      label: "Chunks Indexed",
      value: stats?.total_chunks ?? 0,
      icon: HardDrive,
      color: "text-success",
    },
    {
      label: "Conversations",
      value: stats?.total_conversations ?? 0,
      icon: MessageSquare,
      color: "text-warning",
    },
    {
      label: "Messages",
      value: stats?.total_messages ?? 0,
      icon: Users,
      color: "text-danger",
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-fg mt-1">
          Overview of your workspace usage
        </p>
      </div>

      {/* Tenant info */}
      {tenant && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-fg mb-3">
            Workspace
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-fg">Name</span>
              <p className="font-medium">{tenant.name}</p>
            </div>
            <div>
              <span className="text-muted-fg">Slug</span>
              <p className="font-mono font-medium">{tenant.slug}</p>
            </div>
            <div>
              <span className="text-muted-fg">Created</span>
              <p className="font-medium">
                {new Date(tenant.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-fg">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
