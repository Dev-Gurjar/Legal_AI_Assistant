"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentList from "@/components/DocumentList";
import { docsApi } from "@/lib/api";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    try {
      const { data } = await docsApi.list();
      setDocuments(data.documents || data);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  useEffect(() => {
    const hasInFlight = documents.some(
      (d) => d?.status === "pending" || d?.status === "processing"
    );
    if (!hasInFlight) return;

    const timer = setInterval(() => {
      fetchDocs();
    }, 3000);

    return () => clearInterval(timer);
  }, [documents, fetchDocs]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Documents
          </h1>
          <p className="text-sm text-muted-fg mt-1">
            Upload and manage your legal documents
          </p>
        </div>
        <button
          onClick={fetchDocs}
          className="p-2 rounded-lg hover:bg-muted transition"
          title="Refresh"
        >
          <RefreshCw className="w-4.5 h-4.5 text-muted-fg" />
        </button>
      </div>

      {/* Upload area */}
      <DocumentUpload onUploaded={fetchDocs} />

      {/* Document list */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-fg">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading documents...
          </div>
        ) : (
          <DocumentList documents={documents} onRefresh={fetchDocs} />
        )}
      </div>
    </div>
  );
}
