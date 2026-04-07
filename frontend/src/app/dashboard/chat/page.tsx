"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import ChatWindow, { ChatMessage } from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import { chatApi, docsApi } from "@/lib/api";
import { useChatStore } from "@/lib/store";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
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

  const refreshConversations = useCallback(() => {
    chatApi
      .conversations()
      .then((res) => setConversations(res.data))
      .catch(() => {});
  }, [setConversations]);

  const runChat = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setLoadingStatus("Identifying intent...");

      const stages = ["Identifying intent...", "Thinking...", "Working with case references...", "Creating response..."];
      let stageIndex = 0;
      const stageTimer = setInterval(() => {
        stageIndex = (stageIndex + 1) % stages.length;
        setLoadingStatus(stages[stageIndex]);
      }, 1100);

      try {
        const { data } = await chatApi.send(text, activeConversationId ?? undefined);

        const assistantMsg: ChatMessage = {
          id: Date.now().toString() + "-a",
          role: "assistant",
          content: `**Detected intent:** ${data.detected_task.replace("_", " ")}\n\n${data.answer}`,
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
        refreshConversations();
      } catch (err: any) {
        toast.error(err.response?.data?.detail || "Failed to get response");
        // Remove the user message if it failed
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      } finally {
        clearInterval(stageTimer);
        setLoading(false);
        setLoadingStatus("");
      }
    },
    [activeConversationId, setActiveConversation, refreshConversations]
  );

  const handleUploadCase = useCallback(
    async (file: File) => {
      setLoading(true);
      setLoadingStatus("Uploading case file...");
      try {
        const { data: uploaded } = await docsApi.upload(file);
        const filename = uploaded.filename || file.name;
        toast.success(`Uploaded ${filename}`);
        setLoading(false);
        await runChat(
          `Summarize the uploaded case file '${filename}' for Indian legal practice with key facts, issues, holdings, and practical implications.`
        );
      } catch (err: any) {
        toast.error(err.response?.data?.detail || "Upload failed");
        setLoading(false);
        setLoadingStatus("");
      }
    },
    [runChat]
  );

  return (
    <div className="flex flex-col h-full">
      <ChatWindow messages={messages} loading={loading} loadingStatus={loadingStatus} />
      <ChatInput onSend={runChat} onUploadCase={handleUploadCase} loading={loading} />
    </div>
  );
}
