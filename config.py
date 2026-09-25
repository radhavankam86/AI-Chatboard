import os
from pathlib import Path
from dotenv import load_dotenv

# Project folder
BASE_DIR = Path(__file__).resolve().parent

# Load .env file
load_dotenv(BASE_DIR / ".env")


class Settings:
    """AI Chat Board runtime configuration."""

    APP_NAME = "AI Chat Board"

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

    DEFAULT_MODEL = os.getenv(
        "DEFAULT_MODEL",
        "gemini-2.5-flash"
    ).strip()

    HOST = os.getenv(
        "HOST",
        "0.0.0.0"
    ).strip()

    PORT = int(os.getenv("PORT", "8000"))

    DEBUG = os.getenv(
        "DEBUG",
        "False"
    ).lower() in ("true", "1", "yes")

    AVAILABLE_MODELS = [
        {
            "id": "gemini-2.5-flash",
            "name": "Gemini 2.5 Flash",
            "description": "Fast multimodal model"
        },
        {
            "id": "gemini-1.5-flash",
            "name": "Gemini 1.5 Flash",
            "description": "Lightweight fast model"
        },
        {
            "id": "gemini-1.5-pro",
            "name": "Gemini 1.5 Pro",
            "description": "Advanced reasoning model"
        }
    ]

    BOARD_CATEGORIES = [
        "General",
        "Coding",
        "Ideas",
        "Writing",
        "Research"
    ]


settings = Settings()
