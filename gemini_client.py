import json
import logging
import asyncio
from typing import AsyncGenerator, Dict, Any, List, Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent"

class GeminiService:
    """Service to handle communication with Google Gemini API with streaming and demo fallback."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY

    def set_api_key(self, api_key: str):
        self.api_key = api_key

    async def _stream_demo_response(self, user_question: str) -> AsyncGenerator[str, None]:
        """Stream a friendly demo response when no API key has been added yet."""
        intro = (
            "👋 **Welcome to AI Chat Board (Demo Mode)!**\n\n"
            f"You asked: *\"{user_question}\"*\n\n"
            "This is a simulated response because a **Google Gemini API Key** has not been configured yet.\n\n"
            "### 🚀 How to Enable Full Live Gemini AI:\n"
            "1. Get your free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).\n"
            "2. Click the **⚙️ Settings** button in the sidebar or top bar.\n"
            "3. Paste your key and click **Save Settings** (or add `GEMINI_API_KEY=...` in your `.env` file).\n\n"
            "### ✨ What You Can Do with AI Chat Board:\n"
            "- **Multi-board organization**: Switch between General, Coding, Ideas, and Writing boards.\n"
            "- **Pinning & Bookmarks**: Pin important answers to your board.\n"
            "- **Live Streaming**: Enjoy real-time token streaming with syntax-highlighted code.\n"
            "- **Export**: Save your conversations as Markdown anytime.\n\n"
            "```python\n"
            "# Example: Quick Python function\n"
            "def welcome_to_chat_board(user_name=\"Friend\"):\n"
            "    return f\"Hello {user_name}, your AI Chat Board is ready to roll!\"\n"
            "\n"
            "print(welcome_to_chat_board())\n"
            "```\n\n"
            "> 💡 *Tip: Once you add your free Gemini API key, you'll be chatting with models like `gemini-2.5-flash` in real-time!*"
        )

        words = intro.split(" ")
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i:i+3]) + (" " if i + 3 < len(words) else "")
            yield json.dumps({"type": "content", "data": chunk}) + "\n"
            await asyncio.sleep(0.04)

        yield json.dumps({"type": "done"}) + "\n"

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        model: str = "gemini-2.5-flash",
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        api_key_override: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat responses from Gemini using Server-Sent Events.
        Yields JSON string chunks: {"type": "content"|"error"|"done", "data": "..."}
        """
        active_key = api_key_override or self.api_key or settings.GEMINI_API_KEY
        if not active_key:
            # Fall back to interactive demo stream so the user can test the interface immediately!
            last_user_query = ""
            for msg in reversed(messages):
                if msg.get("role") in ("user", "human"):
                    last_user_query = msg.get("content", "")
                    break
            async for chunk in self._stream_demo_response(last_user_query or "Hello!"):
                yield chunk
            return

        # Prepare contents in Gemini API format
        gemini_contents = []
        for msg in messages:
            role = "user" if msg.get("role") in ("user", "human") else "model"
            content_text = msg.get("content", "").strip()
            if content_text:
                gemini_contents.append({
                    "role": role,
                    "parts": [{"text": content_text}]
                })

        if not gemini_contents:
            yield json.dumps({"type": "error", "message": "No messages provided."}) + "\n"
            return

        payload: Dict[str, Any] = {
            "contents": gemini_contents,
            "generationConfig": {
                "temperature": max(0.0, min(2.0, temperature)),
                "maxOutputTokens": 8192,
            }
        }

        if system_prompt and system_prompt.strip():
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt.strip()}]
            }

        url = f"{GEMINI_API_URL.format(model=model)}?alt=sse&key={active_key}"

        timeout = httpx.Timeout(60.0, connect=10.0)
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                async with client.stream("POST", url, json=payload, headers={"Content-Type": "application/json"}) as response:
                    if response.status_code != 200:
                        error_body = await response.aread()
                        error_msg = f"Gemini API returned error ({response.status_code})"
                        try:
                            err_json = json.loads(error_body)
                            if "error" in err_json and "message" in err_json["error"]:
                                error_msg = err_json["error"]["message"]
                        except Exception:
                            pass
                        yield json.dumps({"type": "error", "message": error_msg}) + "\n"
                        return

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        if line.startswith("data: "):
                            raw_data = line[6:].strip()
                            if not raw_data or raw_data == "[DONE]":
                                continue
                            try:
                                chunk_json = json.loads(raw_data)
                                candidates = chunk_json.get("candidates", [])
                                if candidates:
                                    parts = candidates[0].get("content", {}).get("parts", [])
                                    for part in parts:
                                        text_delta = part.get("text", "")
                                        if text_delta:
                                            yield json.dumps({"type": "content", "data": text_delta}) + "\n"
                            except Exception as e:
                                logger.debug("Error parsing SSE chunk: %s", e)

            yield json.dumps({"type": "done"}) + "\n"

        except httpx.ConnectError:
            yield json.dumps({
                "type": "error",
                "message": "Network error: Unable to reach Gemini API. Please check your internet connection."
            }) + "\n"
        except httpx.TimeoutException:
            yield json.dumps({
                "type": "error",
                "message": "Request timed out while contacting Gemini API."
            }) + "\n"
        except Exception as e:
            logger.exception("Unexpected error in Gemini stream")
            yield json.dumps({"type": "error", "message": f"Unexpected error: {str(e)}"}) + "\n"

gemini_service = GeminiService()
