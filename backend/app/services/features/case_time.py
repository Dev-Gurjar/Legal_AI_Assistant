"""Case time estimation using sample datasets (placeholder for eCourts/NJDG)."""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any

from app.config import get_settings


def _load_rows() -> list[dict[str, Any]]:
    settings = get_settings()
    data_dir = Path(settings.FEATURE_DATA_DIR)
    path = data_dir / "case_time_samples.csv"
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return [row for row in reader]


def _percentile(values: list[int], pct: float) -> int:
    if not values:
        return 0
    values = sorted(values)
    k = (len(values) - 1) * pct
    f = int(k)
    c = min(f + 1, len(values) - 1)
    if f == c:
        return values[int(k)]
    d0 = values[f] * (c - k)
    d1 = values[c] * (k - f)
    return int(round(d0 + d1))


def estimate(case_type: str, court: str) -> dict:
    rows = _load_rows()
    filtered = [r for r in rows if r.get("case_type", "").lower() == case_type.lower()
                and r.get("court", "").lower() == court.lower()]
    durations = [int(float(r.get("duration_days") or 0)) for r in filtered]
    durations = [d for d in durations if d > 0]

    if not durations:
        return {
            "case_type": case_type,
            "court": court,
            "median_days": 0,
            "p25_days": 0,
            "p75_days": 0,
            "sample_size": 0,
            "histogram": [],
            "data_source": "sample",
            "warning": "No matching historical data found for the selected case type/court.",
        }

    median = _percentile(durations, 0.5)
    p25 = _percentile(durations, 0.25)
    p75 = _percentile(durations, 0.75)

    buckets = 6
    min_d, max_d = min(durations), max(durations)
    span = max(1, max_d - min_d)
    step = max(1, span // buckets)
    histogram = []
    for start in range(min_d, max_d + 1, step):
        end = min(max_d, start + step - 1)
        count = sum(1 for d in durations if start <= d <= end)
        histogram.append({"range": f"{start}-{end}", "count": count})

    warning = None
    if len(durations) < 30:
        warning = "Sample size is below 30; estimates may be unreliable."

    return {
        "case_type": case_type,
        "court": court,
        "median_days": median,
        "p25_days": p25,
        "p75_days": p75,
        "sample_size": len(durations),
        "histogram": histogram,
        "data_source": "sample",
        "warning": warning,
    }
