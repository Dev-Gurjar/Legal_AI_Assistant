"""Application configuration - loaded from environment variables."""

import re
from pydantic_settings import BaseSettings
from functools import lru_cache
from pydantic import field_validator


_UNSAFE_CORS_REGEXES = {
    ".*",
    "^.*$",
    "https?://.*",
    "^https?://.*$",
    "http://.*",
    "^http://.*$",
    "https://.*",
    "^https://.*$",
}


def is_validated_cors_origin_regex(value: str | None) -> bool:
    """Return True only for constrained, compilable CORS origin regex values."""
    if value is None:
        return True

    pattern = value.strip()
    if not pattern:
        return True

    lowered = pattern.lower()
    if lowered in _UNSAFE_CORS_REGEXES:
        return False

    # Require full anchoring to avoid partial matches.
    if not (pattern.startswith("^") and pattern.endswith("$")):
        return False

    try:
        re.compile(pattern)
    except re.error:
        return False

    return True


class Settings(BaseSettings):
    """All app settings pulled from env vars / .env file."""

    # --- App ---
    APP_NAME: str = "RAG Legal Assistant"
    DEBUG: bool = False
    API_VERSION: str = "v1"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    CORS_ORIGIN_REGEX: str | None = r"^http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):3000$"
    # --- Auth / JWT ---
    JWT_SECRET: str = "CHANGE-ME-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # --- Supabase ---
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""  # service-role key (server-side)

    # --- Qdrant ---
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION_PREFIX: str = "tenant"  # tenant_{id}
    GLOBAL_SUPREME_COURT_COLLECTION: str = "global_supreme_court_cases"
    ENABLE_GLOBAL_SUPREME_COURT_SEARCH: bool = True

    # --- Cohere (Embeddings) ---
    COHERE_API_KEY: str = ""
    EMBEDDING_MODEL: str = "embed-english-v3.0"
    EMBEDDING_DIMS: int = 1024

    # --- Groq (LLM) ---
    GROQ_API_KEY: str = ""
    LLM_MODEL: str = "llama-3.3-70b-versatile"
    LLM_MAX_TOKENS: int = 2048
    LLM_TEMPERATURE: float = 0.3

    # --- Kaggle Docling ---
    DOCLING_URL: str = ""  # ngrok URL to Kaggle notebook
    DOCLING_API_KEY: str = ""
    DOCLING_VERIFY_SSL: bool = True

    # --- Chunking ---
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 64

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }

    @field_validator("CORS_ORIGIN_REGEX", mode="before")
    @classmethod
    def validate_cors_origin_regex(cls, value: str | None) -> str | None:
        if value is None:
            return None

        pattern = value.strip()
        if not pattern:
            return None

        if not is_validated_cors_origin_regex(pattern):
            raise ValueError(
                "CORS_ORIGIN_REGEX is too permissive or invalid. "
                "Use a fully anchored and constrained pattern."
            )

        return pattern


@lru_cache()
def get_settings() -> Settings:
    return Settings()
