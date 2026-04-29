# Architecture Target (Proposed)

## Goals
- Provider-agnostic AI stack (LLM, embeddings, vector DB, translation) via routers and adapters.
- Hindi/Hinglish support across input, retrieval, generation, and UI.
- Mandatory citations with verification and anti-hallucination safeguards.
- Eight legal features delivered as modular backend services + frontend pages.
- Production-ready: Docker Compose, auth, rate limiting, observability, CI/CD.

## Target High-Level Design

```
Feature Layer (8 features)
  ├─ Case Time Estimator
  ├─ Compensation Calculators
  ├─ Bail Likelihood Predictor
  ├─ Cost Estimator
  ├─ Virtual Legal Assistant (client-QA corpus)
  ├─ Intern Training Module
  ├─ Case Flow Explainer
  └─ Legal Drafting (bilingual)

AI Platform Layer
  ├─ LLM Router (LiteLLM, provider failover)
  ├─ Embedding Router (bge-m3 default)
  ├─ Vector Store Router (Qdrant default)
  ├─ Translation Router (Bhashini default)
  └─ Reranker (bge-reranker-v2-m3)

Data Pipeline
  ├─ Scrapers (Playwright, per source)
  ├─ Cleaning + semantic chunking
  ├─ Hybrid search (dense + BM25 + RRF)
  └─ Scheduled refresh (Celery + Beat)
```

## Backend Target Structure

```
backend/
  app/
    api/
      v1/
        chat.py
        auth.py
        features/
          case_time.py
          compensation.py
          bail.py
          cost_estimator.py
          client_qa.py
          intern_training.py
          case_flow.py
          drafting.py
    core/
      config/
        settings.py
        llm.yaml
        embed.yaml
        vector.yaml
        translate.yaml
      logging.py
      rate_limit.py
      security.py
    services/
      ai/
        llm_router.py
        embed_router.py
        translate_router.py
        reranker.py
      rag/
        retrieval.py
        citations.py
        validators.py
      storage/
        vector_store.py
        postgres.py
    pipelines/
      ingestion.py
      data_pipeline/
        scrapers/
        cleaners/
        chunkers/
    models/
      schemas/
      db/
    workers/
      celery_app.py
```

## Frontend Target Structure

- Next.js 15 App Router
- shadcn/ui + Tailwind v4
- TanStack Query for data fetch
- React Hook Form + Zod for all forms
- next-intl for Hindi/English UI
- Persona toggle in header
- Feature pages for all 8 modules
- Drafting UI with bilingual templates and doc export

## Data + Retrieval Targets
- Hybrid search: Qdrant dense + BM25 → RRF → rerank
- Mandatory citations with JSON output + verification
- Last-updated surfaced in UI

## Production Targets
- Docker Compose for api, web, postgres, redis, qdrant
- GitHub Actions CI: lint, tests, build, security audit
- Observability: Logfire or OpenTelemetry + Sentry + PostHog
- Rate limiting: slowapi + Redis
- Auth: Clerk/Supabase Auth/FastAPI-Users (decision pending)

## Key Migration Steps
1. Introduce routers/adapters (LLM, embedding, vector, translation) and wire existing calls.
2. Add reranking + citation enforcement in RAG pipeline.
3. Implement bilingual pipeline and UI toggles.
4. Build data pipeline and feature services with deterministic calculators.
5. Add production infra (compose, CI/CD, observability, rate limiting).
