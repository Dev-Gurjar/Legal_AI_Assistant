"""Cost estimator using sample state-wise fee table."""

from __future__ import annotations

import json
from pathlib import Path

from app.config import get_settings


def _load_table() -> list[dict]:
    settings = get_settings()
    path = Path(settings.FEATURE_DATA_DIR) / "cost_estimates.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def estimate(document_type: str, state: str, transaction_value: float) -> dict:
    table = _load_table()
    row = next(
        (
            r for r in table
            if r.get("document_type", "").lower() == document_type.lower()
            and r.get("state", "").lower() == state.lower()
        ),
        None,
    )
    if not row:
        return {
            "document_type": document_type,
            "state": state,
            "transaction_value": transaction_value,
            "total_fee": 0.0,
            "base_fee": 0.0,
            "rate_percent": 0.0,
            "max_fee": 0.0,
            "source": "sample",
        }

    base_fee = float(row.get("base_fee", 0.0))
    rate_percent = float(row.get("rate_percent", 0.0))
    max_fee = float(row.get("max_fee", 0.0))
    variable_fee = (transaction_value * rate_percent) / 100.0
    total_fee = base_fee + variable_fee
    if max_fee > 0:
        total_fee = min(total_fee, max_fee)

    return {
        "document_type": document_type,
        "state": state,
        "transaction_value": transaction_value,
        "total_fee": round(total_fee, 2),
        "base_fee": base_fee,
        "rate_percent": rate_percent,
        "max_fee": max_fee,
        "source": row.get("source", "sample"),
    }
