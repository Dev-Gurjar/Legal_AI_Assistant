"""Hybrid retrieval with BM25 + RRF over dense candidates."""

from __future__ import annotations

import re
from typing import Any

from rank_bm25 import BM25Okapi

from app.config import get_settings
from app.services.ai import vector_router


_TOKEN_RE = re.compile(r"[\w]+", flags=re.UNICODE)


def _tokenize(text: str) -> list[str]:
    if not text:
        return []
    return _TOKEN_RE.findall(text.lower())


def _hit_key(hit: dict[str, Any]) -> str:
    doc_id = str(hit.get("document_id") or "")
    chunk_index = hit.get("chunk_index")
    if doc_id and chunk_index is not None:
        return f"{doc_id}:{chunk_index}"
    text = str(hit.get("text") or "")
    return f"{doc_id}:{hash(text)}"


def _dense_candidates(
    tenant_id: str,
    query_vector: list[float],
    top_k: int,
    use_global: bool,
) -> list[dict]:
    if use_global:
        return vector_router.search_with_global(tenant_id, query_vector, top_k=top_k)
    return vector_router.search(tenant_id, query_vector, top_k=top_k)


def hybrid_search(
    tenant_id: str,
    query_text: str,
    query_vector: list[float],
    *,
    top_k: int = 5,
    use_global: bool = False,
) -> list[dict]:
    """Return ranked hits using dense retrieval + BM25 + RRF fusion.

    BM25 is computed over the dense candidate set to avoid full-corpus scans.
    """
    settings = get_settings()
    candidate_k = max(top_k, top_k * max(settings.HYBRID_CANDIDATE_MULTIPLIER, 1))

    hits = _dense_candidates(
        tenant_id=tenant_id,
        query_vector=query_vector,
        top_k=candidate_k,
        use_global=use_global,
    )
    if not hits:
        return hits

    if not settings.HYBRID_BM25_ENABLED:
        return hits[:top_k]

    query_tokens = _tokenize(query_text)
    if not query_tokens:
        return hits[:top_k]

    corpus_tokens = [_tokenize(str(hit.get("text") or "")) for hit in hits]
    if not any(corpus_tokens):
        return hits[:top_k]

    bm25 = BM25Okapi(corpus_tokens)
    bm25_scores = bm25.get_scores(query_tokens)

    dense_sorted = sorted(hits, key=lambda h: float(h.get("score", 0.0)), reverse=True)
    bm25_sorted = sorted(
        zip(hits, bm25_scores),
        key=lambda pair: float(pair[1]),
        reverse=True,
    )

    rrf_k = max(settings.HYBRID_RRF_K, 1)
    rrf_scores: dict[str, float] = {}

    for rank, hit in enumerate(dense_sorted, start=1):
        key = _hit_key(hit)
        rrf_scores[key] = rrf_scores.get(key, 0.0) + 1.0 / (rrf_k + rank)

    for rank, (hit, score) in enumerate(bm25_sorted, start=1):
        key = _hit_key(hit)
        rrf_scores[key] = rrf_scores.get(key, 0.0) + 1.0 / (rrf_k + rank)

    enriched: list[dict] = []
    for hit, bm25_score in zip(hits, bm25_scores):
        key = _hit_key(hit)
        row = dict(hit)
        row["bm25_score"] = float(bm25_score)
        row["rrf_score"] = float(rrf_scores.get(key, 0.0))
        enriched.append(row)

    fused = sorted(enriched, key=lambda h: float(h.get("rrf_score", 0.0)), reverse=True)
    return fused[:top_k]
