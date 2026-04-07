
"""Bulk seed local corpus files into the shared global Qdrant collection.

This script ingests PDF/DOCX files from a local folder and stores vectors in
the global collection so any user can query them.
"""

from __future__ import annotations

import argparse
import re
import time
from io import BytesIO
from pathlib import Path
from typing import Iterable

from docx import Document
from pypdf import PdfReader

from app.services import embedding_service, qdrant_service
from app.services.rag_service import chunk_text


SUPPORTED_EXTS = {".pdf", ".docx"}
BATCH_SIZE = 16
EMBED_RETRY_ATTEMPTS = 5
EMBED_RETRY_DELAY_SECONDS = 60


def _parse_pdf_local(content: bytes) -> str:
	reader = PdfReader(BytesIO(content))
	texts: list[str] = []
	for page in reader.pages:
		txt = page.extract_text() or ""
		if txt.strip():
			texts.append(txt.strip())
	return "\n\n".join(texts)


def _parse_docx_local(content: bytes) -> str:
	doc = Document(BytesIO(content))
	parts = [p.text.strip() for p in doc.paragraphs if p.text and p.text.strip()]
	return "\n\n".join(parts)


def _parse_local_file(path: Path) -> str:
	content = path.read_bytes()
	suffix = path.suffix.lower()
	if suffix == ".pdf":
		return _parse_pdf_local(content)
	if suffix == ".docx":
		return _parse_docx_local(content)
	return ""


def _iter_files(root: Path, recursive: bool) -> Iterable[Path]:
	iterator = root.rglob("*") if recursive else root.glob("*")
	for p in iterator:
		if p.is_file() and p.suffix.lower() in SUPPORTED_EXTS:
			yield p


def _extract_year_from_filename(filename: str) -> int | None:
	years = [int(v) for v in re.findall(r"\b(19\d{2}|20\d{2})\b", filename)]
	if not years:
		return None
	return max(years)


def _embed_with_retry(texts: list[str]) -> list[list[float]]:
	last_error: Exception | None = None
	for attempt in range(EMBED_RETRY_ATTEMPTS):
		try:
			return embedding_service.embed_texts(texts, input_type="search_document")
		except Exception as exc:
			last_error = exc
			message = str(exc).lower()
			if "429" not in message and "rate limit" not in message and "trial token" not in message:
				raise
			if attempt < EMBED_RETRY_ATTEMPTS - 1:
				time.sleep(EMBED_RETRY_DELAY_SECONDS)
	if last_error is not None:
		raise last_error
	raise RuntimeError("Embedding failed without a captured exception")


def _upsert_with_retry(
	filename: str,
	chunks: list[str],
	vectors: list[list[float]],
	chunk_metadata: list[dict[str, object]],
	source_dataset: str,
) -> int:
	try:
		return qdrant_service.upsert_global_chunks(
			filename=filename,
			chunks=chunks,
			vectors=vectors,
			chunk_metadata=chunk_metadata,
			source_dataset=source_dataset,
		)
	except Exception as exc:
		if len(chunks) <= 1 or "timed out" not in str(exc).lower():
			raise

		mid = max(1, len(chunks) // 2)
		return _upsert_with_retry(filename, chunks[:mid], vectors[:mid], chunk_metadata[:mid], source_dataset) + _upsert_with_retry(
			filename,
			chunks[mid:],
			vectors[mid:],
			chunk_metadata[mid:],
			source_dataset,
		)


async def _ingest_one(path: Path, source_dataset: str, skip_existing: bool) -> tuple[int, str | None]:
	filename = path.name
	if skip_existing and qdrant_service.global_document_exists(filename):
		return 0, None

	markdown = _parse_local_file(path)
	if not markdown.strip():
		return 0, f"No text extracted: {filename}"

	chunks = chunk_text(markdown)
	if not chunks:
		return 0, f"No chunks produced: {filename}"

	vectors = _embed_with_retry(chunks)
	year = _extract_year_from_filename(filename)

	inserted = 0
	for start in range(0, len(chunks), BATCH_SIZE):
		end = start + BATCH_SIZE
		batch_chunks = chunks[start:end]
		batch_vectors = vectors[start:end]
		batch_metadata = [
			{
				"source_file": filename,
				"source_dataset": source_dataset,
				"court": "Supreme Court of India",
				"year": year,
				"is_global": True,
			}
			for _ in batch_chunks
		]
		inserted += _upsert_with_retry(
			filename=filename,
			chunks=batch_chunks,
			vectors=batch_vectors,
			chunk_metadata=batch_metadata,
			source_dataset=source_dataset,
		)

	return inserted, None


async def main() -> None:
	parser = argparse.ArgumentParser(description="Seed local corpus into global Qdrant collection")
	parser.add_argument("--data-dir", default="data", help="Directory containing PDF/DOCX files")
	parser.add_argument("--non-recursive", action="store_true", help="Only read top-level files")
	parser.add_argument("--max-files", type=int, default=None, help="Optional max files to process")
	parser.add_argument(
		"--skip-existing",
		action="store_true",
		help="Skip files already present in global collection (slower due filter checks)",
	)
	parser.add_argument(
		"--source-dataset",
		default="local_data_folder_bulk_seed",
		help="Metadata tag to identify this seed source",
	)
	args = parser.parse_args()

	root = Path(args.data_dir)
	if not root.exists() or not root.is_dir():
		raise ValueError(f"Invalid data directory: {root}")

	files = sorted(_iter_files(root, recursive=not args.non_recursive), key=lambda p: p.name.lower())
	if args.max_files is not None:
		files = files[: args.max_files]

	print(f"[INFO] Data dir: {root.resolve()}")
	print(f"[INFO] Candidate files: {len(files)}")
	print(f"[INFO] Global collection: {qdrant_service._global_collection_name()}")

	qdrant_service.ensure_global_collection()

	total_points = 0
	processed = 0
	skipped = 0
	failed: list[str] = []

	for idx, path in enumerate(files, start=1):
		try:
			inserted, error = await _ingest_one(path, args.source_dataset, skip_existing=args.skip_existing)
			if error:
				failed.append(error)
				print(f"[WARN] {error}")
				continue

			processed += 1
			if inserted == 0:
				skipped += 1
				print(f"[SKIP] ({idx}/{len(files)}) {path.name} already indexed")
			else:
				total_points += inserted
				print(f"[OK]   ({idx}/{len(files)}) {path.name} -> {inserted} chunks")
		except Exception as exc:
			failed.append(f"{path.name}: {exc}")
			print(f"[ERR]  ({idx}/{len(files)}) {path.name}: {exc}")

	print("\n[DONE] Global seed complete")
	print(f"[DONE] Files processed: {processed}")
	print(f"[DONE] Files skipped:   {skipped}")
	print(f"[DONE] Points written:  {total_points}")
	print(f"[DONE] Failures:        {len(failed)}")
	if failed:
		print("[DONE] Failure samples:")
		for item in failed[:20]:
			print(f"  - {item}")


if __name__ == "__main__":
	import asyncio

	asyncio.run(main())
