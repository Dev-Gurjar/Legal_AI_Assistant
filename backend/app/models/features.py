"""Feature-specific schemas."""

from __future__ import annotations

from datetime import date
from pydantic import BaseModel, Field


class CaseTimeEstimateRequest(BaseModel):
    case_type: str = Field(..., min_length=2)
    court: str = Field(..., min_length=2)


class CaseTimeEstimateResponse(BaseModel):
    case_type: str
    court: str
    median_days: int
    p25_days: int
    p75_days: int
    sample_size: int
    histogram: list[dict]
    data_source: str
    warning: str | None = None


class CostEstimateRequest(BaseModel):
    document_type: str = Field(..., min_length=2)
    state: str = Field(..., min_length=2)
    transaction_value: float = Field(..., ge=0)


class CostEstimateResponse(BaseModel):
    document_type: str
    state: str
    transaction_value: float
    total_fee: float
    base_fee: float
    rate_percent: float
    max_fee: float
    source: str


class MotorAccidentCompRequest(BaseModel):
    age: int = Field(..., ge=1, le=100)
    monthly_income: float = Field(..., ge=0)
    dependents: int = Field(..., ge=0, le=10)
    future_prospects_percent: float = Field(..., ge=0, le=100)
    injury_type: str = Field(..., min_length=2)


class MotorAccidentCompResponse(BaseModel):
    age: int
    monthly_income: float
    dependents: int
    multiplier: int
    loss_of_dependency: float
    conventional_heads: float
    total_compensation: float
    reference: str
    notes: str


class GratuityRequest(BaseModel):
    years_of_service: int = Field(..., ge=0)
    last_drawn_salary: float = Field(..., ge=0)


class GratuityResponse(BaseModel):
    years_of_service: int
    last_drawn_salary: float
    gratuity_amount: float
    reference: str


class AlimonyRequest(BaseModel):
    monthly_income: float = Field(..., ge=0)
    monthly_expenses: float = Field(..., ge=0)


class AlimonyResponse(BaseModel):
    monthly_income: float
    monthly_expenses: float
    estimated_monthly_support: float
    reference: str


class BailPredictRequest(BaseModel):
    offense_type: str = Field(..., min_length=2)
    max_punishment_years: int = Field(..., ge=0)
    is_bailable: bool
    has_prior_conviction: bool
    flight_risk: str = Field(..., min_length=3)
    evidence_strength: str = Field(..., min_length=3)
    accused_age: int = Field(..., ge=1, le=120)
    has_medical_grounds: bool
    is_woman_or_child: bool
    custody_days: int = Field(..., ge=0)


class BailPredictResponse(BaseModel):
    offense_type: str
    likelihood_score: float
    likelihood_band: str
    key_factors: list[str]
    cautions: list[str]
    reference: str


class ClientQaRequest(BaseModel):
    question: str = Field(..., min_length=3)
    top_k: int = Field(3, ge=1, le=5)


class ClientQaItem(BaseModel):
    question: str
    answer: str
    tags: list[str] = []
    reference: str | None = None
    score: float


class ClientQaResponse(BaseModel):
    query: str
    results: list[ClientQaItem]
    data_source: str


class InternModulesResponse(BaseModel):
    modules: list[dict]


class InternLessonRequest(BaseModel):
    module_id: str = Field(..., min_length=2)


class InternLessonResponse(BaseModel):
    module_id: str
    title: str
    summary: str
    checklist: list[str]
    key_cases: list[str]
    sample_tasks: list[str]
    quiz: list[dict]


class InternQuizRequest(BaseModel):
    module_id: str = Field(..., min_length=2)
    answers: list[int]


class InternQuizResponse(BaseModel):
    module_id: str
    score: int
    total_questions: int
    correct_indices: list[int]
    explanations: list[str]


class CaseFlowRequest(BaseModel):
    case_type: str = Field(..., min_length=2)
    court_level: str | None = None
    state: str | None = None


class CaseFlowResponse(BaseModel):
    case_type: str
    court_level: str | None = None
    state: str | None = None
    steps: list[dict]
    references: list[str]
    warning: str | None = None


class DraftTemplateRequest(BaseModel):
    template_id: str = Field(..., min_length=2)
    language: str = Field("en")


class DraftTemplateResponse(BaseModel):
    template_id: str
    title: str
    language: str
    content: str | None = None
    content_en: str | None = None
    content_hi: str | None = None
    placeholders: list[str]
    generated: bool = False


class DraftExportRequest(BaseModel):
    title: str = Field("Draft")
    content: str = Field(..., min_length=1)
    format: str = Field("docx")
