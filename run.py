import sys
from app.config import settings

def main():
    try:
        import uvicorn
    except ImportError:
        print("\n[!] Error: Uvicorn is not installed.")
        print("    Please run: pip install -r requirements.txt\n")
        sys.exit(1)

    print("\n" + "=" * 58)
    print(" 🚀 AI Chat Board - Modern AI Assistant Web Application")
    print("=" * 58)
    print(f" * URL:          http://{settings.HOST}:{settings.PORT}")
    print(f" * Default Model: {settings.DEFAULT_MODEL}")
    if settings.GEMINI_API_KEY:
        print(" * Gemini API:   Configured via .env [CONNECTED]")
    else:
        print(" * Gemini API:   Demo Mode active (Configure in .env or Settings)")
    print("=" * 58 + "\n")

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )

if __name__ == "__main__":
    main()
