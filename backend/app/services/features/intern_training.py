"""Intern training module utilities."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.config import get_settings


@lru_cache()
def _load_modules() -> dict[str, Any]:
    settings = get_settings()
    path = Path(settings.FEATURE_DATA_DIR) / "intern_modules.json"
    if not path.exists():
        return {"modules": []}
    return json.loads(path.read_text(encoding="utf-8"))


def list_modules() -> list[dict[str, Any]]:
    data = _load_modules()
    modules = data.get("modules") or []
    return [
        {
            "module_id": m.get("id"),
            "title": m.get("title"),
            "summary": m.get("summary"),
        }
        for m in modules
    ]


def get_lesson(module_id: str) -> dict[str, Any]:
    data = _load_modules()
    modules = data.get("modules") or []
    for module in modules:
        if str(module.get("id")) == module_id:
            return {
                "module_id": module_id,
                "title": module.get("title"),
                "summary": module.get("summary"),
                "checklist": module.get("checklist", []),
                "key_cases": module.get("key_cases", []),
                "sample_tasks": module.get("sample_tasks", []),
                "quiz": [
                    {
                        "question": q.get("question"),
                        "options": q.get("options", []),
                    }
                    for q in module.get("quiz", [])
                ],
            }
    raise ValueError("Module not found")


def grade_quiz(module_id: str, answers: list[int]) -> dict[str, Any]:
    data = _load_modules()
    modules = data.get("modules") or []
    for module in modules:
        if str(module.get("id")) != module_id:
            continue
        quiz = module.get("quiz", [])
        total = len(quiz)
        correct_indices: list[int] = []
        explanations: list[str] = []

        score = 0
        for idx, question in enumerate(quiz):
            correct = int(question.get("answer_index", -1))
            explanations.append(str(question.get("explanation", "")))
            if idx < len(answers) and answers[idx] == correct:
                score += 1
                correct_indices.append(idx)

        return {
            "module_id": module_id,
            "score": score,
            "total_questions": total,
            "correct_indices": correct_indices,
            "explanations": explanations,
        }

    raise ValueError("Module not found")
