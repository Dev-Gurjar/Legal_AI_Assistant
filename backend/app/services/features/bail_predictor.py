"""Heuristic bail likelihood predictor."""

from __future__ import annotations

from typing import Any


def predict(
    *,
    offense_type: str,
    max_punishment_years: int,
    is_bailable: bool,
    has_prior_conviction: bool,
    flight_risk: str,
    evidence_strength: str,
    accused_age: int,
    has_medical_grounds: bool,
    is_woman_or_child: bool,
    custody_days: int,
) -> dict[str, Any]:
    score = 50.0
    factors: list[str] = []
    cautions: list[str] = []

    if is_bailable:
        score += 20
        factors.append("Offense is bailable")
    else:
        score -= 15
        factors.append("Offense is non-bailable")

    if max_punishment_years >= 10:
        score -= 20
        cautions.append("High maximum punishment")
    elif max_punishment_years >= 7:
        score -= 10
        cautions.append("Serious punishment threshold")
    else:
        score += 5

    if has_prior_conviction:
        score -= 15
        cautions.append("Prior conviction weighs against bail")

    risk = flight_risk.lower()
    if risk == "high":
        score -= 20
        cautions.append("High flight risk")
    elif risk == "medium":
        score -= 10
    else:
        score += 5

    strength = evidence_strength.lower()
    if strength == "high":
        score -= 15
        cautions.append("Strong evidence on record")
    elif strength == "low":
        score += 10
        factors.append("Weak evidence may favor bail")

    if accused_age >= 60:
        score += 5
        factors.append("Advanced age considered")

    if has_medical_grounds:
        score += 10
        factors.append("Medical grounds present")

    if is_woman_or_child:
        score += 8
        factors.append("Special consideration for women/children")

    if custody_days >= 90:
        score += 5
        factors.append("Extended custody duration")

    score = max(0.0, min(100.0, score))

    if score >= 70:
        band = "high"
    elif score >= 40:
        band = "medium"
    else:
        band = "low"

    return {
        "offense_type": offense_type,
        "likelihood_score": round(score, 2),
        "likelihood_band": band,
        "key_factors": factors,
        "cautions": cautions,
        "reference": "Heuristic estimate based on common bail considerations under CrPC/BNSS; not legal advice.",
    }
