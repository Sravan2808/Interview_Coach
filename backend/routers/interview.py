from fastapi import APIRouter

from schemas import AnswerRequest, StartInterviewRequest
from services.llm_service import get_next_interviewer_message

router = APIRouter()


@router.post("/start")
def start_interview(request: StartInterviewRequest):
    first_message, _ = get_next_interviewer_message(
        request.topic,
        request.difficulty,
        [],
    )
    conversation_history = [{"role": "assistant", "content": first_message}]
    return {
        "first_message": first_message,
        "conversation_history": conversation_history,
    }


@router.post("/answer")
def submit_answer(request: AnswerRequest):
    conversation_history = [dict(message) for message in request.conversation_history]
    conversation_history.append({"role": "user", "content": request.user_answer})

    ai_message, is_complete = get_next_interviewer_message(
        request.topic,
        request.difficulty,
        conversation_history,
    )
    conversation_history.append({"role": "assistant", "content": ai_message})
    return {
        "ai_message": ai_message,
        "is_complete": is_complete,
        "conversation_history": conversation_history,
    }
