/** Zustand stores for global client state. */

import { create } from "zustand";
import type { Conversation, Message, SourceChunk, LanguagePreference, Persona } from "./api";

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
  persona: Persona;
  language: LanguagePreference;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setPersona: (persona: Persona) => void;
  setLanguage: (language: LanguagePreference) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  persona: "practitioner",
  language: "auto",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setPersona: (persona) => set({ persona }),
  setLanguage: (language) => set({ language }),
}));
