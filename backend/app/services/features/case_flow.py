"""Case flow explainer with sample timelines."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.config import get_settings


@lru_cache()
def _load_flows() -> dict[str, Any]:
    settings = get_settings()
    path = Path(settings.FEATURE_DATA_DIR) / "case_flows.json"
    if not path.exists():
        return {"flows": []}
    return json.loads(path.read_text(encoding="utf-8"))


def explain(case_type: str, court_level: str | None = None, state: str | None = None) -> dict[str, Any]:
    data = _load_flows()
    flows = data.get("flows") or []

    case_norm = (case_type or "").lower()
    court_norm = (court_level or "").lower()

    selected: dict[str, Any] | None = None
    for flow in flows:
        flow_case = str(flow.get("case_type", "")).lower()
        flow_court = str(flow.get("court_level", "")).lower()
        if case_norm and case_norm in flow_case:
            if court_norm and flow_court and court_norm not in flow_court:
                continue
            selected = flow
            break

    warning = None
    if not selected and flows:
        selected = flows[0]
        warning = "Exact case flow not found; showing closest available template."

    if not selected:
        return {
            "case_type": case_type,
            "court_level": court_level,
            "steps": [],
            "references": [],
            "warning": "No case flow data available.",
        }

    return {
        "case_type": selected.get("case_type", case_type),
        "court_level": selected.get("court_level", court_level),
        "state": state,
        "steps": selected.get("steps", []),
        "references": selected.get("references", []),
        "warning": warning,
    }
