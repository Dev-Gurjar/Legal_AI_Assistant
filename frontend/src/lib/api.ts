/** Axios client configured for the backend API. */

import axios from "axios";
import { getToken, clearAuth } from "./auth";

function getApiUrl(): string | undefined {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) return envUrl;

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
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

export interface Citation {
  document_id: string;
  filename: string;
  chunk_id: string;
  verbatim_quote: string;
  score: number;
  source_url?: string | null;
  last_verified?: string | null;
}

export interface ChatResponse {
  answer: string;
  sources: SourceChunk[];
  citations: Citation[];
  conversation_id: string;
  detected_task: LegalTask;
}

export type LegalTask =
  | "summarization"
  | "case_discovery"
  | "drafting"
  | "query_answering";

export type LanguagePreference = "auto" | "en" | "hi" | "bilingual";

export type Persona = "practitioner" | "learner";

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
  send: (
    query: string,
    task: LegalTask,
    conversation_id?: string,
    language?: LanguagePreference,
    persona?: Persona,
  ) =>
    api.post<ChatResponse>("/chat", {
      query,
      task,
      conversation_id,
      language,
      persona,
    }),
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

export interface CaseTimeEstimateResponse {
  case_type: string;
  court: string;
  median_days: number;
  p25_days: number;
  p75_days: number;
  sample_size: number;
  histogram: { range: string; count: number }[];
  data_source: string;
  warning?: string | null;
}

export interface CostEstimateResponse {
  document_type: string;
  state: string;
  transaction_value: number;
  total_fee: number;
  base_fee: number;
  rate_percent: number;
  max_fee: number;
  source: string;
}

export interface MotorAccidentCompResponse {
  age: number;
  monthly_income: number;
  dependents: number;
  multiplier: number;
  loss_of_dependency: number;
  conventional_heads: number;
  total_compensation: number;
  reference: string;
  notes: string;
}

export interface GratuityResponse {
  years_of_service: number;
  last_drawn_salary: number;
  gratuity_amount: number;
  reference: string;
}

export interface AlimonyResponse {
  monthly_income: number;
  monthly_expenses: number;
  estimated_monthly_support: number;
  reference: string;
}

export interface BailPredictResponse {
  offense_type: string;
  likelihood_score: number;
  likelihood_band: string;
  key_factors: string[];
  cautions: string[];
  reference: string;
}

export interface ClientQaItem {
  question: string;
  answer: string;
  tags: string[];
  reference?: string | null;
  score: number;
}

export interface ClientQaResponse {
  query: string;
  results: ClientQaItem[];
  data_source: string;
}

export interface InternModuleSummary {
  module_id: string;
  title: string;
  summary: string;
}

export interface InternModulesResponse {
  modules: InternModuleSummary[];
}

export interface InternKeyCase {
  case: string;
  principle: string;
}

export interface InternLessonResponse {
  module_id: string;
  title: string;
  summary: string;
  checklist: string[];
  key_cases: InternKeyCase[];
  sample_tasks: string[];
  quiz: { question: string; options: string[] }[];
}

export interface InternQuizResponse {
  module_id: string;
  score: number;
  total_questions: number;
  correct_indices: number[];
  explanations: string[];
}

export interface CaseFlowStep {
  step: number;
  title: string;
  description: string;
  typical_duration: string;
}

export interface CaseFlowResponse {
  case_type: string;
  court_level?: string | null;
  state?: string | null;
  steps: CaseFlowStep[];
  references: string[];
  warning?: string | null;
}

export interface DraftTemplateResponse {
  template_id: string;
  title: string;
  language: string;
  content?: string | null;
  content_en?: string | null;
  content_hi?: string | null;
  placeholders: string[];
  generated: boolean;
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

export const featureApi = {
  caseTimeEstimate: (payload: { case_type: string; court: string }) =>
    api.post<CaseTimeEstimateResponse>("/features/case-time", payload),
  costEstimate: (payload: { document_type: string; state: string; transaction_value: number }) =>
    api.post<CostEstimateResponse>("/features/cost-estimate", payload),
  motorAccidentComp: (payload: { age: number; monthly_income: number; dependents: number; future_prospects_percent: number; injury_type: string }) =>
    api.post<MotorAccidentCompResponse>("/features/compensation/motor-accident", payload),
  gratuity: (payload: { years_of_service: number; last_drawn_salary: number }) =>
    api.post<GratuityResponse>("/features/compensation/gratuity", payload),
  alimony: (payload: { monthly_income: number; monthly_expenses: number }) =>
    api.post<AlimonyResponse>("/features/compensation/alimony", payload),
  bailPredict: (payload: {
    offense_type: string;
    max_punishment_years: number;
    is_bailable: boolean;
    has_prior_conviction: boolean;
    flight_risk: string;
    evidence_strength: string;
    accused_age: number;
    has_medical_grounds: boolean;
    is_woman_or_child: boolean;
    custody_days: number;
  }) => api.post<BailPredictResponse>("/features/bail/predict", payload),
  clientQa: (payload: { question: string; top_k?: number }) =>
    api.post<ClientQaResponse>("/features/client-qa", payload),
  internModules: () => api.get<InternModulesResponse>("/features/intern/modules"),
  internLesson: (payload: { module_id: string }) =>
    api.post<InternLessonResponse>("/features/intern/lesson", payload),
  internQuiz: (payload: { module_id: string; answers: number[] }) =>
    api.post<InternQuizResponse>("/features/intern/quiz", payload),
  caseFlow: (payload: { case_type: string; court_level?: string; state?: string }) =>
    api.post<CaseFlowResponse>("/features/case-flow", payload),
  draftTemplate: (payload: { template_id: string; language: string }) =>
    api.post<DraftTemplateResponse>("/features/drafting/template", payload),
  draftExport: (payload: { title: string; content: string; format?: string }) =>
    api.post("/features/drafting/export", payload, { responseType: "blob" }),
};

/** Safely extract a readable message from an Axios error response. */
export function getApiError(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;
  const detail = (err as any).response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => (typeof d === "object" ? d.msg ?? JSON.stringify(d) : String(d)))
      .join("; ");
  }
  return fallback;
}

export default api;
