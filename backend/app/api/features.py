"""Feature endpoints for legal workflows."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.api.auth import get_current_user
from app.models.features import (
    CaseTimeEstimateRequest,
    CaseTimeEstimateResponse,
    CostEstimateRequest,
    CostEstimateResponse,
    MotorAccidentCompRequest,
    MotorAccidentCompResponse,
    GratuityRequest,
    GratuityResponse,
    AlimonyRequest,
    AlimonyResponse,
    BailPredictRequest,
    BailPredictResponse,
    ClientQaRequest,
    ClientQaResponse,
    InternModulesResponse,
    InternLessonRequest,
    InternLessonResponse,
    InternQuizRequest,
    InternQuizResponse,
    CaseFlowRequest,
    CaseFlowResponse,
    DraftTemplateRequest,
    DraftTemplateResponse,
    DraftExportRequest,
)
from app.services.features import (
    case_time,
    cost_estimator,
    compensation,
    bail_predictor,
    client_qa,
    intern_training,
    case_flow,
    drafting,
)

router = APIRouter()


@router.post("/case-time", response_model=CaseTimeEstimateResponse)
async def estimate_case_time(body: CaseTimeEstimateRequest, user: dict = Depends(get_current_user)):
    return case_time.estimate(body.case_type, body.court)


@router.post("/cost-estimate", response_model=CostEstimateResponse)
async def estimate_cost(body: CostEstimateRequest, user: dict = Depends(get_current_user)):
    return cost_estimator.estimate(body.document_type, body.state, body.transaction_value)


@router.post("/compensation/motor-accident", response_model=MotorAccidentCompResponse)
async def motor_accident(body: MotorAccidentCompRequest, user: dict = Depends(get_current_user)):
    return compensation.motor_accident_compensation(
        age=body.age,
        monthly_income=body.monthly_income,
        dependents=body.dependents,
        future_prospects_percent=body.future_prospects_percent,
        injury_type=body.injury_type,
    )


@router.post("/compensation/gratuity", response_model=GratuityResponse)
async def gratuity(body: GratuityRequest, user: dict = Depends(get_current_user)):
    return compensation.gratuity(body.years_of_service, body.last_drawn_salary)


@router.post("/compensation/alimony", response_model=AlimonyResponse)
async def alimony(body: AlimonyRequest, user: dict = Depends(get_current_user)):
    return compensation.interim_alimony(body.monthly_income, body.monthly_expenses)


@router.post("/bail/predict", response_model=BailPredictResponse)
async def bail_predict(body: BailPredictRequest, user: dict = Depends(get_current_user)):
    return bail_predictor.predict(
        offense_type=body.offense_type,
        max_punishment_years=body.max_punishment_years,
        is_bailable=body.is_bailable,
        has_prior_conviction=body.has_prior_conviction,
        flight_risk=body.flight_risk,
        evidence_strength=body.evidence_strength,
        accused_age=body.accused_age,
        has_medical_grounds=body.has_medical_grounds,
        is_woman_or_child=body.is_woman_or_child,
        custody_days=body.custody_days,
    )


@router.post("/client-qa", response_model=ClientQaResponse)
async def client_qa_answer(body: ClientQaRequest, user: dict = Depends(get_current_user)):
    return client_qa.search(body.question, top_k=body.top_k)


@router.get("/intern/modules", response_model=InternModulesResponse)
async def intern_modules(user: dict = Depends(get_current_user)):
    return {"modules": intern_training.list_modules()}


@router.post("/intern/lesson", response_model=InternLessonResponse)
async def intern_lesson(body: InternLessonRequest, user: dict = Depends(get_current_user)):
    try:
        return intern_training.get_lesson(body.module_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))


@router.post("/intern/quiz", response_model=InternQuizResponse)
async def intern_quiz(body: InternQuizRequest, user: dict = Depends(get_current_user)):
    try:
        return intern_training.grade_quiz(body.module_id, body.answers)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))


@router.post("/case-flow", response_model=CaseFlowResponse)
async def case_flow_explain(body: CaseFlowRequest, user: dict = Depends(get_current_user)):
    return case_flow.explain(body.case_type, body.court_level, body.state)


@router.post("/drafting/template", response_model=DraftTemplateResponse)
async def drafting_template(body: DraftTemplateRequest, user: dict = Depends(get_current_user)):
    try:
        return drafting.get_template(body.template_id, body.language)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))


@router.post("/drafting/export")
async def drafting_export(body: DraftExportRequest, user: dict = Depends(get_current_user)):
    if body.format.lower() != "docx":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only docx export is supported")
    filename, stream = drafting.export_docx(body.title, body.content)
    headers = {
        "Content-Disposition": f"attachment; filename=\"{filename}.docx\"",
    }
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers=headers,
    )
