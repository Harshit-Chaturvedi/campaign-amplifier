import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./campaign_amplifier.db"
    JWT_SECRET: str = "super-secret-key-change-in-production-hackathon-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.8-flash"
    UPLOADS_DIR: str = "./uploads"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: Union[str, List[str]] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            if v.strip() == "*":
                return ["*"]
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    # Demo assumptions - mirrors mobile src/config/demoConfig.ts
    CPM_USD: float = 14.50
    AVG_FREQUENCY: float = 2.2
    PLATFORM_FEE_PCT: float = 0.05
    PAYMENT_FEE_PCT: float = 0.029
    PAYMENT_FEE_FIXED: float = 0.30
    MIN_GOAL: int = 500
    MAX_GOAL: int = 50000
    PRESET_AMOUNTS: List[int] = [10, 25, 50, 100, 250]
    PRESET_GOALS: List[int] = [2500, 5000, 10000, 25000]
    DEFAULT_DURATION_DAYS: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
