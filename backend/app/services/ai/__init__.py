"""Provider-agnostic AI routers."""

from app.services.ai.llm_router import chat_completion
from app.services.ai.embed_router import embed_texts, embed_query
from app.services.ai.reranker import rerank_hits
from app.services.ai.translate_router import detect_language, translate_text

__all__ = [
    "chat_completion",
    "embed_texts",
    "embed_query",
    "rerank_hits",
    "detect_language",
    "translate_text",
]
