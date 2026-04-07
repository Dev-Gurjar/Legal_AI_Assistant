"""Qdrant vector-database service.

Each tenant gets its own collection: ``tenant_{tenant_id}``.
Vectors are 1024-dim (Cohere embed-english-v3.0).
"""

from __future__ import annotations

import uuid
from functools import lru_cache
from typing import Any, cast

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PointStruct,
    VectorParams,
    Filter,
    FieldCondition,
    MatchValue,
)

from app.config import get_settings


@lru_cache()
def _client() -> QdrantClient:
    s = get_settings()
    return QdrantClient(url=s.QDRANT_URL, api_key=s.QDRANT_API_KEY)


def _collection_name(tenant_id: str) -> str:
    s = get_settings()
    return f"{s.QDRANT_COLLECTION_PREFIX}_{tenant_id}"


def _global_collection_name() -> str:
    return get_settings().GLOBAL_SUPREME_COURT_COLLECTION


# ── Collection management ────────────────────────────────────────────────────

def ensure_collection(tenant_id: str) -> None:
    """Create the tenant collection if it doesn't exist."""
    name = _collection_name(tenant_id)
    collections = [c.name for c in _client().get_collections().collections]
    if name not in collections:
        _client().create_collection(
            collection_name=name,
            vectors_config=VectorParams(
                size=get_settings().EMBEDDING_DIMS,
                distance=Distance.COSINE,
            ),
        )


def ensure_global_collection() -> None:
    """Create the global Supreme Court collection if it doesn't exist."""
    name = _global_collection_name()
    collections = [c.name for c in _client().get_collections().collections]
    if name not in collections:
        _client().create_collection(
            collection_name=name,
            vectors_config=VectorParams(
                size=get_settings().EMBEDDING_DIMS,
                distance=Distance.COSINE,
            ),
        )


# ── Upsert ────────────────────────────────────────────────────────────────────

def upsert_chunks(
    tenant_id: str,
    document_id: str,
    filename: str,
    chunks: list[str],
    vectors: list[list[float]],
    chunk_metadata: list[dict[str, Any]] | None = None,
) -> int:
    """Store text chunks + vectors. Returns count of points upserted."""
    ensure_collection(tenant_id)

    metadata_list = chunk_metadata or [{} for _ in chunks]
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vec,
            payload=(
                {
                    "document_id": document_id,
                    "filename": filename,
                    "text": chunk,
                    "chunk_index": idx,
                }
                | {
                    key: value
                    for key, value in metadata_list[idx].items()
                    if value is not None and value != ""
                }
            ),
        )
        for idx, (chunk, vec) in enumerate(zip(chunks, vectors))
    ]
    _client().upsert(collection_name=_collection_name(tenant_id), points=points)
    return len(points)


def upsert_global_chunks(
    filename: str,
    chunks: list[str],
    vectors: list[list[float]],
    chunk_metadata: list[dict[str, Any]] | None = None,
    source_dataset: str | None = None,
) -> int:
    """Store chunks in the global Supreme Court collection."""
    ensure_global_collection()

    metadata_list = chunk_metadata or [{} for _ in chunks]
    document_id = f"sc::{filename}"
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vec,
            payload=(
                {
                    "document_id": document_id,
                    "filename": filename,
                    "text": chunk,
                    "chunk_index": idx,
                    "source_dataset": source_dataset,
                    "is_global": True,
                }
                | {
                    key: value
                    for key, value in metadata_list[idx].items()
                    if value is not None and value != ""
                }
            ),
        )
        for idx, (chunk, vec) in enumerate(zip(chunks, vectors))
    ]
    _client().upsert(collection_name=_global_collection_name(), points=points)
    return len(points)


# ── Search ────────────────────────────────────────────────────────────────────

def search(
    tenant_id: str,
    query_vector: list[float],
    top_k: int = 5,
    document_id: str | None = None,
) -> list[dict]:
    """Search the tenant's collection. Returns list of payloads + scores."""
    ensure_collection(tenant_id)
    query_filter = None
    if document_id:
        query_filter = Filter(
            must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
        )

    client = cast(Any, _client())
    if hasattr(client, "search"):
        hits = client.search(
            collection_name=_collection_name(tenant_id),
            query_vector=query_vector,
            limit=top_k,
            query_filter=query_filter,
        )
    else:
        result = client.query_points(
            collection_name=_collection_name(tenant_id),
            query=query_vector,
            limit=top_k,
            query_filter=query_filter,
        )
        hits = getattr(result, "points", [])

    return [
        {**(hit.payload or {}), "score": float(getattr(hit, "score", 0.0))}
        for hit in hits
    ]


def global_collection_has_points() -> bool:
    """Check whether global collection already has indexed documents."""
    ensure_global_collection()
    res = _client().count(collection_name=_global_collection_name(), exact=False)
    return int(getattr(res, "count", 0) or 0) > 0


def global_document_exists(filename: str) -> bool:
    """Return True if any global points already exist for the filename."""
    ensure_global_collection()
    query_filter = Filter(
        must=[FieldCondition(key="filename", match=MatchValue(value=filename))]
    )

    client = cast(Any, _client())
    try:
        try:
            res = client.count(
                collection_name=_global_collection_name(),
                count_filter=query_filter,
                exact=False,
            )
        except TypeError:
            res = client.count(
                collection_name=_global_collection_name(),
                filter=query_filter,
                exact=False,
            )
        return int(getattr(res, "count", 0) or 0) > 0
    except Exception:
        # Fallback for Qdrant deployments that require payload indexes for count filters.
        try:
            points, _ = client.scroll(
                collection_name=_global_collection_name(),
                scroll_filter=query_filter,
                limit=1,
                with_payload=False,
                with_vectors=False,
            )
            return bool(points)
        except Exception:
            return False


def search_with_global(
    tenant_id: str,
    query_vector: list[float],
    top_k: int = 5,
) -> list[dict]:
    """Search tenant collection plus global Supreme Court collection."""
    tenant_hits = search(tenant_id, query_vector, top_k=top_k)

    ensure_global_collection()
    client = cast(Any, _client())
    if hasattr(client, "search"):
        global_raw = client.search(
            collection_name=_global_collection_name(),
            query_vector=query_vector,
            limit=top_k,
        )
    else:
        result = client.query_points(
            collection_name=_global_collection_name(),
            query=query_vector,
            limit=top_k,
        )
        global_raw = getattr(result, "points", [])

    global_hits = [
        {**(hit.payload or {}), "score": float(getattr(hit, "score", 0.0))}
        for hit in global_raw
    ]

    merged = sorted(tenant_hits + global_hits, key=lambda h: float(h.get("score", 0.0)), reverse=True)
    return merged[:top_k]


# ── Delete ────────────────────────────────────────────────────────────────────

def delete_document_vectors(tenant_id: str, document_id: str) -> None:
    """Remove all vectors belonging to a specific document."""
    _client().delete(
        collection_name=_collection_name(tenant_id),
        points_selector=Filter(
            must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
        ),
    )
