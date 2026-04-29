"""Vector store router (default: Qdrant)."""

from __future__ import annotations

from app.services import qdrant_service


def search(tenant_id: str, query_vector: list[float], top_k: int = 5) -> list[dict]:
    return qdrant_service.search(tenant_id, query_vector, top_k=top_k)


def search_with_global(tenant_id: str, query_vector: list[float], top_k: int = 5) -> list[dict]:
    return qdrant_service.search_with_global(tenant_id, query_vector, top_k=top_k)


def upsert_chunks(
    tenant_id: str,
    document_id: str,
    filename: str,
    chunks: list[str],
    vectors: list[list[float]],
    chunk_metadata: list[dict] | None = None,
) -> int:
    return qdrant_service.upsert_chunks(
        tenant_id=tenant_id,
        document_id=document_id,
        filename=filename,
        chunks=chunks,
        vectors=vectors,
        chunk_metadata=chunk_metadata,
    )
