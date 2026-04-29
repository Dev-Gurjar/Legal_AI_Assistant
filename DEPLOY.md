# Deployment Guide

**Stack:** FastAPI backend on Railway · Next.js frontend on Vercel · Redis on Railway · Qdrant Cloud · Supabase

Both platforms have free tiers sufficient for production demos and early customers.

---

## Prerequisites

Before starting, have these API keys ready:

| Key | Where to get it |
|---|---|
| `SUPABASE_URL` + `SUPABASE_KEY` | supabase.com → your project → Settings → API |
| `QDRANT_URL` + `QDRANT_API_KEY` | cloud.qdrant.io → your cluster → Dashboard |
| `COHERE_API_KEY` | dashboard.cohere.com → API Keys |
| `GROQ_API_KEY` | console.groq.com → API Keys |
| `JWT_SECRET` | Generate: `openssl rand -hex 32` |

---

## Step 1 — Push to GitHub

If your repo isn't on GitHub yet:

```bash
git add .
git commit -m "production deployment setup"
git remote add origin https://github.com/YOUR_USERNAME/legal-ai-assistant.git
git push -u origin main
```

---

## Step 2 — Deploy Backend on Railway

### 2a. Create the project

1. Go to **railway.app** → Sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repo
4. When asked for the root directory, type: **`backend`**
5. Railway will detect the Dockerfile automatically

### 2b. Add Redis

1. In your Railway project, click **+ New** → **Database** → **Add Redis**
2. Once provisioned, click the Redis service → **Connect** tab
3. Copy the `REDIS_URL` value (looks like `redis://default:xxxx@xxx.railway.app:6379`)

### 2c. Set environment variables

In the **backend** Railway service → **Variables** tab, add every key below:

```
DEBUG=false
ENVIRONMENT=production
JWT_SECRET=<your-generated-secret>

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=<your-service-role-key>

QDRANT_URL=https://xxxxx.qdrant.io:6333
QDRANT_API_KEY=<your-qdrant-key>

COHERE_API_KEY=<your-cohere-key>

GROQ_API_KEY=<your-groq-key>

REDIS_URL=<paste-from-step-2b>
RATE_LIMIT_USE_REDIS=true

CORS_ORIGINS=["https://YOUR-APP.vercel.app"]
CORS_ORIGIN_REGEX=^(https://[a-z0-9-]+\.vercel\.app|http://(localhost|127\.0\.0\.1)(:\d{2,5})?)$

HYBRID_SEARCH_ENABLED=true
HYBRID_BM25_ENABLED=true
RERANK_MIN_SCORE=0.5
LLM_MAX_TOKENS=2048
LLM_TEMPERATURE=0.3
CHUNK_SIZE=512
CHUNK_OVERLAP=64
```

Optional (only if you have Bhashini access):
```
BHASHINI_API_URL=https://bhashini.gov.in/api
BHASHINI_API_KEY=<your-key>
BHASHINI_SERVICE_ID=<your-service-id>
```

Optional (for error tracking):
```
SENTRY_DSN=<your-sentry-dsn>
```

### 2d. Get your backend URL

After the first deploy succeeds:
1. Click your backend service → **Settings** → **Networking** → **Generate Domain**
2. Copy the URL — it looks like: `https://legal-ai-backend-production.up.railway.app`
3. **Save this URL** — you need it in Step 3

### 2e. Update CORS after Vercel deploy

Once you have your Vercel URL (Step 3), come back and update:
```
CORS_ORIGINS=["https://YOUR-ACTUAL-APP.vercel.app"]
```

---

## Step 3 — Deploy Frontend on Vercel

### 3a. Import the project

1. Go to **vercel.com** → Sign in with GitHub
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. **IMPORTANT:** Set **Root Directory** to `frontend`
5. Framework will auto-detect as Next.js

### 3b. Set environment variables

In the Vercel project → **Settings** → **Environment Variables**, add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.up.railway.app` (from Step 2d) |

### 3c. Deploy

Click **Deploy**. Vercel builds and hosts the frontend. You'll get a URL like:
`https://legal-ai-assistant.vercel.app`

### 3d. Add a custom domain (optional)

Vercel → Settings → Domains → Add your domain.

---

## Step 4 — Verify everything works

Run these checks after both services are live:

```bash
# 1. Backend health
curl https://your-backend.up.railway.app/health
# Expected: {"status":"healthy"}

# 2. Backend docs (Swagger UI)
open https://your-backend.up.railway.app/docs

# 3. Frontend
open https://your-app.vercel.app
# Go to /register → create an account → login → try chat and all 8 feature tools
```

---

## Step 5 — Ingest your legal document corpus

After login, go to the **Admin** panel and click **Ingest Corpus** to embed all PDFs in `backend/data/` into Qdrant. This enables the RAG chat.

Alternatively, call the API directly:
```bash
curl -X POST https://your-backend.up.railway.app/admin/ingest-corpus \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recursive": true, "max_files": 500}'
```

---

## Environment at a Glance

```
Vercel (frontend)          Railway (backend)         External Services
─────────────────          ─────────────────         ─────────────────
Next.js 16          ──▶   FastAPI + Uvicorn    ──▶  Supabase (Postgres)
Port 3000                  Port $PORT (auto)    ──▶  Qdrant Cloud (vectors)
                                │               ──▶  Cohere (embeddings)
                           Railway Redis        ──▶  Groq LLM (llama-3.3-70b)
                           (rate limiting)      ──▶  Bhashini (translation)
```

---

## Redeployment (after code changes)

**Backend:** Push to `main` → Railway auto-redeploys via GitHub integration.

**Frontend:** Push to `main` → Vercel auto-redeploys. `NEXT_PUBLIC_API_URL` is baked in at build time — no rebuild needed unless you change the backend URL.

**Data files** (`backend/data/*.json`, `*.csv`): These are baked into the Docker image. After editing them, push to trigger a Railway rebuild.

---

## Cost estimate

| Service | Free tier | Paid |
|---|---|---|
| Railway | $5/month credit (≈500 service-hours) | $20/month for always-on |
| Vercel | Free forever for hobby | $20/month for teams |
| Qdrant Cloud | 1GB free cluster | $25/month for 4GB |
| Supabase | 500MB DB + 50k API calls/month | $25/month |
| Cohere | 1000 embed calls/month free | Pay-per-call after |
| Groq | Generous free tier | Pay-per-token after |

**Total for MVP:** $0–$5/month on free tiers.

---

## Troubleshooting

### Backend won't start
Check Railway logs → **Deploy** tab → **View Logs**.
Most common cause: missing env var. Check that all required vars from Step 2c are set.

### "CORS error" in browser
The backend `CORS_ORIGINS` must include your exact Vercel URL (with `https://`).
Update the Railway env var and trigger a redeploy (click **Deploy** in Railway).

### Frontend shows "Network Error" on API calls
`NEXT_PUBLIC_API_URL` is baked in at build time. Verify it's set correctly in Vercel env vars, then trigger a redeploy: Vercel → **Deployments** → **Redeploy**.

### Qdrant search returns 0 results
Run the corpus ingest (Step 5). The vector DB starts empty.

### Feature tools return empty results
The data files are in `backend/data/`. If Railway shows them missing, confirm the backend `.dockerignore` does **not** exclude the `data/` directory.
