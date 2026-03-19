"""Groq LLM service.

Calls Groq's hosted Llama 3.1 70B model for answer generation.
"""

from __future__ import annotations

from typing import Any, cast

from groq import Groq

from app.config import get_settings

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


def _client() -> Groq:
    return Groq(api_key=get_settings().GROQ_API_KEY)


def generate_answer(
    query: str,
    context_chunks: list[dict],
    conversation_history: list[dict] | None = None,
    task: str = "query_answering",
) -> str:
    """Generate a RAG answer given query + retrieved context chunks.

    ``context_chunks`` should be dicts with at least ``text`` and ``filename`` keys.
    ``conversation_history`` is a list of ``{"role": ..., "content": ...}`` dicts.
    """
    settings = get_settings()

    # Build context block
    context_parts: list[str] = []
    for i, chunk in enumerate(context_chunks, 1):
        src = chunk.get("filename", "unknown")
        context_parts.append(f"[Source {i}: {src}]\n{chunk['text']}")
    context_block = "\n\n---\n\n".join(context_parts)

    # Assemble messages
    task_instruction = TASK_INSTRUCTIONS.get(task, TASK_INSTRUCTIONS["query_answering"])
    messages: list[dict] = [
        {"role": "system", "content": f"{BASE_SYSTEM_PROMPT}\n\n{task_instruction}"}
    ]

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

    resp = _client().chat.completions.create(
        model=settings.LLM_MODEL,
        messages=cast(Any, messages),
        max_tokens=settings.LLM_MAX_TOKENS,
        temperature=settings.LLM_TEMPERATURE,
    )

    return resp.choices[0].message.content or ""
