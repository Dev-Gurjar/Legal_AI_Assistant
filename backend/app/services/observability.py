"""Observability hooks (Sentry optional)."""

from __future__ import annotations

from app.config import get_settings


def init_observability() -> None:
    settings = get_settings()
    if not settings.SENTRY_DSN:
        return

    import sentry_sdk

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
    )
