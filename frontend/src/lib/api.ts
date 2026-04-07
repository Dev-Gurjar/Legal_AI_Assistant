/** Axios client configured for the backend API. */

import axios from "axios";
import { getToken, clearAuth } from "./auth";

function getApiUrl(): string | undefined {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) return envUrl;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return undefined;
}

const api = axios.create({
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

// ─── Auth ──────────────────────────────────────────────────────

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  tenant: { name: string; slug: string };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", data),
  login: (data: LoginPayload) => api.post<AuthResponse>("/auth/login", data),
};

// ─── Documents ─────────────────────────────────────────────────

export interface Document {
  id: string;
  tenant_id: string;
  filename: string;
  status: "pending" | "processing" | "ready" | "failed";
  chunk_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

export const docsApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<Document>("/documents/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 300_000, // 5 min for large PDFs
    });
  },
  list: () => api.get<DocumentListResponse>("/documents"),
  remove: (id: string) => api.delete(`/documents/${id}`),
};

// ─── Chat ──────────────────────────────────────────────────────

export interface SourceChunk {
  document_id: string;
  filename: string;
  text: string;
  score: number;
  image_url?: string | null;
  image_caption?: string | null;
}

export interface ChatResponse {
  answer: string;
  sources: SourceChunk[];
  conversation_id: string;
  detected_task: LegalTask;
}

export type LegalTask =
  | "summarization"
  | "case_discovery"
  | "drafting"
  | "query_answering";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources: SourceChunk[];
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: Message[];
}

export const chatApi = {
  send: (query: string, conversation_id?: string) =>
    api.post<ChatResponse>("/chat", { query, conversation_id }),
  conversations: () => api.get<Conversation[]>("/chat/conversations"),
  conversation: (id: string) =>
    api.get<ConversationDetail>(`/chat/conversations/${id}`),
};

// ─── Admin ─────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface UsageStats {
  total_documents: number;
  total_chunks: number;
  total_conversations: number;
  total_messages: number;
  queries_today: number;
}

export const adminApi = {
  tenant: () => api.get<Tenant>("/admin/tenant"),
  stats: () => api.get<UsageStats>("/admin/stats"),
  ingestCorpus: (payload?: {
    path?: string;
    recursive?: boolean;
    max_files?: number;
    force_reingest?: boolean;
  }) => api.post("/admin/ingest-corpus", payload || {}),
};

export default api;
