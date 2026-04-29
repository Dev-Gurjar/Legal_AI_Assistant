"use client";

import { useState, useRef } from "react";
import { Send, Loader2, Upload } from "lucide-react";
import type { LegalTask } from "@/lib/api";
import { useUIStore } from "@/lib/store";
import { t, uiLocaleFromLanguage } from "@/lib/i18n";

interface ChatInputProps {
  onSend: (message: string, task: LegalTask) => void;
  onUploadCase: (file: File) => void;
  loading: boolean;
}

export default function ChatInput({ onSend, onUploadCase, loading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [task, setTask] = useState<LegalTask>("query_answering");
  const { persona, setPersona, language, setLanguage } = useUIStore();
  const locale = uiLocaleFromLanguage(language);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    onSend(trimmed, task);
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handlePickUpload() {
    uploadRef.current?.click();
  }

  function onUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || loading) return;
    onUploadCase(file);
    e.target.value = "";
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setMessage(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-surface p-4">
      <div className="max-w-3xl mx-auto space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3">
            <label
              htmlFor="task"
              className="text-xs font-semibold uppercase tracking-wide text-muted-fg"
            >
              {t(locale, "task")}
            </label>
            <select
              id="task"
              value={task}
              onChange={(e) => setTask(e.target.value as LegalTask)}
              disabled={loading}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            >
              <option value="summarization">Document Summarization</option>
              <option value="case_discovery">Case Discovery</option>
              <option value="query_answering">Legal Query Answering</option>
              <option value="drafting">Legal Drafting</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="language"
              className="text-xs font-semibold uppercase tracking-wide text-muted-fg"
            >
              {t(locale, "language")}
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
              disabled={loading}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            >
              <option value="auto">Auto</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="bilingual">Bilingual</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="persona"
              className="text-xs font-semibold uppercase tracking-wide text-muted-fg"
            >
              {t(locale, "persona")}
            </label>
            <select
              id="persona"
              value={persona}
              onChange={(e) => setPersona(e.target.value as typeof persona)}
              disabled={loading}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
            >
              <option value="practitioner">Practitioner</option>
              <option value="learner">Learner</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 items-end">
          <input
            ref={uploadRef}
            type="file"
            accept=".pdf,.docx"
            onChange={onUploadChange}
            className="hidden"
            disabled={loading}
          />
          <button
            type="button"
            onClick={handlePickUpload}
            disabled={loading}
            className="p-3 rounded-xl border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 transition shrink-0"
            title={t(locale, "upload_case")}
          >
            <Upload className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={autoResize}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you need help with, then submit..."
            rows={1}
            className="flex-1 resize-none px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-fg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-sm leading-relaxed"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="p-3 rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition shrink-0"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
