# Simple Free Deployment Guide

This project is easiest to deploy for free with:

- Backend: Render (Free Web Service)
- Frontend: Vercel (Hobby)

This keeps setup simple and works well with your current FastAPI + Next.js structure.

## 1) Deploy Backend on Render

1. Push this repo to GitHub.
2. In Render, click New > Web Service.
3. Connect your GitHub repo.
4. Configure service:
   - Root Directory: backend
   - Runtime: Docker
   - Plan: Free
5. Add environment variables from backend/.env.example:
   - JWT_SECRET (generate a strong random value)
   - SUPABASE_URL
   - SUPABASE_KEY
   - QDRANT_URL
   - QDRANT_API_KEY
   - COHERE_API_KEY
   - GROQ_API_KEY
   - DOCLING_URL
   - Optional: DOCLING_API_KEY
   - CORS_ORIGINS = ["https://YOUR_VERCEL_DOMAIN"]
6. Deploy.
7. Verify health:
   - https://YOUR_RENDER_SERVICE.onrender.com/health
   - https://YOUR_RENDER_SERVICE.onrender.com/docs

Notes:
- Docker now listens to Render's PORT automatically.
- Free Render services sleep after inactivity and wake on first request.

## 2) Deploy Frontend on Vercel

1. In Vercel, click Add New > Project.
2. Import the same GitHub repo.
3. Set Root Directory to frontend.
4. Add environment variable:
   - NEXT_PUBLIC_API_URL = https://YOUR_RENDER_SERVICE.onrender.com
5. Deploy.

## 3) Final CORS Update on Backend

After Vercel deploy gives you a real domain:

1. Go to Render service environment settings.
2. Update CORS_ORIGINS to include your exact Vercel URL:
   - ["https://your-app.vercel.app"]
3. Trigger redeploy on Render.

## 4) Smoke Test Checklist

1. Open frontend URL.
2. Register a new account.
3. Upload one small PDF.
4. Wait until document status is ready.
5. Ask a chat question and confirm response includes sources.

## 5) Troubleshooting

- 401 errors from frontend:
  - Confirm NEXT_PUBLIC_API_URL is correct and backend is reachable.
- CORS blocked in browser:
  - CORS_ORIGINS must be a JSON list string like ["https://your-app.vercel.app"].
- Upload fails:
  - Check Render logs for missing API keys or Docling URL issues.
- First request is slow:
  - Normal on Render free due to sleep/wake cycle.
