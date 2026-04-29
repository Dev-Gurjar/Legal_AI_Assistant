"""Rate limiting helpers using SlowAPI."""

from __future__ import annotations

from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

try:
    from slowapi import _rate_limit_exceeded_handler
except ImportError:
    def _rate_limit_exceeded_handler(request, exc: RateLimitExceeded):
        return JSONResponse({"detail": f"Rate limit exceeded: {exc}"}, status_code=429)

from app.config import get_settings

settings = get_settings()


def _redis_storage_uri(url: str) -> str:
    return url if "://" in url else f"redis://{url}"


_storage_uri = (
    _redis_storage_uri(settings.REDIS_URL)
    if settings.RATE_LIMIT_USE_REDIS and settings.REDIS_URL
    else "memory://"
)

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.RATE_LIMIT_DEFAULT],
    storage_uri=_storage_uri,
)
limiter.enabled = settings.RATE_LIMIT_ENABLED


def init_rate_limiter(app) -> None:
    app.state.limiter = limiter
    if not settings.RATE_LIMIT_ENABLED:
        return
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
