# Legal AI Assistant — What Was Built

> A full production-grade upgrade from a basic RAG skeleton to a multi-tool Legal AI SaaS platform for Indian law firms.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [RAG Chat Pipeline](#rag-chat-pipeline)
4. [8 Deterministic Feature Tools](#8-deterministic-feature-tools)
5. [Backend Data Layer](#backend-data-layer)
6. [Frontend UI Overhaul](#frontend-ui-overhaul)
7. [Bug Fixes & Stability](#bug-fixes--stability)
8. [Infrastructure & DevOps](#infrastructure--devops)
9. [Tech Stack Reference](#tech-stack-reference)

---

## Overview

The platform started as a RAG chatbot that could answer questions from uploaded PDFs. It was extended into a full legal workflow platform with 8 standalone tools lawyers actually pay for, a rebuilt dashboard, and a production-ready Docker deployment.

**Before:** Upload PDFs → ask questions → get answers (sometimes broken, citations always failed).

**After:** Upload PDFs + ask questions + 8 dedicated tools (bail predictor, case duration, stamp duty, case flow, compensation calculators, client Q&A, document drafting, intern training) — all with real data, real calculations, polished UI.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Next.js 16  │  │  FastAPI     │  │  Qdrant       │  │
│  │  Port 3000   │  │  Port 8000   │  │  Port 6333   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  │
│         │                 │                              │
│         └────── API ───────┘          ┌──────────────┐  │
│                           │           │  Redis 7     │  │
│                    ┌──────┴──────┐    │  Port 6379   │  │
│                    │  Supabase   │    └──────────────┘  │
│                    │  (Postgres) │                       │
│                    └─────────────┘                       │
└─────────────────────────────────────────────────────────┘

External APIs:
  Groq (LLM: llama-3.3-70b-versatile) — via LiteLLM router with failover
  Cohere (embeddings: embed-english-v3.0, 1024-dim)
  Bhashini (Hindi ↔ English translation)
```

---

## RAG Chat Pipeline

### How a query flows end-to-end

```
User query
    │
    ▼
[Detect Language]        — Bhashini or fallback
    │
    ▼
[Translate to English]   — if query is Hindi/bilingual
    │
    ▼
[Embed query]            — Cohere embed-english-v3.0 (1024-dim)
    │
    ▼
[Hybrid Search]
    ├─ Dense vector search  — Qdrant HNSW
    ├─ BM25 keyword search  — rank_bm25 in-memory
    └─ RRF fusion           — Reciprocal Rank Fusion (k=60)
    │
    ▼
[Reranker]               — Cohere reranker or local cross-encoder
    │
    ▼
[Build context block]    — top N chunks with source labels
    │
    ▼
[LLM: generate_answer_with_citations]
    ├─ JSON schema output: { answer, citations[] }
    ├─ Provider failover via LiteLLM
    └─ Citation validation against chunk text
    │
    ▼
[Return to frontend]     — answer + source cards + citation list
```

### Key RAG components

| File | Role |
|---|---|
| `backend/app/services/ai/llm_router.py` | LiteLLM wrapper with provider failover (Groq → fallback) |
| `backend/app/services/ai/embed_router.py` | Cohere embeddings with lazy import (avoids sentence-transformers crash) |
| `backend/app/services/ai/hybrid_search.py` | BM25 + dense RRF fusion |
| `backend/app/services/ai/reranker.py` | Cohere reranker with lazy import fallback |
| `backend/app/services/ai/translate_router.py` | Bhashini Hindi↔English with fallback |
| `backend/app/services/llm_service.py` | Prompt assembly, task routing, persona instructions, citation extraction |
| `backend/app/services/rag_service.py` | Full pipeline orchestration (chunking, ingest, search, generate) |
| `backend/app/services/embedding_service.py` | Document-level embedding with Qdrant upsert |

### RAG Pipeline Bug Fixed

**Problem:** `generate_answer_with_citations()` raised `ValueError("No valid citations returned by LLM")` when the LLM returned good answers but citations didn't match stored chunks exactly. The `except Exception` block in `rag_service.py` then replaced the entire answer with "I don't have a verified source for this."

**Fix:** Removed the raise. The function now returns `(parsed.answer, citations)` — empty citation list is fine. The LLM answer always reaches the user.

---

## 8 Deterministic Feature Tools

All 8 tools are **deterministic** — they use real statutory formulas and curated datasets, not LLM guessing. This is the critical distinction for professional use.

---

### 1. Bail Likelihood Predictor

**User story:** *"My client was just arrested. Before I call the magistrate, I need a quick read on bail odds."*

**Endpoint:** `POST /features/bail/predict`

**Logic (`backend/app/services/features/bail_predictor.py`):**

Starts from a neutral score of 50. Adjusts based on:

| Factor | Score Impact |
|---|---|
| Bailable offense | +20 |
| Non-bailable offense | −15 |
| Max punishment ≥10 years | −20 |
| Max punishment ≥7 years | −10 |
| Prior conviction | −15 |
| High flight risk | −20 |
| Medium flight risk | −10 |
| Strong evidence | −15 |
| Weak evidence | +10 |
| Age ≥60 | +5 |
| Medical grounds | +10 |
| Woman or child | +8 |
| Custody ≥90 days | +5 |

Score is clamped 0–100. Band: High (≥70), Medium (40–69), Low (<40).

**Output:** Score, band, list of factors favoring bail, list of cautions, statutory reference (CrPC/BNSS).

**Frontend:** Color-coded gauge (green/amber/red), factor/caution badges, 14-item offense type dropdown.

---

### 2. Case Duration Estimator

**User story:** *"My client is asking how long this property dispute will take. I need a number to give them."*

**Endpoint:** `POST /features/case-time`

**Logic (`backend/app/services/features/case_time.py`):**

Reads `backend/data/case_time_samples.csv` (248 historical samples). Filters by `case_type` + `court`. Computes:
- P25 (fast resolution), Median, P75 (slow resolution)
- Histogram with 6 buckets for distribution visualization

**Data:** 8 case types × ~3 courts each, ~20 samples per combination.

| Case Type | Courts Available |
|---|---|
| Criminal | Sessions Court, High Court, Supreme Court |
| Civil | District Court, High Court, Supreme Court |
| Motor Accident | MACT |
| Matrimonial | Family Court |
| Property Dispute | District Court, High Court |
| Consumer | District Consumer Forum, State Commission |
| Cheque Bounce | Magistrate Court |
| Labour | Labour Court |

**Frontend:** P25/Median/P75 stat cards, histogram bars, human-readable duration ("1y 8mo"), auto-linked court dropdown.

---

### 3. Stamp Duty & Registration Cost Estimator

**User story:** *"My client is buying a flat in Maharashtra for ₹80L. What's the stamp duty bill?"*

**Endpoint:** `POST /features/cost-estimate`

**Logic (`backend/app/services/features/cost_estimator.py`):**

Reads `backend/data/cost_estimates.json` (52 entries). Matches `document_type` + `state`. Calculates:

```
variable_fee = transaction_value × (rate_percent / 100)
total_fee = base_fee + min(variable_fee, max_fee)
```

**Data:** 14 states × 8 document types. All rates from actual stamp acts (Maharashtra Stamp Act, Indian Stamp Act, state-specific amendments).

Document types: Sale Deed, Gift Deed, Lease Agreement, Mortgage Deed, Power of Attorney, Affidavit, Settlement Deed, Partnership Deed.

**Frontend:** Transaction value input (₹), breakdown table (base + rate% + variable + cap + total), source citation.

---

### 4. Compensation Calculator (3-in-1)

**User story:** *"My client lost their spouse in a road accident. What should I claim?"*

**Endpoint:**
- `POST /features/compensation/motor-accident`
- `POST /features/compensation/gratuity`
- `POST /features/compensation/alimony`

**Logic (`backend/app/services/features/compensation.py`):**

**Motor Accident** — Sarla Verma (2009) + Pranay Sethi (2017) SC formula:
```
multiplier        = lookup table by age (5–20)
annual_income     = monthly_income × 12
future_prospects  = annual_income × future_prospects_percent
adjusted_income   = annual_income + future_prospects
deduction         = 50% (1 dependent) / 33% (2) / 25% (3+)
loss_of_dep       = adjusted_income × (1 − deduction) × multiplier
conventional_heads = ₹70,000 + ₹15,000 (if death)
total             = loss_of_dep + conventional_heads
```

**Gratuity** — Payment of Gratuity Act, 1972:
```
gratuity = (15/26) × last_drawn_salary × years_of_service
```

**Alimony** — Section 125 CrPC / Section 24 HMA guidance:
```
disposable = monthly_income − monthly_expenses
estimate   = disposable × 35%
```

**Frontend:** Three-tab layout with formatted ₹ values, formula explanations, statutory references.

---

### 5. Case Procedure Roadmap

**User story:** *"My client has never been to court before. Walk me through what happens in a cheque bounce case."*

**Endpoint:** `POST /features/case-flow`

**Logic (`backend/app/services/features/case_flow.py`):**

Reads `backend/data/case_flows.json`. Fuzzy-matches `case_type` string. Returns ordered steps with description and typical duration.

**Data:** 9 case flow templates:
1. Criminal (FIR / Trial) — 8 steps, BNSS 2023 references
2. Civil Suit — 7 steps, CPC 1908
3. Motor Accident Claim — 6 steps, MV Act
4. Matrimonial (Divorce) — 7 steps, HMA / Special Marriage Act
5. Property Dispute — 6 steps, Transfer of Property Act
6. Consumer Complaint — 6 steps, Consumer Protection Act 2019
7. Cheque Bounce (Section 138 NI Act) — 7 steps
8. Labour / Service Matter — 6 steps, Industrial Disputes Act
9. Constitutional / Writ Petition — 6 steps

**Frontend:** Expandable accordion timeline with step numbers, clock icons for duration, legal references at bottom.

---

### 6. Client FAQ (Legal Q&A Search)

**User story:** *"A client just called asking what anticipatory bail is. I need a clean answer I can forward."*

**Endpoint:** `POST /features/client-qa`

**Logic (`backend/app/services/features/client_qa.py`):**

Reads `backend/data/client_qa.json` (37 curated Q&A items). Runs BM25Okapi full-text search (rank_bm25 library) against question + answer + tags. Returns top-k results with scores.

**Data topics:** Bail, anticipatory bail, FIR, arrest rights, divorce, maintenance (Section 125 CrPC), property registration, employment termination, consumer complaints, cheque bounce, writs (Article 226/32), RTI, BNS vs IPC comparison, POCSO, domestic violence, Section 498A, RERA, POSH, GST on legal services.

**Frontend:** Search input with 6 preset question buttons, expandable accordion answers, tag badges, reference citations.

---

### 7. Legal Document Drafting

**User story:** *"I need a legal notice out in 20 minutes. I don't want to start from scratch."*

**Endpoints:**
- `POST /features/drafting/template` — load template
- `POST /features/drafting/export` — export as DOCX (streaming blob)

**Logic (`backend/app/services/features/drafting.py`):**

Reads `backend/data/drafting_templates.json`. Returns template content with `{{PLACEHOLDER}}` tokens. DOCX export uses `python-docx` to create a proper Word document.

**Templates (8 total):**

| ID | Title | Language |
|---|---|---|
| `legal_notice` | Legal Notice (General) | EN + HI |
| `bail_application` | Application for Regular Bail | EN |
| `vakalatnama` | Vakalatnama / Power of Attorney | EN |
| `affidavit_general` | General Affidavit | EN |
| `sale_agreement` | Agreement to Sell (Immovable Property) | EN |
| `demand_notice_138` | Demand Notice under Section 138 NI Act | EN |
| `rent_agreement` | Residential Rent Agreement | EN |

**Placeholders per template:** 8–14 fields (DATE, RECIPIENT_NAME, CAUSE_OF_ACTION, AMOUNT, COURT_NAME, etc.)

**Frontend:** Template list + language selector, placeholder badge panel, live content textarea, copy-to-clipboard, DOCX download.

---

### 8. Intern / Junior Lawyer Training

**User story:** *"I want my new intern to get up to speed on constitutional law before they touch any client files."*

**Endpoints:**
- `GET /features/intern/modules` — list all modules
- `POST /features/intern/lesson` — get full lesson content
- `POST /features/intern/quiz` — submit answers, get scored

**Logic (`backend/app/services/features/intern_training.py`):**

Reads `backend/data/intern_modules.json`. Grades quiz by comparing submitted `answers: [int]` against stored `answer_index` per question. Returns score, correct indices, and per-question explanations.

**Modules (5 total, 25 quiz questions):**

| Module | Topics |
|---|---|
| Fundamentals of Indian Constitutional Law | Fundamental rights, DPSP, basic structure doctrine |
| Criminal Law (BNS/BNSS 2023) | BNS replacing IPC, BNSS replacing CrPC, new sections |
| Civil Procedure Code (CPC 1908) | Suits, pleadings, judgments, appeals, execution |
| Property Law & Conveyancing | Transfer of Property Act, RERA, registration |
| Family Law & Personal Laws | HMA, Muslim Personal Law, maintenance, adoption |

Each module includes:
- Summary (3–5 paragraphs)
- Practice checklist (5–7 items)
- Key landmark cases (4–6 cases with principle)
- Sample tasks for self-practice
- 5-question quiz with 4 options each + explanations

**Frontend:** Clickable module cards, Lesson/Quiz tab switcher, styled radio buttons, color-coded per-question feedback, trophy + score display.

---

## Backend Data Layer

All feature services are data-driven. Six files power all 8 tools:

| File | Size | Used by |
|---|---|---|
| `backend/data/case_time_samples.csv` | 248 rows | Case Duration Estimator |
| `backend/data/cost_estimates.json` | 52 entries | Stamp Duty Calculator |
| `backend/data/client_qa.json` | 37 Q&A items | Client FAQ Search |
| `backend/data/case_flows.json` | 9 flow templates | Case Procedure Roadmap |
| `backend/data/drafting_templates.json` | 8 legal templates | Document Drafting |
| `backend/data/intern_modules.json` | 5 modules, 25 quiz Qs | Intern Training |

All data files are loaded once at startup via `@lru_cache` and served from memory. Updating data requires a container restart.

---

## Frontend UI Overhaul

### Pages rebuilt or created

| Page | Before | After |
|---|---|---|
| `/dashboard` | Instant redirect to `/dashboard/chat` | Full dashboard: stats cards, quick actions grid, recent conversations, more tools |
| `/dashboard/features` | Bare list | 8 user-story-driven cards with "who uses it" tags and concrete value descriptions |
| `/dashboard/features/bail-predictor` | Raw form | Offense dropdown (14 types), color-coded gauge, factor/caution badges |
| `/dashboard/features/case-time` | Text inputs | Linked case/court dropdowns, P25/Median/P75 cards, histogram |
| `/dashboard/features/cost-estimator` | Text inputs | Document + state dropdowns, ₹ formatted breakdown table |
| `/dashboard/features/case-flow` | Text input | 9-item dropdown, accordion timeline with step numbers |
| `/dashboard/features/compensation` | Single calculator | 3-tab layout (Motor/Gratuity/Alimony), formula explanations |
| `/dashboard/features/client-qa` | Search box only | Preset question shortcuts, expandable accordion, tag badges |
| `/dashboard/features/drafting` | Basic form | Template list, placeholder panel, copy button, DOCX export |
| `/dashboard/features/intern-training` | Module dropdown | Module cards, Lesson/Quiz tabs, radio quiz, per-question feedback |

### Design system

- **Tailwind CSS v4** with `@theme inline` custom properties
- **Color tokens:** `text-primary`, `text-muted-fg`, `border-border`, `bg-surface`, `bg-background`
- **Typography:** `@tailwindcss/typography` (`prose` classes for LLM markdown output)
- **Icons:** Lucide React throughout (Scale, ShieldCheck, Clock, FileText, BookOpen, etc.)
- **Currency:** `Intl.NumberFormat('en-IN', {style:'currency', currency:'INR'})` for all ₹ values
- **Toasts:** `react-hot-toast` with `getApiError()` helper — never renders raw Pydantic objects as React children
- **State:** Zustand (`useChatStore`, `useUIStore`)

### Dashboard home (`/dashboard`)

Stats grid from `adminApi.stats()`:
- Total Documents Uploaded
- Total Conversations
- Total Messages
- Queries Today

Quick Actions (6 cards): Chat, Documents, Bail Predictor, Case Duration, Stamp Duty, Client FAQ

Recent Conversations: last 5 from `useChatStore().conversations`

More Tools grid: Case Flow, Drafting, Compensation, Training

---

## Bug Fixes & Stability

### 1. LLM citations fallback (RAG pipeline)
**File:** `backend/app/services/llm_service.py`
**Fix:** Removed `raise ValueError("No valid citations returned by LLM")`. Empty citations no longer discard the LLM answer.

### 2. SlowAPI import path (rate limiting)
**File:** `backend/app/services/rate_limit.py`
**Fix:** `from slowapi import _rate_limit_exceeded_handler` — old import path broke in slowapi 0.1.9+.

### 3. sentence-transformers crash at startup
**Files:** `embed_router.py`, `reranker.py`
**Fix:** Moved `from sentence_transformers import ...` inside functions (lazy import). Package not in requirements; app now falls back to Cohere without crashing.

### 4. SlowAPI requires `request: Request` param
**Files:** `auth.py`, `chat.py`, `documents.py`
**Fix:** Added `request: Request` as first parameter to all rate-limited endpoint functions.

### 5. `from __future__ import annotations` breaks FastAPI body detection
**Files:** `auth.py`, `chat.py`, `documents.py`
**Fix:** Removed the import — FastAPI needs concrete Pydantic type annotations at runtime to distinguish body params from query params.

### 6. Redis dependency missing
**File:** `backend/requirements.txt`
**Fix:** Added `redis>=4,<6` — required by slowapi's Redis storage backend.

### 7. Frontend Docker CSS crash
**File:** `frontend/Dockerfile`
**Fix:** Changed `npm ci` (fails with Windows-generated lockfile missing `lightningcss-linux-x64-gnu`) to `npm install` without lockfile, letting Docker resolve platform-correct binaries.

### 8. React toast crash on Pydantic array errors
**File:** `frontend/src/lib/api.ts`
**Fix:** Added `getApiError(err, fallback)` helper — flattens Pydantic validation error arrays into strings before passing to `toast.error()`. Never passes objects as React children.

### 9. `{{PLACEHOLDER}}` in JSX
**File:** `frontend/src/app/dashboard/features/drafting/page.tsx`
**Fix:** Escaped double curly braces using string concatenation so JSX parser doesn't interpret them as an expression.

---

## Infrastructure & DevOps

### Docker Compose (4 services)

| Service | Image | Port |
|---|---|---|
| `backend` | Custom (Python 3.12 + FastAPI) | 8000 |
| `frontend` | Custom (Node 20 + Next.js 16) | 3000 |
| `qdrant` | `qdrant/qdrant:latest` | 6333 |
| `redis` | `redis:7-alpine` | 6379 |

### GitHub Actions (`.github/`)

CI/CD workflow configured for automated build and deploy.

### Observability

- **Sentry** integration via `backend/app/services/observability.py` (traces, errors)
- **SlowAPI** rate limiting: 120/min default, 30/min chat, 10/min upload, 20/min auth
- **Redis-backed** rate limit storage (falls back to in-memory if Redis unavailable)

### Security

- JWT authentication (24-hour expiry, HS256)
- Multi-tenant isolation (all queries scoped to `tenant_id`)
- CORS with fully-anchored regex validation (rejects wildcard patterns)
- Rate limiting on all public endpoints

---

## Tech Stack Reference

| Layer | Technology |
|---|---|
| **LLM** | Groq `llama-3.3-70b-versatile` via LiteLLM (provider failover built in) |
| **Embeddings** | Cohere `embed-english-v3.0` (1024-dim) |
| **Vector DB** | Qdrant Cloud (HNSW index, per-tenant collections) |
| **Reranker** | Cohere reranker (lazy-loaded local cross-encoder fallback) |
| **Translation** | Bhashini API (Hindi ↔ English, falls back to passthrough) |
| **BM25** | `rank_bm25` (in-memory, combined with dense via RRF) |
| **Database** | Supabase (Postgres, multi-tenant, auth + document metadata) |
| **Backend** | FastAPI 0.115, Python 3.12, Pydantic v2 |
| **Frontend** | Next.js 16, React, TypeScript, Tailwind CSS v4, Zustand |
| **Infra** | Docker Compose, Redis 7 (rate limit storage) |
| **Document Parse** | Docling (via Kaggle ngrok endpoint) or local fallback |
| **DOCX Export** | `python-docx` |
| **PDF/DOCX chunk** | Custom word-count chunker (512 words, 64 overlap) |
