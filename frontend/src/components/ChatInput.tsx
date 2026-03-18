"use client";

import { useState, useRef } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
}

export default function ChatInput({ onSend, loading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    onSend(trimmed);
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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
      <div className="max-w-3xl mx-auto flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your construction documents..."
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
    </form>
  );
}
