from fastapi import APIRouter

from schemas import ReportRequest
from services.llm_service import generate_interview_report

router = APIRouter()


@router.post("/generate")
def generate_report(request: ReportRequest):
    conversation_history = [dict(message) for message in request.conversation_history]
    return generate_interview_report(
        request.topic,
        request.difficulty,
        conversation_history,
    )
