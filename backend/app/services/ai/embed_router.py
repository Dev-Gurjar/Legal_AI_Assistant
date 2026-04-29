"""Embedding router with provider failover."""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any, cast

import cohere

from app.config import get_settings
from app.services.ai.config_loader import load_config, provider_order

logger = logging.getLogger(__name__)


@lru_cache()
def _cohere_client() -> cohere.Client:
    return cohere.Client(get_settings().COHERE_API_KEY)


@lru_cache()
def _sentence_transformer(model_name: str) -> Any:
    from sentence_transformers import SentenceTransformer  # lazy — not always installed
    return SentenceTransformer(model_name)


def _embed_sentence_transformer(texts: list[str], model_name: str) -> list[list[float]]:
    model = _sentence_transformer(model_name)
    embeddings = model.encode(texts, normalize_embeddings=True)
    return [cast(list[float], vec.tolist()) for vec in embeddings]


def _embed_cohere(texts: list[str], model_name: str, input_type: str) -> list[list[float]]:
    resp = _cohere_client().embed(
        texts=texts,
        model=model_name,
        input_type=input_type,
        truncate="END",
    )
    embeddings: Any = resp.embeddings
    if isinstance(embeddings, list):
        return cast(list[list[float]], embeddings)
    float_embeddings = getattr(embeddings, "float", None)
    if isinstance(float_embeddings, list):
        return cast(list[list[float]], float_embeddings)
    raise ValueError("Unexpected Cohere embeddings response shape")


def embed_texts(texts: list[str], *, input_type: str = "search_document") -> list[list[float]]:
    config = load_config("embed")
    order = provider_order(config)
    if not order:
        raise RuntimeError("No embedding providers configured")

    last_error: Exception | None = None
    for provider in order:
        provider_cfg = (config.get("providers") or {}).get(provider) or {}
        provider_type = provider_cfg.get("type")
        model = provider_cfg.get("model")
        try:
            if provider_type == "sentence_transformers" and model:
                return _embed_sentence_transformer(texts, str(model))
            if provider_type == "cohere" and model:
                return _embed_cohere(texts, str(model), input_type)
            logger.warning("Embedding provider not implemented: %s", provider)
        except Exception as exc:
            last_error = exc
            logger.warning("Embedding provider failed: %s (%s)", provider, exc)
            continue

    raise RuntimeError(f"All embedding providers failed: {last_error}")


def embed_query(text: str) -> list[float]:
    return embed_texts([text], input_type="search_query")[0]
