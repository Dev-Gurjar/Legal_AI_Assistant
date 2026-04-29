"""LLM service routed through provider-agnostic LLM router."""

from __future__ import annotations

import json
from typing import Any, cast

from pydantic import BaseModel, ValidationError

from app.services.ai import chat_completion
from app.services.legal_references import INDIAN_DRAFTING_REFERENCE

BASE_SYSTEM_PROMPT = """You are a legal RAG assistant.
Use only the provided context documents.
If context is insufficient, state that clearly.
Maintain a concise, professional legal tone.
Always reference source document names used in your response."""

TASK_INSTRUCTIONS: dict[str, str] = {
    "summarization": (
        "Task: Legal Document Summarization. "
        "Produce a concise summary with: key facts, legal issues, obligations/rights, deadlines, and risks."
    ),
    "case_discovery": (
        "Task: Case Discovery. "
        "Identify and compare the most relevant case snippets from context. "
        "Return relevance reasoning and practical takeaways."
    ),
    "drafting": (
        "Task: Legal Drafting. "
        "Draft structured legal text based on available context. "
        "Use headings, defined sections, and placeholders where facts are missing."
    ),
    "query_answering": (
        "Task: Legal Query Answering. "
        "Answer directly, then provide supporting legal context from sources."
    ),
}

PERSONA_INSTRUCTIONS: dict[str, str] = {
    "practitioner": (
        "Persona: Practitioner. Be concise and action-oriented. "
        "Highlight risks, next steps, and practical implications. "
        "Avoid lengthy teaching unless asked."
    ),
    "learner": (
        "Persona: Learner. Explain concepts step-by-step, define legal terms, "
        "and include brief examples or checklists where helpful."
    ),
}


def _persona_instruction(persona: str | None) -> str:
    if not persona:
        return ""
    return PERSONA_INSTRUCTIONS.get(persona.lower(), "")


class LLMOutputCitation(BaseModel):
    chunk_id: str
    verbatim_quote: str


class LLMOutput(BaseModel):
    answer: str
    citations: list[LLMOutputCitation]


INTENT_KEYWORDS: dict[str, tuple[str, ...]] = {
    "summarization": (
        "summarize",
        "summary",
        "gist",
        "short note",
        "brief",
    ),
    "case_discovery": (
        "similar case",
        "precedent",
        "case law",
        "judgment like",
        "supreme court",
        "high court",
    ),
    "drafting": (
        "draft",
        "prepare notice",
        "petition",
        "agreement",
        "legal notice",
        "affidavit",
        "reply",
        "plaint",
    ),
    "query_answering": (
        "what",
        "why",
        "how",
        "is it",
        "can i",
    ),
}


def detect_intent(query: str) -> str:
    """Classify user intent into one of the legal workflow tasks."""
    text = (query or "").lower()
    if not text:
        return "query_answering"

    scores = {task: 0 for task in INTENT_KEYWORDS}
    for task, words in INTENT_KEYWORDS.items():
        for w in words:
            if w in text:
                scores[task] += 1

    best = max(scores.items(), key=lambda item: item[1])
    return best[0] if best[1] > 0 else "query_answering"


def generate_answer(
    query: str,
    context_chunks: list[dict],
    conversation_history: list[dict] | None = None,
    task: str = "query_answering",
    persona: str | None = None,
) -> str:
    """Generate a RAG answer given query + retrieved context chunks.

    ``context_chunks`` should be dicts with at least ``text`` and ``filename`` keys.
    ``conversation_history`` is a list of ``{"role": ..., "content": ...}`` dicts.
    """
    # Build context block
    context_parts: list[str] = []
    for i, chunk in enumerate(context_chunks, 1):
        src = chunk.get("filename", "unknown")
        context_parts.append(f"[Source {i}: {src}]\n{chunk['text']}")
    context_block = "\n\n---\n\n".join(context_parts)

    # Assemble messages
    task_instruction = TASK_INSTRUCTIONS.get(task, TASK_INSTRUCTIONS["query_answering"])
    if task == "drafting":
        task_instruction = f"{task_instruction}\n\n{INDIAN_DRAFTING_REFERENCE}"
    persona_instruction = _persona_instruction(persona)
    system_prompt = f"{BASE_SYSTEM_PROMPT}\n\n{task_instruction}"
    if persona_instruction:
        system_prompt = f"{system_prompt}\n\n{persona_instruction}"
    messages: list[dict] = [{"role": "system", "content": system_prompt}]

    if conversation_history:
        # Keep last N turns to stay within token limits
        messages.extend(conversation_history[-6:])

    messages.append(
        {
            "role": "user",
            "content": (
                f"Context documents:\n\n{context_block}\n\n"
                f"---\n\nQuestion: {query}"
            ),
        }
    )

    return chat_completion(cast(Any, messages))


def generate_answer_with_citations(
    query: str,
    context_chunks: list[dict],
    conversation_history: list[dict] | None = None,
    task: str = "query_answering",
    persona: str | None = None,
) -> tuple[str, list[dict]]:
    """Return answer text and validated citations using JSON schema output."""
    task_instruction = TASK_INSTRUCTIONS.get(task, TASK_INSTRUCTIONS["query_answering"])
    if task == "drafting":
        task_instruction = f"{task_instruction}\n\n{INDIAN_DRAFTING_REFERENCE}"

    source_map: dict[str, dict] = {}
    context_parts: list[str] = []
    for i, chunk in enumerate(context_chunks, 1):
        chunk_id = f"{chunk.get('document_id', '')}:{chunk.get('chunk_index', i)}"
        source_map[chunk_id] = chunk
        src = chunk.get("filename", "unknown")
        text = chunk.get("text", "")
        context_parts.append(f"[Source {i}] chunk_id={chunk_id} file={src}\n{text}")

    context_block = "\n\n---\n\n".join(context_parts)

    persona_instruction = _persona_instruction(persona)
    system_prompt = (
        f"{BASE_SYSTEM_PROMPT}\n\n{task_instruction}"
        + (f"\n\n{persona_instruction}" if persona_instruction else "")
        + "\n\nOutput JSON only with shape: {"
        "\"answer\": string, \"citations\": [{\"chunk_id\": string, \"verbatim_quote\": string}]}\n"
        "Use verbatim_quote as exact text from the cited chunk."
    )

    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    if conversation_history:
        messages.extend(conversation_history[-6:])

    messages.append(
        {
            "role": "user",
            "content": (
                f"Context documents:\n\n{context_block}\n\n"
                f"---\n\nQuestion: {query}"
            ),
        }
    )

    raw = chat_completion(
        cast(Any, messages),
        response_format={"type": "json_object"},
    )

    try:
        parsed = LLMOutput.model_validate(json.loads(raw))
    except (ValidationError, json.JSONDecodeError) as exc:
        raise ValueError(f"Invalid LLM JSON output: {exc}")

    citations: list[dict] = []
    for cite in parsed.citations:
        chunk = source_map.get(cite.chunk_id)
        if not chunk:
            continue
        text = str(chunk.get("text", ""))
        if cite.verbatim_quote not in text:
            continue
        citations.append(
            {
                "document_id": chunk.get("document_id", ""),
                "filename": chunk.get("filename", ""),
                "chunk_id": cite.chunk_id,
                "verbatim_quote": cite.verbatim_quote,
                "score": float(chunk.get("rerank_score", chunk.get("score", 0.0))),
                "source_url": None,
                "last_verified": None,
            }
        )

    return parsed.answer, citations
