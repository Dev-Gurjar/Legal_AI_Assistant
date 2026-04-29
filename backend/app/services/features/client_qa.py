"""Client-facing QA corpus retrieval."""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

from rank_bm25 import BM25Okapi

from app.config import get_settings

_TOKEN_RE = re.compile(r"[\w]+", flags=re.UNICODE)


def _tokenize(text: str) -> list[str]:
    if not text:
        return []
    return _TOKEN_RE.findall(text.lower())


@lru_cache()
def _load_corpus() -> tuple[dict[str, Any], list[dict[str, Any]], BM25Okapi | None]:
    settings = get_settings()
    path = Path(settings.FEATURE_DATA_DIR) / "client_qa.json"
    data = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    items = list(data.get("items") or [])

    tokens = [
        _tokenize(f"{item.get('question', '')} {item.get('answer', '')}")
        for item in items
    ]
    bm25 = BM25Okapi(tokens) if tokens else None
    return data, items, bm25


def search(question: str, *, top_k: int = 3) -> dict[str, Any]:
    data, items, bm25 = _load_corpus()
    data_source = str(data.get("source") or "client_qa.json")

    if not items:
        return {"query": question, "results": [], "data_source": data_source}

    query_tokens = _tokenize(question)
    if not bm25 or not query_tokens:
        top_items = items[:top_k]
        return {
            "query": question,
            "results": [
                {
                    "question": item.get("question", ""),
                    "answer": item.get("answer", ""),
                    "tags": item.get("tags", []),
                    "reference": item.get("reference"),
                    "score": 0.0,
                }
                for item in top_items
            ],
            "data_source": data_source,
        }

    scores = bm25.get_scores(query_tokens)
    ranked = sorted(
        zip(items, scores),
        key=lambda pair: float(pair[1]),
        reverse=True,
    )[:top_k]

    results = [
        {
            "question": item.get("question", ""),
            "answer": item.get("answer", ""),
            "tags": item.get("tags", []),
            "reference": item.get("reference"),
            "score": float(score),
        }
        for item, score in ranked
    ]
    return {
        "query": question,
        "results": results,
        "data_source": data_source,
    }
