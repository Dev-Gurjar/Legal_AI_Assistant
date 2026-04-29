# Decisions (Phase 0)

## 1) Current LLM provider and migration path
- Current: Groq SDK via app/services/llm_service.py, model from settings (llama-3.3-70b-versatile).
- Migration path: Introduce LiteLLM router with a provider registry and config (config/llm.yaml). Wrap Groq as the default free provider, add fallbacks.

## 2) Current vector store and data migration
- Current: Qdrant Cloud via app/services/qdrant_service.py, per-tenant collections + optional global Supreme Court collection.
- Migration path: Keep Qdrant as default, add vector router abstraction. For any switch, re-embed and reindex via pipeline jobs.

## 3) Current auth system and user preservation
- Current: Custom JWT with Supabase tables (users, tenants, user_tenants). Tokens issued in app/api/auth.py.
- Decision: Move to Supabase Auth (free tier, managed, aligns with existing Supabase usage).
- User preservation: Yes. Migrate existing users into Supabase Auth with a one-time backfill + mapping table.

## 4) Current frontend stack and refactor strategy
- Current: Next.js 16 App Router, React 19, Tailwind 4, Zustand, Axios.
- Decision: Incremental refactor (keep Next.js base) and add shadcn/ui, TanStack Query, next-intl, RHF+Zod.

## 5) High Court bilingual judgments priority
- Unknown in current repo. Needs research.
- Proposed priority: Delhi, Bombay, Madras, Calcutta, Karnataka, Allahabad as requested; confirm which publish bilingual judgments and add targeted scrapers.

## 6) Data-sharing agreements (Indian Kanoon, QA portals)
- Unknown. No agreements referenced in repo.
- Decision: Only ingest sources with explicit public access or official APIs by default (India Code, eCourts, NJDG, court sites). QA portals and Indian Kanoon require explicit permission/API keys; feature 5 will remain disabled behind a config flag until approved.

## 7) Deployment target
- Current: Render (backend Docker), no Compose or CI workflows found.
- Decision: Render free tier for prototype/alpha; keep Docker Compose for local dev. Add optional Hetzner profile for scale later.

## Approval Required
Please confirm:
- Auth system choice and whether to preserve existing users.
- Target deployment platform.
- Approved data sources for scraping.
- Whether we should proceed with incremental refactor or clean rewrite of frontend.
