# Architecture Current

## Summary
This repository is a working legal RAG prototype with a FastAPI backend and a Next.js frontend. It supports multi-tenant document ingestion, Qdrant-based retrieval, and task-aware legal responses. Hindi/translation, provider-agnostic routing, strict citation validation, and the eight requested features are not yet implemented.

## Repository Layout
- backend/: FastAPI API, services, scripts, and Render/Docker config.
- frontend/: Next.js App Router UI for auth, dashboard, chat, and documents.
- README.md: High-level overview and current capabilities.

## Backend (FastAPI)

### Core Services
- API entry and routing: app/main.py
- Settings: app/config.py (env-based, includes CORS regex guard)
- Auth: app/api/auth.py (JWT + bcrypt)
- Documents: app/api/documents.py (upload, list, delete)
- Chat: app/api/chat.py (task-aware RAG endpoint)
- Admin: app/api/admin.py (tenant info, stats, local corpus ingest)

### Data Stores
- Supabase (Postgres): tenant/user/documents/conversations/messages (supabase-py)
- Qdrant: per-tenant collections, optional global Supreme Court collection

### RAG Flow (Current)
1. Upload PDF/DOCX → Docling parse with local fallback
2. Chunking (word-count, overlap)
3. Embed (Cohere embed-english-v3.0)
4. Upsert to Qdrant (tenant collection)
5. Query → embed → search → LLM generation → persist conversation

### LLM
- Groq SDK with llama-3.3-70b-versatile
- Task-aware prompts with Indian drafting reference
- Intent detection via keyword heuristic
- No structured citation validation or reranking

### Observability / Ops
- Health endpoint at /health
- E2E pipeline script (PowerShell)
- Dockerfile and Render config
- No CI workflows found

## Frontend (Next.js)

### Stack
- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Axios for API calls, Zustand for state, js-cookie for auth

### UI
- Landing page, auth pages, dashboard with chat/documents/admin
- Chat window renders markdown, source cards show snippets
- Chat input supports case file upload + prompt
- No persona mode, Hindi UI, or feature-specific pages yet

### API Contract
- /auth/register, /auth/login
- /documents/upload, /documents
- /chat (task-aware), /chat/conversations
- /admin/tenant, /admin/stats, /admin/ingest-corpus

## Gaps vs Target
- No provider-agnostic routers for LLM/embeddings/vector/translation
- No reranker or hybrid search
- No mandatory citation enforcement with validation
- No Hindi/Hinglish end-to-end pipeline
- No feature modules for the 8 requested features
- No data pipeline/scraper framework
- No CI/CD, Docker Compose, Redis, Celery, or rate limiting
- No persona-based UX (Practitioner vs Learner)
