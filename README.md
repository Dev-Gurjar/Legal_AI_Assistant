# Legal_AI_Assistant

A production-style, multi-tenant Legal RAG platform that supports end-to-end legal workflows: document ingestion, semantic retrieval, conversation memory, task-aware LLM responses, and a modern frontend experience.

This project demonstrates applied backend engineering, AI integration, product thinking, and delivery discipline.

## What This Project Solves

Legal teams often waste time searching through large sets of contracts, case files, notices, and supporting material. This system enables users to:

- Upload and parse legal documents (PDF and DOCX).
- Ask legal questions with source-grounded responses.
- Run task-specific AI workflows:
  - document summarization
  - case discovery
  - legal drafting
  - legal query answering
- Manage conversations and document lifecycle in a multi-tenant environment.

## High-Level Architecture

- Frontend: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- Backend API: FastAPI + Pydantic + JWT auth
- Primary storage: Supabase (tenant/user/document/conversation/query metadata)
- Vector store: Qdrant Cloud (semantic retrieval)
- Embeddings: Cohere (`embed-english-v3.0`)
- LLM generation: Groq (Llama 3.3 70B)
- Document parsing: Docling server (v1 preferred, with compatibility fallbacks)

### Request Flow

1. User authenticates and receives JWT.
2. User uploads legal document.
3. Backend parses via Docling (or local fallback parser).
4. Text is chunked and embedded.
5. Chunks + metadata are stored in tenant-isolated Qdrant collection.
6. On chat query:
   - query is embedded
   - top-k chunks are retrieved
   - task-aware prompt is built
   - Groq returns answer grounded in retrieved context
   - conversation + messages + sources are persisted

## Repository Structure

- `backend/`: FastAPI API, services, DB integration, deployment configs, E2E scripts
- `frontend/`: Next.js application (auth, dashboard, chat, docs, admin)

## Core Backend Capabilities

### 1) Authentication and Multi-Tenancy

- JWT-based auth (`PyJWT` + `bcrypt`)
- Tenant-scoped access model
- Admin-guarded stats and tenant endpoints
- User-to-tenant relationship handling with retry-aware Supabase calls

### 2) Legal Task-Aware RAG

The backend supports explicit legal tasks through schema-driven API contracts.

Supported task enum:

- `summarization`
- `case_discovery`
- `drafting`
- `query_answering`

Task affects:

- retrieval depth (`case_discovery` uses higher top-k)
- answer style and generation policy via task-specific prompt instructions
- fallback responses when context is insufficient

### 3) Robust Document Ingestion

- MIME + size validation (up to 50MB)
- Preferred Docling route: `/v1/convert/file`
- compatibility fallback routes for older Docling deployments
- local parser fallback (`pypdf`, `python-docx`) if remote parser fails
- status transitions: `pending -> processing -> ready|failed`

### 4) Semantic Retrieval + Citations

- Tenant-isolated vector collections (`tenant_<tenant_id>`)
- cosine similarity search with optional per-document filtering
- source payload persisted and returned with each assistant response

### 5) Image-Aware Source Metadata

The ingestion pipeline now extracts markdown image references from chunks and carries them through retrieval payloads:

- `image_url`
- `image_caption`

This allows frontend source cards to render image previews when available from parsed content.

### 6) Operational Resilience Patterns

- retry wrapper around Supabase calls for transient protocol/network failures
- soft-delete strategy for document rows
- resilient delete endpoint behavior even if vector cleanup fails
- explicit health endpoint and E2E smoke pipeline script

## Core Frontend Capabilities

### 1) Productized Dashboard UX

- Route-based dashboard with chat/documents/admin areas
- sidebar with conversation history and quick new-chat reset
- responsive layout + mobile sidebar handling

### 2) Task-Driven Chat Experience

- Chat input includes legal task selector
- markdown rendering of assistant responses
- source cards with:
  - filename
  - relevance score
  - snippet
  - optional image preview + caption

### 3) Document Workflow UX

