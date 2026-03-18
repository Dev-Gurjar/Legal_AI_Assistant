/** Zustand stores for global client state. */

import { create } from "zustand";
import type { Conversation, Message, SourceChunk } from "./api";

// ─── Chat Store ────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  loading: boolean;

  setConversations: (c: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (m: ChatMessage[]) => void;
  addMessage: (m: ChatMessage) => void;
  setLoading: (l: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  loading: false,

  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (activeConversationId) =>
    set({ activeConversationId }),
  setMessages: (messages) => set({ messages }),
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  setLoading: (loading) => set({ loading }),
  reset: () =>
    set({
      conversations: [],
      activeConversationId: null,
      messages: [],
      loading: false,
    }),
}));

// ─── UI Store ──────────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
