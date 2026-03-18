"use client";

import { FileText, Trash2, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";
import { docsApi } from "@/lib/api";

interface Document {
  id: string;
  filename: string;
  status: string;
  chunk_count: number;
  created_at: string;
}

interface DocumentListProps {
  documents: Document[];
  onRefresh: () => void;
}

const statusConfig: Record<string, { icon: any; label: string; color: string }> = {
  ready: { icon: CheckCircle, label: "Ready", color: "text-success" },
  processed: { icon: CheckCircle, label: "Processed", color: "text-success" },
  processing: { icon: Loader2, label: "Processing", color: "text-primary" },
  pending: { icon: Clock, label: "Pending", color: "text-warning" },
  failed: { icon: AlertCircle, label: "Failed", color: "text-danger" },
};

export default function DocumentList({ documents, onRefresh }: DocumentListProps) {
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await docsApi.remove(id);
      toast.success("Document deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete document");
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-fg">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No documents uploaded yet</p>
        <p className="text-xs mt-1">Upload PDF or DOCX files to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-fg">Name</th>
            <th className="text-left py-3 px-4 font-medium text-muted-fg">Status</th>
            <th className="text-left py-3 px-4 font-medium text-muted-fg">Chunks</th>
            <th className="text-left py-3 px-4 font-medium text-muted-fg">Uploaded</th>
            <th className="text-right py-3 px-4 font-medium text-muted-fg">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const status = statusConfig[doc.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <tr
                key={doc.id}
                className="border-b border-border/50 hover:bg-muted/30 transition"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium truncate max-w-xs">
                      {doc.filename}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className={clsx("flex items-center gap-1.5", status.color)}>
                    <StatusIcon
                      className={clsx(
                        "w-3.5 h-3.5",
                        doc.status === "processing" && "animate-spin"
                      )}
                    />
                    <span className="text-xs font-medium">{status.label}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-fg">
                  {doc.chunk_count || "—"}
                </td>
                <td className="py-3 px-4 text-muted-fg">
                  {new Date(doc.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleDelete(doc.id, doc.filename)}
                    className="p-1.5 rounded hover:bg-danger/10 text-muted-fg hover:text-danger transition"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
