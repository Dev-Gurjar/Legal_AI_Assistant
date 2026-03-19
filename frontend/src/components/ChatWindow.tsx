"use client";

import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import clsx from "clsx";
import SourceCard from "./SourceCard";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: {
    document_name: string;
    text: string;
    score: number;
    image_url?: string | null;
    image_caption?: string | null;
  }[];
}

interface ChatWindowProps {
  messages: ChatMessage[];
  loading: boolean;
}

export default function ChatWindow({ messages, loading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Start a conversation</h2>
          <p className="text-muted-fg text-sm leading-relaxed">
            Choose a task and ask about legal documents such as contracts,
            case files, notices, and compliance materials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3">
            <div
              className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                msg.role === "user"
                  ? "bg-muted text-foreground"
                  : "bg-primary/10 text-primary"
              )}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div
                className={clsx(
                  "prose prose-sm max-w-none",
                  "prose-p:my-1.5 prose-headings:mb-2 prose-headings:mt-4",
                  "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg",
                  "prose-code:text-primary prose-code:before:content-none prose-code:after:content-none"
                )}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-muted-fg mb-2 uppercase tracking-wider">
                    Sources
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {msg.sources.map((src, i) => (
                      <SourceCard key={i} {...src} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-center gap-1.5 py-3">
              <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
              <div
                className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
