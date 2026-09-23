# 🚀 AI Chat Board

**AI Chat Board** is a modern, responsive AI chatbot web application where users can ask questions, explore topics, and receive rich AI-generated answers. Powered by **FastAPI** and **Google Gemini**, it features real-time token streaming, conversation organization across boards, message pinning, and Markdown syntax highlighting.

---

## ✨ Key Features

- 💬 **Clean Modern Chat Interface**: Sleek dark UI with responsive design for desktop, tablet, and mobile devices.
- ⚡ **Real-Time Streaming**: Instant token-by-token streaming via Server-Sent Events (SSE).
- 📌 **Message Pinning & Bookmarks**: Pin crucial responses or solutions to your board for quick reference.
- 🗂️ **Board Categories & Organization**: Tag and filter chats by category (**General**, **Coding**, **Ideas**, **Writing**, **Research**).
- 🔍 **Live Search**: Instantly search past board chats and message contents.
- 🧠 **Google Gemini Models**: Switch between `gemini-2.5-flash`, `gemini-1.5-flash`, and `gemini-1.5-pro` on the fly.
- 💻 **Syntax Highlighting & Copy**: Formatted code blocks with language indicators and one-click copy buttons.
- 📝 **Markdown & Tables**: Full GitHub-Flavored Markdown support (tables, lists, blockquotes, inline code).
- 🎭 **Persona Presets**: Pre-configured system prompts for General Assistant, Developer/Architect, and Creative Writer.
- 📥 **Export to Markdown**: Export and download full conversations as clean `.md` files.
- 🧪 **Instant Demo Mode**: Works out-of-the-box even before adding an API key, with simple in-app setup when ready.

---

## 📁 Project Structure

```text
AI Chatboat/
├── app/
│   ├── __init__.py
│   ├── config.py           # Application settings & board categories
│   ├── gemini_client.py    # Google Gemini SSE streaming & demo fallback
│   ├── main.py             # FastAPI routes, CORS, and streaming endpoints
│   └── templates/
│       └── index.html      # Responsive single-page chat board UI
├── static/
│   ├── css/
│   │   └── style.css       # Custom styles, badges, and animations
│   └── js/
│       └── chat.js         # Frontend controller, SSE parser, and session management
├── .env.example            # Environment variables template
├── .env                    # Local environment config
├── requirements.txt        # Python package dependencies
├── run.py                  # One-click runner script
└── README.md               # Documentation
```

---

## 🏁 Quick Start Guide

### 1. Install Dependencies
Open your terminal in this directory and run:

```bash
pip install -r requirements.txt
```

### 2. Configure Your Google Gemini API Key
Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

You can supply your key in either of two ways:
- **Option A (Recommended)**: Open [`.env`](file:///C:/Users/RADHA/OneDrive/Desktop/AI%20Chatboat/.env) and set:
  ```env
  GEMINI_API_KEY=AIzaSy...your_key_here
  ```
- **Option B**: Enter it directly in the web UI by clicking **⚙️ Settings & API Key** in the sidebar.

*(Note: If no API key is provided, the app will run in Demo Mode so you can still preview and test the UI immediately!)*

### 3. Start the Server
Run the entry point:

```bash
python run.py
```

Or run via Uvicorn:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 4. Open in Your Browser
Open your browser and navigate to:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 🛠️ Configuration Settings (`.env`)

| Environment Variable | Default | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | *(empty)* | Your Google Gemini API key |
| `DEFAULT_MODEL` | `gemini-2.5-flash` | Default Gemini model used for generation |
| `HOST` | `127.0.0.1` | Local server bind address |
| `PORT` | `8000` | Port to run the web server on |
| `DEBUG` | `True` | Enable auto-reload for local development |

---

## 💡 Usage Tips

- **Send Message**: Press <kbd>Enter</kbd> to send, or <kbd>Shift + Enter</kbd> for a new line.
- **Stop Generation**: Click the **Stop** button while answers are streaming to halt generation at any time.
- **Pin Important Answers**: Hover over an answer and click the 📌 **Pin** icon to highlight and bookmark it.
- **Tag Boards**: Organize chats by selecting tags like `Coding` or `Ideas` from the top bar dropdown.
- **Export Notes**: Click the 📥 **Download** icon to save your conversation as a Markdown file.
