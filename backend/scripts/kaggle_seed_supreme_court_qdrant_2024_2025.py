"""
Kaggle script: seed a shared Supreme Court corpus (2024-2025) into Qdrant permanently.

Usage on Kaggle (Notebook/Script):
1) Add dataset, e.g.:
   https://www.kaggle.com/datasets/adarshsingh0903/legal-dataset-sc-judgments-india-19502024
2) Set env vars in Kaggle Secrets:
   - QDRANT_URL
   - QDRANT_API_KEY
   - COHERE_API_KEY
   - QDRANT_COLLECTION (optional, default: global_supreme_court_cases)
3) Run this script.

Notes:
- Data is stored in your Qdrant Cloud collection, so it is persistent and reusable by all app users.
- This script reads CSV/JSON/Parquet files, extracts text fields, filters year 2024-2025, chunks, embeds, and upserts.
"""

from __future__ import annotations

import json
import os
import re
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, cast

import cohere
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct


CHUNK_SIZE = 450
CHUNK_OVERLAP = 60
BATCH_SIZE = 64
TARGET_YEARS = {2024, 2025}


@dataclass
class CaseRow:
    case_id: str
    title: str
    text: str
    year: int
    source_file: str


def _norm_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    words = _norm_spaces(text).split()
    if not words:
        return []
    out: list[str] = []
    i = 0
    while i < len(words):
        out.append(" ".join(words[i : i + chunk_size]))
        i += max(1, chunk_size - overlap)
    return out


def _extract_year(row: dict) -> int | None:
    year_candidates = [
        row.get("year"),
        row.get("judgment_year"),
        row.get("decision_year"),
    ]
    for v in year_candidates:
        if v is None:
            continue
        try:
            y = int(v)
            if 1900 <= y <= 2100:
                return y
        except Exception:
            pass

    date_candidates = [row.get("date"), row.get("judgment_date"), row.get("decision_date")]
    for d in date_candidates:
        if not d:
            continue
        m = re.search(r"(19|20)\d{2}", str(d))
        if m:
            return int(m.group(0))
    return None


def _pick_text(row: dict) -> str:
    for key in (
        "judgment_text",
        "text",
        "content",
        "full_text",
        "judgement",
        "document",
        "body",
    ):
        val = row.get(key)
        if isinstance(val, str) and _norm_spaces(val):
            return val
    return ""


def _pick_title(row: dict) -> str:
    for key in ("case_name", "title", "case_title", "name"):
        val = row.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return "Untitled Supreme Court Case"


def _iter_dataset_files(root: Path) -> Iterable[Path]:
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in {".csv", ".json", ".jsonl", ".parquet"}:
            yield p


def _load_rows(file_path: Path) -> list[dict]:
    suffix = file_path.suffix.lower()
    if suffix == ".csv":
        import pandas as pd  # type: ignore[reportMissingImports]

        df = pd.read_csv(file_path)
        return df.to_dict(orient="records")
    if suffix == ".parquet":
        import pandas as pd  # type: ignore[reportMissingImports]

        df = pd.read_parquet(file_path)
        return df.to_dict(orient="records")
    if suffix == ".jsonl":
        rows = []
        with file_path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    rows.append(json.loads(line))
        return rows
    if suffix == ".json":
        data = json.loads(file_path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return [r for r in data if isinstance(r, dict)]
        if isinstance(data, dict):
            if isinstance(data.get("data"), list):
                return [r for r in data["data"] if isinstance(r, dict)]
            return [data]
    return []


def _collect_cases(dataset_root: Path) -> list[CaseRow]:
    cases: list[CaseRow] = []
    for file_path in _iter_dataset_files(dataset_root):
        try:
            rows = _load_rows(file_path)
        except Exception as exc:
            print(f"[WARN] Failed to parse {file_path}: {exc}")
            continue

        for i, row in enumerate(rows):
            year = _extract_year(row)
            if year not in TARGET_YEARS:
                continue
            text = _pick_text(row)
            if len(_norm_spaces(text)) < 300:
                continue

            case_id = str(row.get("case_id") or row.get("id") or f"{file_path.stem}-{i}")
            title = _pick_title(row)
            cases.append(
                CaseRow(
                    case_id=case_id,
                    title=title,
                    text=text,
                    year=year,
                    source_file=file_path.name,
                )
            )
    return cases


def _ensure_collection(client: QdrantClient, collection_name: str) -> None:
    existing = {c.name for c in client.get_collections().collections}
    if collection_name in existing:
        return
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
    )


def main() -> None:
    dataset_root = Path(os.environ.get("KAGGLE_DATASET_DIR", "/kaggle/input"))
    qdrant_url = os.environ["QDRANT_URL"]
    qdrant_api_key = os.environ["QDRANT_API_KEY"]
    cohere_api_key = os.environ["COHERE_API_KEY"]
    collection_name = os.environ.get("QDRANT_COLLECTION", "global_supreme_court_cases")

    print(f"[INFO] Dataset root: {dataset_root}")
    print(f"[INFO] Target collection: {collection_name}")

    cases = _collect_cases(dataset_root)
    print(f"[INFO] Filtered cases (2024-2025): {len(cases)}")
    if not cases:
        print("[INFO] No matching rows found. Exiting.")
        return

    co = cohere.Client(cohere_api_key)
    qdrant = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    _ensure_collection(qdrant, collection_name)

    points_written = 0
    batch_texts: list[str] = []
    batch_meta: list[dict] = []

    def flush_batch() -> None:
        nonlocal points_written, batch_texts, batch_meta
        if not batch_texts:
            return

        emb = co.embed(
            texts=batch_texts,
            model="embed-english-v3.0",
            input_type="search_document",
            truncate="END",
        )
        emb_any = cast(Any, emb.embeddings)
        vectors = emb_any if isinstance(emb_any, list) else getattr(emb_any, "float", [])
        if not isinstance(vectors, list):
            raise ValueError("Unexpected embedding response from Cohere")

        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vectors[i],
                payload=batch_meta[i],
            )
            for i in range(len(batch_texts))
        ]
        qdrant.upsert(collection_name=collection_name, points=points)
        points_written += len(points)
        print(f"[INFO] Upserted {len(points)} points (total={points_written})")

        batch_texts = []
        batch_meta = []

    for case in cases:
        chunks = _chunk_text(case.text)
        for idx, chunk in enumerate(chunks):
            batch_texts.append(chunk)
            batch_meta.append(
                {
                    "document_id": f"sc::{case.case_id}",
                    "filename": case.title,
                    "text": chunk,
                    "chunk_index": idx,
                    "year": case.year,
                    "court": "Supreme Court of India",
                    "source_file": case.source_file,
                    "source_dataset": "kaggle_sc_judgments_1950_2024_plus_filter",
                    "is_global": True,
                }
            )
            if len(batch_texts) >= BATCH_SIZE:
                flush_batch()

    flush_batch()
    print(f"[DONE] Seeded global corpus points: {points_written}")


if __name__ == "__main__":
    main()
