"""Gemini-backed interviewer and interview report generation."""

import json
import os
import re
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

MODEL_NAME = "gemini-2.5-flash"

INTERVIEWER_SYSTEM_PROMPT = """You are an expert technical interviewer conducting an interview about {topic} at {difficulty} difficulty.

Ask one clear, focused question at a time, appropriate to the topic and difficulty. At Easy difficulty, ask basic recall and definition questions. At Medium difficulty, ask applied understanding and problem-solving questions. At Hard difficulty, ask deep expertise, trade-off, and systems-thinking questions.

After each candidate answer, choose exactly one approach:
- If the answer is strong, acknowledge it briefly in one sentence, then ask about a different aspect of the topic.
- If the answer is partially correct, ask one specific follow-up question to probe deeper. Do not reveal the correct answer.
- If the answer is incorrect, note the gap in one sentence, then move to a different question.

Monitor overall performance throughout the interview. If the candidate is clearly struggling across multiple topics, naturally conclude early with a kind note. If they are performing very well, wrap up after covering the key areas rather than continuing unnecessarily. Whenever you conclude the interview, end your message with the exact phrase: [INTERVIEW COMPLETE].

Never teach, give hints, or reveal answers. Keep your tone professional, neutral, and encouraging. Ask only one question per message."""

REPORT_SYSTEM_PROMPT = """You are an expert interview evaluator. Evaluate the candidate using the full conversation transcript and return ONLY one valid JSON object. Do not include extra text, markdown fences, or comments.

The JSON object must have exactly these fields:
- score: an integer from 0 to 100.
- strengths: a string of 2 to 4 specific sentences that reference actual candidate answers.
- weaknesses: a string of 2 to 4 specific sentences that reference actual gaps in the answers.
- revision_areas: a comma-separated string containing 3 to 5 specific topics for review.
- verdict: a string of 2 to 3 sentences giving a direct overall assessment.
- recommendation: a string whose value is exactly Pass or exactly Fail.

Scoring guide: 85 to 100 is excellent, 70 to 84 is good, 55 to 69 is adequate, and below 55 is weak performance. Base every assessment on evidence in the transcript. Ensure the JSON is syntactically valid and contains exactly the six required fields."""


def _get_client() -> genai.Client:
    """Create a Gemini client using the configured API key."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set. Add it to the environment or backend/.env.")
    return genai.Client(api_key=api_key)


def _to_gemini_contents(conversation_history: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Convert common chat-history dictionaries to Gemini user/model contents."""
    contents: list[dict[str, Any]] = []
    for message in conversation_history:
        role = str(message.get("role", "user")).lower()
        # Gemini uses "model" for assistant turns and supports "user" for candidate turns.
        gemini_role = "model" if role in {"assistant", "model", "ai"} else "user"
        content = message.get("content", message.get("text", ""))
        if content is None:
            content = ""
        contents.append({"role": gemini_role, "parts": [{"text": str(content)}]})
    return contents


def get_next_interviewer_message(
    topic: str,
    difficulty: str,
    conversation_history: list[dict[str, Any]],
) -> tuple[str, bool]:
    """Generate the next interviewer turn; return its text and completion flag."""
    system_prompt = INTERVIEWER_SYSTEM_PROMPT.format(topic=topic, difficulty=difficulty)
    contents = _to_gemini_contents(conversation_history)
    if not contents:
        contents.append({
            "role": "user",
            "parts": [{"text": f"Begin the {difficulty} technical interview on {topic} by asking the first question."}],
        })

    # Keep the client alive for the full request and close its HTTP resources
    # afterward. Chaining off a temporary client can leave the underlying
    # httpx client closed before the request is sent.
    with _get_client() as client:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
                max_output_tokens=500,
            ),
        )
    response_text = response.text or ""
    is_complete = "[INTERVIEW COMPLETE]" in response_text
    if is_complete:
        response_text = response_text.replace("[INTERVIEW COMPLETE]", "").strip()
    return response_text, is_complete


def generate_interview_report(
    topic: str,
    difficulty: str,
    conversation_history: list[dict[str, Any]],
) -> dict[str, Any]:
    """Generate and parse a structured evaluation for the full interview."""
    transcript_lines = [f"Interview topic: {topic}\nDifficulty: {difficulty}\nTranscript:"]
    for message in conversation_history:
        role = str(message.get("role", "unknown")).lower()
        label = "Interviewer" if role in {"assistant", "model", "ai", "interviewer"} else "Candidate"
        content = message.get("content", message.get("text", ""))
        transcript_lines.append(f"{label}: {content if content is not None else ''}")
    transcript = "\n".join(transcript_lines)

    with _get_client() as client:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=transcript,
            config=types.GenerateContentConfig(
                system_instruction=REPORT_SYSTEM_PROMPT,
                temperature=0.3,
                max_output_tokens=1000,
            ),
        )
    response_text = response.text or ""
    try:
        result = json.loads(response_text)
    except json.JSONDecodeError as original_error:
        match = re.search(r"\{[\s\S]*\}", response_text)
        if not match:
            raise ValueError("Gemini returned no valid JSON object for the interview report.") from original_error
        try:
            result = json.loads(match.group(0))
        except json.JSONDecodeError as extracted_error:
            raise ValueError("Gemini returned an invalid JSON object for the interview report.") from extracted_error

    if not isinstance(result, dict):
        raise ValueError("Gemini interview report must be a JSON object.")
    return result
