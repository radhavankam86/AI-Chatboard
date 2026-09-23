import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file
load_dotenv(BASE_DIR / ".env")

class Settings:
    """AI Chat Board runtime configuration."""
    APP_NAME: str = "AI Chat Board"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "gemini-2.5-flash").strip()
    HOST: str = os.getenv("HOST", "127.0.0.1").strip()
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    AVAILABLE_MODELS = [
        {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "description": "Fastest, multimodal, ideal for general chat & code"},
        {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "description": "Lightweight, ultra-fast generation"},
        {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro", "description": "Advanced reasoning & complex problem solving"},
    ]

    BOARD_CATEGORIES = ["General", "Coding", "Ideas", "Writing", "Research"]

settings = Settings()
