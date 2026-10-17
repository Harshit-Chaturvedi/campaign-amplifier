import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.database import engine, Base
from app.seed import seed
from app.routers import (
    auth, campaigns, drafts, contributions,
    social, notifications, admin, ai, uploads
)

# Ensure uploads directory exists
os.makedirs(os.path.abspath(settings.UPLOADS_DIR), exist_ok=True)

# Create tables
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-seed database if empty on startup
    seed()
    yield

app = FastAPI(
    title="Campaign Amplification Platform API",
    description="Community-funded advertising distribution platform backend. Not a donation platform.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded assets
app.mount("/uploads", StaticFiles(directory=os.path.abspath(settings.UPLOADS_DIR)), name="uploads")

# Serve tiny Admin HTML page at /admin
STATIC_ADMIN_HTML = os.path.join(os.path.dirname(__file__), "static", "admin.html")

@app.get("/admin", include_in_schema=False)
def serve_admin_page():
    return FileResponse(STATIC_ADMIN_HTML)

# Include API v1 routers
api_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(campaigns.router, prefix=api_prefix)
app.include_router(drafts.router, prefix=api_prefix)
app.include_router(contributions.router, prefix=api_prefix)
app.include_router(social.router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
app.include_router(ai.router, prefix=api_prefix)
app.include_router(uploads.router, prefix=api_prefix)


from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

@app.get("/health", tags=["system"])
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as err:
        db_status = f"error: {str(err)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "campaign-amplifier-backend",
        "database": db_status,
        "version": "1.0.0"
    }
