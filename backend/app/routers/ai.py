from fastapi import APIRouter
from app.schemas import (
    AIDraftRequest, AIVoiceDraftRequest, AISuggestRequest,
    AIDraftResponse, AISuggestResponse
)
from app.services.ai import generate_draft_with_gemini, fallback_suggest

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/draft-from-text", response_model=AIDraftResponse)
async def draft_from_text(req: AIDraftRequest):
    return await generate_draft_with_gemini(req.text)

@router.post("/voice-draft", response_model=AIDraftResponse)
async def voice_draft(req: AIVoiceDraftRequest):
    return await generate_draft_with_gemini(req.transcript)

@router.post("/suggest", response_model=AISuggestResponse)
async def suggest(req: AISuggestRequest):
    return fallback_suggest(req.topic_or_problem)