- drag-and-drop uploader (`react-dropzone`)
- polling while documents are processing
- status normalization (`ready`, `processing`, `pending`, `failed`)
- delete actions with user feedback toasts

### 4) Auth + Session Handling

- cookie-backed auth state (`js-cookie`) plus in-memory fallback
- Axios interceptors for token injection and 401 auto-logout
- protected dashboard routes with redirect guards

## API Surface (Backend)

- `POST /auth/register`
- `POST /auth/login`
- `POST /documents/upload`
- `GET /documents`
- `DELETE /documents/{id}`
- `POST /chat` (task-aware)
- `GET /chat/conversations`
- `GET /chat/conversations/{id}`
- `GET /admin/tenant`
- `GET /admin/stats`
- `GET /health`

## Engineering Quality and Testing

### Full Pipeline Testing

A scripted E2E debug flow validates:

- service health
- registration/login
- tenant and stats endpoints
- upload and ingestion readiness
- chat retrieval with sources
- conversation list/detail
- document deletion and post-delete visibility

Script: `backend/scripts/e2e_pipeline_debug.ps1`

### Build and Validation

- Frontend: successful production build via `next build`
- Backend: Python module compile checks (`compileall`) and runtime endpoint validation

## Security and Isolation Highlights

- JWT auth and signed claims including tenant context
- tenant-scoped data retrieval and indexing
- no cross-tenant vector collection sharing
- server-side API key usage for infra providers (Supabase/Qdrant/Cohere/Groq/Docling)

## Skills Demonstrated

### Backend Engineering

- FastAPI API design and dependency-injected auth guards
- resilient data-access layer design with retries and shape normalization
- service-oriented AI architecture (parser, embedding, retrieval, generation)
- schema-first contract design with Pydantic enums and typed payloads

### AI / LLM Systems

- retrieval-augmented generation pipeline design
- prompt engineering with task-specific behavioral constraints
- hybrid parsing strategy (remote model-backed parser + deterministic local fallback)
- source-grounded answer generation and citation payload design

### Frontend Engineering

- modern React/Next.js app-router architecture
- type-safe API client design and UI state management with Zustand
- UX polish for asynchronous workflows (polling, loading states, toasts)
- responsive dashboard and source visualization patterns

### DevOps / Delivery

- Dockerized backend runtime
- Render deployment descriptors
- reproducible E2E script for regression checks
- structured config through environment-based settings

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- Supabase project
- Qdrant instance
- Cohere API key
- Groq API key
- Docling endpoint (recommended)

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

If needed, create `frontend/.env.local` and set the API base URL:

## Environment Configuration (Backend)

Key groups:

- App / CORS
- JWT settings
- Supabase credentials
- Qdrant URL/key/prefix
- Cohere embedding model settings
- Groq model/token/temperature settings
- Docling URL/key/SSL verify toggle
- chunk size / overlap tuning

See `backend/.env.example`.

## Practical Achievements in This Codebase

- Built a multi-tenant legal RAG platform spanning frontend + backend + vector retrieval.
- Added legal workflow specialization instead of generic chat behavior.
- Implemented resilient ingestion and deletion behavior for better production stability.
- Added image-aware source metadata propagation and frontend rendering support.
- Established repeatable E2E verification for full pipeline confidence.

## Interview Talking Points

If you are evaluating this project for hiring/technical assessment, good deep-dive areas are:

- How multi-tenant boundaries are enforced across DB and vector layers.
- Why task-specific prompting improves legal workflow quality.
- Trade-offs in Docling-first parsing with local fallback.
- How retrieval payload design impacts frontend explainability.
- Failure-handling strategy for external dependency outages.

## Roadmap Ideas

- Add multimodal image embeddings for true image-semantic retrieval.
- Add audit trails and policy enforcement for legal compliance.
- Add async ingestion queue with progress streaming.
- Add richer observability (structured logs, traces, latency/error dashboards).
- Add role tiers and workspace-level permission controls.

---

This repository is intentionally structured to show practical, job-relevant software engineering: architecture, reliability, AI integration, UX quality, and shipping mindset.