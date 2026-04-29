"use client";

import { useMemo, useState } from "react";
import { featureApi, type DraftTemplateResponse } from "@/lib/api";
import { FileText, Download, Copy, CheckCheck, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { getApiError } from "@/lib/api";

const TEMPLATES = [
  { id: "legal_notice", title: "Legal Notice (General)" },
  { id: "bail_application", title: "Bail Application (Section 483 BNSS)" },
  { id: "vakalatnama", title: "Vakalatnama (Power of Attorney to Advocate)" },
  { id: "affidavit_general", title: "General Affidavit" },
  { id: "sale_agreement", title: "Agreement for Sale of Property" },
  { id: "demand_notice_138", title: "Demand Notice (Section 138 NI Act — Cheque Bounce)" },
  { id: "rent_agreement", title: "Leave & Licence Agreement (Rent)" },
];

export default function DraftingPage() {
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [language, setLanguage] = useState("en");
  const [result, setResult] = useState<DraftTemplateResponse | null>(null);
  const [content, setContent] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentHi, setContentHi] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(true);

  const title = useMemo(
    () => TEMPLATES.find((t) => t.id === templateId)?.title ?? "Draft",
    [templateId]
  );

  const exportContent = useMemo(() => {
    if (result?.language === "bilingual") return `English\n${contentEn}\n\nHindi\n${contentHi}`.trim();
    return content;
  }, [result, content, contentEn, contentHi]);

  const placeholderCount = useMemo(() => {
    const matches = exportContent.match(/\{\{[^}]+\}\}/g);
    return matches ? new Set(matches).size : 0;
  }, [exportContent]);

  async function handleLoadTemplate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await featureApi.draftTemplate({ template_id: templateId, language });
      setResult(data);
      if (data.language === "bilingual") {
        setContentEn(data.content_en ?? "");
        setContentHi(data.content_hi ?? "");
        setContent("");
      } else {
        setContent(data.content ?? "");
        setContentEn(""); setContentHi("");
      }
    } catch (err: any) {
      toast.error(getApiError(err, "Failed to load template"));
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const response = await featureApi.draftExport({ title, content: exportContent, format: "docx" });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/\s+/g, "_")}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("DOCX exported");
    } catch (err: any) {
      toast.error(getApiError(err, "Export failed"));
    } finally {
      setExporting(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(exportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Legal Drafting Templates</h1>
        <p className="text-sm text-muted-fg mt-1">
          Load professional Indian legal document templates, fill in the {"{{"+"PLACEHOLDERS"+"}}"}, and export as DOCX.
        </p>
      </div>

      <form onSubmit={handleLoadTemplate} className="grid gap-4 md:grid-cols-3 items-end">
        <div className="space-y-1 md:col-span-2">
          <label className="block text-sm font-medium">Document Template</label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Language</label>
          <select
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="bilingual">Bilingual (EN + HI)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="md:col-span-3 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          {loading ? "Loading Template..." : "Load Template"}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{result.title}</div>
            <div className="flex items-center gap-2">
              {placeholderCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPlaceholders(!showPlaceholders)}
                  className="flex items-center gap-1.5 text-xs text-muted-fg hover:text-foreground"
                >
                  {showPlaceholders ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {placeholderCount} placeholder{placeholderCount !== 1 ? "s" : ""} remaining
                </button>
              )}
            </div>
          </div>

          {showPlaceholders && result.placeholders.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 px-4 py-3">
              <div className="text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1.5">Fill in these placeholders in the document below:</div>
              <div className="flex flex-wrap gap-1.5">
                {result.placeholders.map((p) => (
                  <code key={p} className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded text-xs font-mono text-amber-700 dark:text-amber-300">{`{{${p}}}`}</code>
                ))}
              </div>
            </div>
          )}

          {result.language === "bilingual" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">English</div>
                <textarea
                  className="w-full min-h-[400px] rounded-xl border border-border bg-background p-3 text-sm font-mono leading-relaxed resize-y"
                  value={contentEn}
                  onChange={(e) => setContentEn(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-fg uppercase tracking-wide">Hindi</div>
                <textarea
                  className="w-full min-h-[400px] rounded-xl border border-border bg-background p-3 text-sm font-mono leading-relaxed resize-y"
                  value={contentHi}
                  onChange={(e) => setContentHi(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <textarea
              className="w-full min-h-[500px] rounded-xl border border-border bg-background p-4 text-sm font-mono leading-relaxed resize-y"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-surface text-sm font-medium transition"
            >
              {copied ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy Text"}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || !exportContent}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-50 transition text-sm"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting..." : "Export DOCX"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
