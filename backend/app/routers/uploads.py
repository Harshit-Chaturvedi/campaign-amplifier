import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.config import settings

router = APIRouter(tags=["uploads"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".mov", ".webm"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB

@router.post("/uploads")
async def upload_file(file: UploadFile = File(...)):
    # Validate extension
    filename = file.filename or "upload"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Ensure uploads dir exists
    uploads_dir = os.path.abspath(settings.UPLOADS_DIR)
    os.makedirs(uploads_dir, exist_ok=True)

    # Unique filename
    unique_name = f"{uuid.uuid4().hex[:12]}{ext}"
    target_path = os.path.join(uploads_dir, unique_name)

    # Read and check size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    with open(target_path, "wb") as f:
        f.write(file_bytes)

    # Return local relative URL
    return {
        "status": "ok",
        "url": f"/uploads/{unique_name}",
        "filename": unique_name,
        "size": len(file_bytes)
    }
