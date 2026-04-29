"""Deterministic compensation calculators with Indian Supreme Court references."""

from __future__ import annotations

MULTIPLIER_TABLE = {
    (0, 15): 20,
    (16, 20): 18,
    (21, 25): 18,
    (26, 30): 17,
    (31, 35): 16,
    (36, 40): 15,
    (41, 45): 14,
    (46, 50): 13,
    (51, 55): 11,
    (56, 60): 9,
    (61, 65): 7,
    (66, 200): 5,
}


def _multiplier_for_age(age: int) -> int:
    for (start, end), mult in MULTIPLIER_TABLE.items():
        if start <= age <= end:
            return mult
    return 5


def motor_accident_compensation(
    age: int,
    monthly_income: float,
    dependents: int,
    future_prospects_percent: float,
    injury_type: str,
) -> dict:
    multiplier = _multiplier_for_age(age)
    annual_income = monthly_income * 12
    future_prospects = annual_income * (future_prospects_percent / 100.0)
    adjusted_income = annual_income + future_prospects

    # Deduction for personal expenses based on dependents
    if dependents <= 1:
        deduction = 0.5
    elif dependents == 2:
        deduction = 0.33
    else:
        deduction = 0.25

    loss_of_dependency = adjusted_income * (1 - deduction) * multiplier

    # Conventional heads (Pranay Sethi) - sample values
    conventional_heads = 70000.0
    if injury_type.lower() == "death":
        conventional_heads += 15000.0

    total = loss_of_dependency + conventional_heads

    return {
        "age": age,
        "monthly_income": monthly_income,
        "dependents": dependents,
        "multiplier": multiplier,
        "loss_of_dependency": round(loss_of_dependency, 2),
        "conventional_heads": round(conventional_heads, 2),
        "total_compensation": round(total, 2),
        "reference": "Sarla Verma (2009), Pranay Sethi (2017)",
        "notes": "Deterministic estimate. Provide case-specific facts for accurate assessment.",
    }


def gratuity(years_of_service: int, last_drawn_salary: float) -> dict:
    gratuity_amount = (15 / 26) * last_drawn_salary * years_of_service
    return {
        "years_of_service": years_of_service,
        "last_drawn_salary": last_drawn_salary,
        "gratuity_amount": round(gratuity_amount, 2),
        "reference": "Payment of Gratuity Act, 1972",
    }


def interim_alimony(monthly_income: float, monthly_expenses: float) -> dict:
    disposable = max(0.0, monthly_income - monthly_expenses)
    estimated = disposable * 0.35
    return {
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "estimated_monthly_support": round(estimated, 2),
        "reference": "Section 125 CrPC / Section 24 HMA (guidance only)",
    }
