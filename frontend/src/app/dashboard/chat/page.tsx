"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import ChatWindow, { ChatMessage } from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import { chatApi } from "@/lib/api";
import { useChatStore } from "@/lib/store";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { activeConversationId, setActiveConversation, setConversations } =
    useChatStore();

  // Load existing conversation
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    chatApi
      .conversation(activeConversationId)
      .then((res) => {
        const msgs: ChatMessage[] = res.data.messages.map(
          (m: any, i: number) => ({
            id: m.id || String(i),
            role: m.role,
            content: m.content,
            sources: m.sources || [],
          })
        );
        setMessages(msgs);
      })
      .catch(() => {
        toast.error("Failed to load conversation");
      });
  }, [activeConversationId]);

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const { data } = await chatApi.send(text, activeConversationId ?? undefined);

        const assistantMsg: ChatMessage = {
          id: Date.now().toString() + "-a",
          role: "assistant",
          content: data.answer,
          sources: data.sources.map((s) => ({
            document_name: s.filename,
            text: s.text,
            score: s.score,
            image_url: s.image_url,
            image_caption: s.image_caption,
          })),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Update conversation id if this was a new chat
        if (data.conversation_id && !activeConversationId) {
          setActiveConversation(data.conversation_id);
        }

        // Refresh conversation list
        chatApi
          .conversations()
          .then((res) => setConversations(res.data))
          .catch(() => {});
      } catch (err: any) {
        toast.error(err.response?.data?.detail || "Failed to get response");
        // Remove the user message if it failed
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      } finally {
        setLoading(false);
      }
    },
    [activeConversationId, setActiveConversation, setConversations]
  );

  return (
    <div className="flex flex-col h-full">
      <ChatWindow messages={messages} loading={loading} />
      <ChatInput onSend={handleSend} loading={loading} />
    </div>
  );
}
