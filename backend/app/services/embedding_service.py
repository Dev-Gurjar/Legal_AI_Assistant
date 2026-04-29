"""Embedding service routed through provider-agnostic embedding router."""

from __future__ import annotations

from app.services.ai import embed_texts as router_embed_texts

def embed_texts(
    texts: list[str],
    *,
    input_type: str = "search_document",
) -> list[list[float]]:
    """Return embedding vectors for a list of texts.

    ``input_type`` should be ``"search_document"`` when indexing and
    ``"search_query"`` when querying.
    """
    return router_embed_texts(texts, input_type=input_type)


def embed_query(text: str) -> list[float]:
    """Embed a single query string."""
    return embed_texts([text], input_type="search_query")[0]
