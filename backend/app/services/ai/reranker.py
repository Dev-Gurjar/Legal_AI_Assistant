"""Reranker service for improving retrieval quality."""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

from app.services.ai.config_loader import load_config, provider_order

logger = logging.getLogger(__name__)


@lru_cache()
def _cross_encoder(model_name: str) -> Any:
    from sentence_transformers import CrossEncoder  # lazy — not always installed
    return CrossEncoder(model_name)


def _rerank_crossencoder(query: str, texts: list[str], model_name: str) -> list[float]:
    encoder = _cross_encoder(model_name)
    pairs = [(query, t) for t in texts]
    scores = encoder.predict(pairs)
    return [float(s) for s in scores]


def rerank_hits(query: str, hits: list[dict]) -> list[dict]:
    """Return hits sorted by reranker score, if configured."""
    if not hits:
        return hits

    config = load_config("reranker")
    order = provider_order(config)
    if not order:
        return hits

    texts = [str(h.get("text", "")) for h in hits]
    last_error: Exception | None = None

    for provider in order:
        provider_cfg = (config.get("providers") or {}).get(provider) or {}
        provider_type = provider_cfg.get("type")
        model = provider_cfg.get("model")
        try:
            if provider_type == "sentence_transformers_crossencoder" and model:
                scores = _rerank_crossencoder(query, texts, str(model))
                enriched = []
                for hit, score in zip(hits, scores):
                    row = dict(hit)
                    row["rerank_score"] = float(score)
                    enriched.append(row)
                return sorted(enriched, key=lambda h: h.get("rerank_score", 0.0), reverse=True)
            logger.warning("Reranker provider not implemented: %s", provider)
        except Exception as exc:
            last_error = exc
            logger.warning("Reranker provider failed: %s (%s)", provider, exc)
            continue

    logger.warning("All rerankers failed: %s", last_error)
    return hits
