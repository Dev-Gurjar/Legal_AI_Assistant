"""FastAPI application entry-point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings, is_validated_cors_origin_regex
from app.api import auth, documents, chat, admin

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────
allow_credentials = True
allow_origin_regex = settings.CORS_ORIGIN_REGEX

if allow_credentials and allow_origin_regex and not is_validated_cors_origin_regex(allow_origin_regex):
    raise RuntimeError(
        "Refusing to enable CORS regex with credentials because the regex is not validated/safe."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": settings.APP_NAME}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
