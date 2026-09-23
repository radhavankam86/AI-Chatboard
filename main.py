import logging
from typing import List, Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

from app.config import settings, BASE_DIR
from app.gemini_client import gemini_service

# Logging setup
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Chat Board",
    description="Modern AI Chat Board Web Application powered by Google Gemini and FastAPI",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_path = BASE_DIR / "static"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

templates_dir = BASE_DIR / "app" / "templates"


# Request / Response Schemas
class Message(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'model'")
    content: str = Field(..., description="Text content of the message")
    pinned: Optional[bool] = Field(default=False, description="Whether message is pinned to board")


class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., description="Conversation history")
    model: str = Field(default=settings.DEFAULT_MODEL, description="Gemini model ID")
    system_prompt: Optional[str] = Field(default=None, description="Custom system instruction")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Sampling temperature")
    api_key: Optional[str] = Field(default=None, description="Optional Gemini API key override")


class ValidateKeyRequest(BaseModel):
    api_key: str


@app.get("/", response_class=HTMLResponse)
async def serve_index():
    """Serve the single-page AI Chat Board application."""
    index_file = templates_dir / "index.html"
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="index.html template not found")
    return HTMLResponse(content=index_file.read_text(encoding="utf-8"))


@app.get("/api/config")
async def get_config():
    """Return public configuration, models, and board categories."""
    return {
        "app_name": settings.APP_NAME,
        "has_api_key": bool(settings.GEMINI_API_KEY),
        "default_model": settings.DEFAULT_MODEL,
        "models": settings.AVAILABLE_MODELS,
        "categories": settings.BOARD_CATEGORIES
    }


@app.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """Stream chat completion tokens from Gemini via SSE."""
    messages_payload = [m.model_dump() for m in request.messages]

    return StreamingResponse(
        gemini_service.stream_chat(
            messages=messages_payload,
            model=request.model,
            system_prompt=request.system_prompt,
            temperature=request.temperature,
            api_key_override=request.api_key
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.post("/api/validate-key")
async def validate_key(req: ValidateKeyRequest):
    """Validate a Gemini API key with a small test request."""
    key = req.api_key.strip()
    if not key:
        return {"valid": False, "message": "API key cannot be empty"}

    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                return {"valid": True, "message": "API key is valid!"}
            else:
                return {"valid": False, "message": "Invalid API key or unauthorized."}
    except Exception as e:
        return {"valid": False, "message": f"Validation failed: {str(e)}"}


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "AI Chat Board"}
