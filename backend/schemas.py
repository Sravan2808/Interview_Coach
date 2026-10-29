from pydantic import BaseModel


class StartInterviewRequest(BaseModel):
    topic: str
    difficulty: str


class AnswerRequest(BaseModel):
    topic: str
    difficulty: str
    user_answer: str
    conversation_history: list[dict[str, str]]


class ReportRequest(BaseModel):
    topic: str
    difficulty: str
    conversation_history: list[dict[str, str]]
