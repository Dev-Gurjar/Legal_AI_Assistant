"""LiteLLM-based LLM router with provider failover."""

from __future__ import annotations

import logging
from typing import Any

from litellm import completion

from app.config import get_settings
from app.services.ai.config_loader import load_config, provider_order

logger = logging.getLogger(__name__)


def _resolve_model(provider: str, config: dict) -> str | None:
    providers = config.get("providers") or {}
    details = providers.get(provider) or {}
    model = details.get("model")
    return str(model) if model else None


def chat_completion(
    messages: list[dict],
    *,
    temperature: float | None = None,
    max_tokens: int | None = None,
    response_format: dict | None = None,
) -> str:
    """Call the configured LLM providers with automatic failover."""
    settings = get_settings()
    config = load_config("llm")
    order = provider_order(config)
    if not order:
        raise RuntimeError("No LLM providers configured")

    last_error: Exception | None = None
    for provider in order:
        model = _resolve_model(provider, config)
        if not model:
            continue
        try:
            resp = completion(
                model=model,
                messages=messages,
                temperature=temperature if temperature is not None else settings.LLM_TEMPERATURE,
                max_tokens=max_tokens if max_tokens is not None else settings.LLM_MAX_TOKENS,
                response_format=response_format,
            )
            content = resp["choices"][0]["message"]["content"]
            if isinstance(content, str) and content.strip():
                return content
        except Exception as exc:
            last_error = exc
            logger.warning("LLM provider failed: %s (%s)", provider, exc)
            continue

    raise RuntimeError(f"All LLM providers failed: {last_error}")
