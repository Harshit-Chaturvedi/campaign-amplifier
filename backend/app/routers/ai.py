import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.schemas import (
    AIDraftRequest, AIVoiceDraftRequest, AISuggestRequest,
    AIDraftResponse, AISuggestResponse
)
from app.services.ai import (
    generate_draft_with_gemini, fallback_suggest, transcribe_audio_with_gemini
)
from app.models import User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])

ALLOWED_AUDIO_EXTENSIONS = {".m4a", ".mp4", ".mp3", ".wav", ".aac", ".ogg", ".webm", ".flac", ".mpeg"}
MAX_AUDIO_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/draft-from-text", response_model=AIDraftResponse)
async def draft_from_text(
    req: AIDraftRequest,
    current_user: User = Depends(get_current_user)
):
    return await generate_draft_with_gemini(req.text)

@router.post("/voice-draft", response_model=AIDraftResponse)
async def voice_draft(
    req: AIVoiceDraftRequest,
    current_user: User = Depends(get_current_user)
):
    return await generate_draft_with_gemini(req.transcript)

@router.post("/suggest", response_model=AISuggestResponse)
async def suggest(
    req: AISuggestRequest,
    current_user: User = Depends(get_current_user)
):
    return fallback_suggest(req.topic_or_problem)

@router.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    filename = file.filename or "recording.m4a"
    ext = os.path.splitext(filename)[1].lower()
    ctype = (file.content_type or "").lower()

    is_audio = ctype.startswith("audio/") or ext in ALLOWED_AUDIO_EXTENSIONS or ctype in [
        "audio/m4a", "audio/mp4", "audio/x-m4a", "audio/mpeg", "audio/mp3",
        "audio/wav", "audio/x-wav", "audio/aac", "audio/ogg", "audio/webm",
        "video/mp4", "application/octet-stream"
    ]
    if not is_audio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format. Allowed audio formats include: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}"
        )

    content = await file.read()
    if len(content) > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"Audio file exceeds maximum allowed size of {MAX_AUDIO_SIZE // (1024*1024)}MB"
        )

    # Determine standard MIME type for Gemini
    mime_type = ctype if ctype.startswith("audio/") else "audio/mp4"
    if ext == ".wav" or mime_type == "audio/x-wav":
        mime_type = "audio/wav"
    elif ext == ".mp3" or mime_type == "audio/mpeg":
        mime_type = "audio/mp3"
    elif ext in [".m4a", ".mp4", ".aac"] or mime_type in ["audio/m4a", "audio/x-m4a", "video/mp4"]:
        mime_type = "audio/mp4"
    elif ext == ".ogg":
        mime_type = "audio/ogg"
    elif ext == ".webm":
        mime_type = "audio/webm"

    transcript = await transcribe_audio_with_gemini(content, mime_type=mime_type)
    return {"transcript": transcript}

