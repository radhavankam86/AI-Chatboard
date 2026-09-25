// AI Chat Board - Client Application Logic

document.addEventListener("DOMContentLoaded", () => {

  // ============================================================
  // BACKEND URL
  // ============================================================

  const BACKEND_URL = "https://YOUR-RENDER-APP.onrender.com";


  // ============================================================
  // DOM ELEMENTS
  // ============================================================

  const chatMessagesEl = document.getElementById("chat-messages");
  const userInputEl = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const stopBtn = document.getElementById("stop-btn");
  const emptyStateEl = document.getElementById("empty-state");
  const newChatBtn = document.getElementById("new-chat-btn");
  const sessionListEl = document.getElementById("session-list");
  const modelSelectEl = document.getElementById("model-select");
  const boardCategorySelectEl =
    document.getElementById("board-category-select");
  const currentBoardTitleEl =
    document.getElementById("current-board-title");
  const currentBoardBadgeEl =
    document.getElementById("current-board-badge");
  const searchInputEl = document.getElementById("search-input");
  const categoryPills =
    document.querySelectorAll(".category-pill");
  const boardCountTextEl =
    document.getElementById("board-count-text");
  const clearAllSessionsBtn =
    document.getElementById("clear-all-sessions-btn");

  // Settings
  const settingsModalEl =
    document.getElementById("settings-modal");
  const openSettingsBtn =
    document.getElementById("open-settings-btn");
  const closeSettingsBtn =
    document.getElementById("close-settings-btn");
  const cancelSettingsBtn =
    document.getElementById("cancel-settings-btn");
  const saveSettingsBtn =
    document.getElementById("save-settings-btn");
  const apiKeyInputEl =
    document.getElementById("api-key-input");
  const toggleKeyVisibilityBtn =
    document.getElementById("toggle-key-visibility");
  const tempSliderEl =
    document.getElementById("temp-slider");
  const tempValueEl =
    document.getElementById("temp-value");
  const systemPromptInputEl =
    document.getElementById("system-prompt-input");
  const presetButtons =
    document.querySelectorAll(".preset-btn");
  const apiStatusDotEl =
    document.getElementById("api-status-dot");

  // Header
  const clearChatBtn =
    document.getElementById("clear-chat-btn");
  const exportChatBtn =
    document.getElementById("export-chat-btn");
  const toastContainerEl =
    document.getElementById("toast-container");
  const sidebarEl =
    document.getElementById("sidebar");
  const sidebarBackdropEl =
    document.getElementById("sidebar-backdrop");
  const toggleSidebarBtn =
    document.getElementById("toggle-sidebar-btn");


  // ============================================================
  // STATE
  // ============================================================

  let sessions = [];
  let currentSessionId = null;
  let isGenerating = false;
  let abortController = null;
  let currentCategoryFilter = "all";
  let searchQuery = "";


  // ============================================================
  // PRESETS
  // ============================================================

  const PRESETS = {

    general:
      "You are AI Chat Board, a brilliant, friendly, and structured AI assistant. Provide concise, clear, and actionable insights with formatted Markdown and code blocks when helpful.",

    coder:
      "You are an elite Senior Full-Stack Software Engineer and Architect. Provide clean, secure, type-safe, and production-ready code with concise explanations and best practices.",

    writer:
      "You are a professional creative writer, editor, and communications strategist. Write with engaging voice, crystal-clear prose, compelling storytelling, and refined structure."

  };


  // ============================================================
  // APP SETTINGS
  // ============================================================

  let appSettings = {

    apiKey:
      localStorage.getItem(
        "aichatboard_gemini_key"
      ) || "",

    model:
      localStorage.getItem(
        "aichatboard_model"
      ) || "gemini-2.5-flash",

    temperature:
      parseFloat(
        localStorage.getItem(
          "aichatboard_temp"
        ) || "0.7"
      ),

    systemPrompt:
      localStorage.getItem(
        "aichatboard_system_prompt"
      ) || PRESETS.general

  };


  // ============================================================
  // MARKED.JS CONFIGURATION
  // ============================================================

  if (window.marked) {

    marked.setOptions({
      breaks: true,
      gfm: true
    });

  }


  // ============================================================
  // TOAST
  // ============================================================

  function showToast(message, type = "info") {

    if (!toastContainerEl) return;

    const toast = document.createElement("div");

    const colors = {

      info:
        "bg-slate-800 text-slate-100 border border-slate-700",

      success:
        "bg-emerald-600 text-white shadow-emerald-500/20",

      error:
        "bg-rose-600 text-white shadow-rose-500/20",

      warning:
        "bg-amber-600 text-white shadow-amber-500/20"

    };

    toast.className =
      `px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium
       transition-all duration-300 transform translate-y-2 opacity-0
       flex items-center gap-2 pointer-events-auto
       ${colors[type] || colors.info}`;

    toast.textContent = message;

    toastContainerEl.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove(
        "translate-y-2",
        "opacity-0"
      );
    });

    setTimeout(() => {

      toast.classList.add(
        "opacity-0",
        "translate-y-2"
      );

      setTimeout(() => {
        toast.remove();
      }, 300);

    }, 3500);
  }


  // ============================================================
  // INITIALIZE
  // ============================================================

  async function init() {

    loadSessions();

    setupEventListeners();

    await fetchBackendConfig();

    updateApiStatusDot();

    if (sessions.length === 0) {
      createNewSession();
    } else {
      selectSession(sessions[0].id);
    }

    renderSessionList();

    if (window.lucide) {
      lucide.createIcons();
    }
  }


  // ============================================================
  // API STATUS
  // ============================================================

  function updateApiStatusDot() {

    if (!apiStatusDotEl) return;

    if (appSettings.apiKey) {

      apiStatusDotEl.className =
        "w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400";

      apiStatusDotEl.title =
        "Gemini API Connected";

    } else {

      apiStatusDotEl.className =
        "w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400";

      apiStatusDotEl.title =
        "Demo Mode - Add API Key in Settings";
    }
  }


  // ============================================================
  // CHECK BACKEND
  // ============================================================

  async function fetchBackendConfig() {

    try {

      const res = await fetch(
        `${BACKEND_URL}/api/config`
      );

      if (!res.ok) {
        throw new Error(
          `Backend returned HTTP ${res.status}`
        );
      }

      const config = await res.json();

      if (
        config.has_api_key &&
        !appSettings.apiKey
      ) {

        appSettings.hasBackendKey = true;

        if (apiStatusDotEl) {

          apiStatusDotEl.className =
            "w-2 h-2 rounded-full bg-emerald-400";

          apiStatusDotEl.title =
            "Backend Gemini API Connected";
        }
      }

      if (
        config.models &&
        modelSelectEl
      ) {

        modelSelectEl.innerHTML = "";

        config.models.forEach(model => {

          const option =
            document.createElement("option");

          option.value = model.id;

          option.textContent = model.name;

          if (
            model.id === appSettings.model
          ) {
            option.selected = true;
          }

          modelSelectEl.appendChild(option);

        });
      }

    } catch (error) {

      console.error(
        "Backend connection failed:",
        error
      );

      showToast(
        "Backend is not connected.",
        "warning"
      );
    }
  }


  // ============================================================
  // SESSION STORAGE
  // ============================================================

  function loadSessions() {

    try {

      const stored =
        localStorage.getItem(
          "aichatboard_sessions"
        );

      sessions =
        stored
          ? JSON.parse(stored)
          : [];

    } catch (error) {

      console.error(
        "Could not load sessions:",
        error
      );

      sessions = [];
    }
  }


  function saveSessions() {

    localStorage.setItem(
      "aichatboard_sessions",
      JSON.stringify(sessions)
    );

    updateBoardCount();
  }


  function updateBoardCount() {

    if (!boardCountTextEl) return;

    boardCountTextEl.textContent =
      `${sessions.length} board${
        sessions.length === 1 ? "" : "s"
      } saved`;
  }


  function getCurrentSession() {

    return sessions.find(
      session =>
        session.id === currentSessionId
    );
  }


  // ============================================================
  // CREATE SESSION
  // ============================================================

  function createNewSession() {

    const newSession = {

      id:
        "board_" +
        Date.now(),

      title:
        "New Board Chat",

      category:
        "General",

      createdAt:
        new Date().toISOString(),

      messages:
        []
    };

    sessions.unshift(newSession);

    saveSessions();

    selectSession(newSession.id);

    renderSessionList();

    closeMobileSidebar();
  }


  // ============================================================
  // SELECT SESSION
  // ============================================================

  function selectSession(id) {

    currentSessionId = id;

    const session =
      getCurrentSession();

    if (session) {

      if (currentBoardTitleEl) {

        currentBoardTitleEl.textContent =
          session.title;
      }

      updateBoardBadge(
        session.category || "General"
      );

      if (boardCategorySelectEl) {

        boardCategorySelectEl.value =
          session.category || "General";
      }
    }

    renderSessionList();

    renderCurrentMessages();

    closeMobileSidebar();

    if (userInputEl) {
      userInputEl.focus();
    }
  }


  // ============================================================
  // BOARD BADGE
  // ============================================================

  function updateBoardBadge(category) {

    if (!currentBoardBadgeEl) return;

    const cat =
      category.toLowerCase();

    currentBoardBadgeEl.textContent =
      category;

    currentBoardBadgeEl.className =
      `badge-${cat} text-[10px] px-2 py-0.5 rounded-full font-medium`;
  }


  // ============================================================
  // DELETE SESSION
  // ============================================================

  function deleteSession(id, event) {

    if (event) {
      event.stopPropagation();
    }

    sessions =
      sessions.filter(
        session => session.id !== id
      );

    saveSessions();

    if (currentSessionId === id) {

      if (sessions.length > 0) {

        selectSession(
          sessions[0].id
        );

      } else {

        createNewSession();
      }

    } else {

      renderSessionList();
    }

    showToast(
      "Board chat deleted",
      "info"
    );
  }


  // ============================================================
  // RENDER SESSION LIST
  // ============================================================

  function renderSessionList() {

    if (!sessionListEl) return;

    sessionListEl.innerHTML = "";

    const filtered =
      sessions.filter(session => {

        const matchesCategory =
          currentCategoryFilter === "all" ||
          (
            session.category &&
            session.category.toLowerCase() ===
              currentCategoryFilter.toLowerCase()
          );

        const matchesSearch =
          !searchQuery ||
          session.title
            .toLowerCase()
            .includes(
              searchQuery.toLowerCase()
            ) ||
          session.messages.some(message =>
            message.content
              .toLowerCase()
              .includes(
                searchQuery.toLowerCase()
              )
          );

        return (
          matchesCategory &&
          matchesSearch
        );
      });


    if (filtered.length === 0) {

      sessionListEl.innerHTML = `
        <div class="p-6 text-center text-xs text-slate-500">
          <i data-lucide="inbox"
             class="w-6 h-6 mx-auto mb-2 opacity-50"></i>
          <span>No board chats found</span>
        </div>
      `;

      if (window.lucide) {
        lucide.createIcons();
      }

      return;
    }


    filtered.forEach(session => {

      const item =
        document.createElement("div");

      const isActive =
        session.id === currentSessionId;

      const cat =
        (
          session.category ||
          "General"
        ).toLowerCase();

      item.className =
        `group flex items-center justify-between
         p-2.5 rounded-xl cursor-pointer text-xs
         transition-all border ${
          isActive
            ? "bg-slate-800/90 border-sky-500/40 text-white font-medium shadow-sm"
            : "bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
        }`;

      item.innerHTML = `

        <div class="flex items-center gap-2.5 min-w-0">

          <span class="w-1.5 h-1.5 rounded-full
            ${
              isActive
                ? "bg-sky-400"
                : "bg-slate-600"
            }">
          </span>

          <div class="truncate">

            <div class="truncate leading-tight">
              ${escapeHtml(session.title)}
            </div>

            <div class="text-[10px] text-slate-500
              mt-0.5 flex items-center gap-1.5">

              <span class="badge-${cat}
                px-1.5 rounded text-[9px]
                uppercase tracking-wider">

                ${escapeHtml(
                  session.category || "General"
                )}

              </span>

              <span>•</span>

              <span>
                ${session.messages.length}
                msg${
                  session.messages.length === 1
                    ? ""
                    : "s"
                }
              </span>

            </div>

          </div>

        </div>

        <button
          class="delete-btn opacity-0
                 group-hover:opacity-100 p-1
                 text-slate-500 hover:text-rose-400
                 rounded transition-opacity"
          title="Delete Board">

          <i data-lucide="trash"
             class="w-3.5 h-3.5"></i>

        </button>
      `;

      item.addEventListener(
        "click",
        () => selectSession(session.id)
      );

      const deleteBtn =
        item.querySelector(".delete-btn");

      if (deleteBtn) {

        deleteBtn.addEventListener(
          "click",
          event =>
            deleteSession(
              session.id,
              event
            )
        );
      }

      sessionListEl.appendChild(item);

    });

    if (window.lucide) {
      lucide.createIcons();
    }

    updateBoardCount();
  }


  // ============================================================
  // RENDER MESSAGES
  // ============================================================

  function renderCurrentMessages() {

    if (!chatMessagesEl) return;

    const session =
      getCurrentSession();

    chatMessagesEl.innerHTML = "";

    if (
      !session ||
      session.messages.length === 0
    ) {

      if (emptyStateEl) {
        emptyStateEl.classList.remove(
          "hidden"
        );
      }

      return;
    }

    if (emptyStateEl) {
      emptyStateEl.classList.add(
        "hidden"
      );
    }

    session.messages.forEach(
      (message, index) => {

        appendMessageToDOM(
          message.role,
          message.content,
          false,
          message.pinned,
          index
        );

      }
    );

    scrollToBottom();
  }


  // ============================================================
  // APPEND MESSAGE
  // ============================================================

  function appendMessageToDOM(
    role,
    content = "",
    animate = true,
    pinned = false,
    msgIndex = null
  ) {

    if (!chatMessagesEl) {
      return null;
    }

    if (emptyStateEl) {
      emptyStateEl.classList.add(
        "hidden"
      );
    }

    const messageDiv =
      document.createElement("div");

    const isUser =
      role === "user";

    messageDiv.className =
      `message-card flex gap-3.5 p-4
       rounded-2xl transition-all ${
        animate
          ? "message-fade-in"
          : ""
      } ${
        isUser
          ? "bg-sky-950/20 border border-sky-800/30"
          : "bg-slate-900/80 border border-slate-800/80 shadow-sm"
      }`;

    const avatarHtml =
      isUser

        ? `<div class="w-8 h-8 rounded-xl
             bg-gradient-to-tr from-sky-600
             to-blue-600 flex items-center
             justify-center shrink-0 text-white
             font-bold text-xs">
             You
           </div>`

        : `<div class="w-8 h-8 rounded-xl
             bg-gradient-to-tr from-sky-500
             via-indigo-500 to-purple-600
             flex items-center justify-center
             shrink-0 text-white">

             <i data-lucide="bot"
                class="w-4 h-4"></i>

           </div>`;


    messageDiv.innerHTML = `

      ${avatarHtml}

      <div class="flex-1 min-w-0">

        <div class="flex items-center
          justify-between mb-1.5">

          <div class="flex items-center gap-2">

            <span class="text-xs font-semibold
              uppercase tracking-wider
              ${
                isUser
                  ? "text-sky-400"
                  : "text-indigo-400"
              }">

              ${isUser ? "You" : "AI Board"}

            </span>

            ${
              pinned
                ? `
                  <span class="pinned-badge">
                    <i data-lucide="pin"
                       class="w-2.5 h-2.5"></i>
                    Pinned
                  </span>
                `
                : ""
            }

          </div>

          <div class="message-actions
            flex items-center gap-1">

            <button
              class="pin-msg-btn p-1
                     text-slate-500
                     hover:text-amber-400
                     rounded transition"
              title="${
                pinned
                  ? "Unpin"
                  : "Pin to Board"
              }">

              <i data-lucide="pin"
                 class="w-3.5 h-3.5 ${
                   pinned
                     ? "fill-amber-400 text-amber-400"
                     : ""
                 }"></i>

            </button>

            <button
              class="copy-msg-btn p-1
                     text-slate-500
                     hover:text-slate-200
                     rounded transition"
              title="Copy Message">

              <i data-lucide="copy"
                 class="w-3.5 h-3.5"></i>

            </button>

          </div>

        </div>

        <div class="message-content
          prose-chat text-slate-200
          text-sm leading-relaxed
          overflow-x-auto">

          ${renderMarkdown(content)}

        </div>

      </div>
    `;


    const pinBtn =
      messageDiv.querySelector(
        ".pin-msg-btn"
      );

    if (pinBtn) {

      pinBtn.addEventListener(
        "click",
        () => togglePinMessage(msgIndex)
      );
    }


    const copyBtn =
      messageDiv.querySelector(
        ".copy-msg-btn"
      );

    if (copyBtn) {

      copyBtn.addEventListener(
        "click",
        async () => {

          try {

            await navigator.clipboard.writeText(
              content
            );

            showToast(
              "Message copied to clipboard!",
              "success"
            );

          } catch (error) {

            showToast(
              "Could not copy message",
              "error"
            );
          }

        }
      );
    }


    chatMessagesEl.appendChild(
      messageDiv
    );

    enhanceCodeBlocks(
      messageDiv
    );

    if (window.lucide) {
      lucide.createIcons();
    }

    return messageDiv;
  }


  // ============================================================
  // PIN MESSAGE
  // ============================================================

  function togglePinMessage(index) {

    if (index === null) return;

    const session =
      getCurrentSession();

    if (
      session &&
      session.messages[index]
    ) {

      session.messages[index].pinned =
        !session.messages[index].pinned;

      saveSessions();

      renderCurrentMessages();

      showToast(
        session.messages[index].pinned
          ? "Message pinned to board!"
          : "Message unpinned",
        "info"
      );
    }
  }


  // ============================================================
  // MARKDOWN
  // ============================================================

  function renderMarkdown(content) {

    if (!content) return "";

    if (window.marked) {
      return marked.parse(content);
    }

    return escapeHtml(content)
      .replace(/\n/g, "<br>");
  }


  // ============================================================
  // CODE BLOCKS
  // ============================================================

  function enhanceCodeBlocks(container) {

    if (!container) return;

    const preBlocks =
      container.querySelectorAll("pre");

    preBlocks.forEach(pre => {

      if (
        pre.parentElement &&
        pre.parentElement.classList.contains(
          "code-block-wrapper"
        )
      ) {
        return;
      }

      const code =
        pre.querySelector("code");

      let lang = "code";

      if (code) {

        const langClass =
          Array.from(
            code.classList
          ).find(
            className =>
              className.startsWith(
                "language-"
              )
          );

        if (langClass) {

          lang =
            langClass.replace(
              "language-",
              ""
            );
        }
      }

      const wrapper =
        document.createElement("div");

      wrapper.className =
        "code-block-wrapper";

      const header =
        document.createElement("div");

      header.className =
        "code-header";

      header.innerHTML = `

        <span class="font-mono
          text-xs uppercase
          tracking-wider text-slate-400">

          ${escapeHtml(lang)}

        </span>

        <button
          class="copy-btn"
          type="button">

          <i data-lucide="copy"
             class="w-3.5 h-3.5"></i>

          <span>Copy</span>

        </button>
      `;

      const copyBtn =
        header.querySelector(
          ".copy-btn"
        );

      if (copyBtn) {

        copyBtn.addEventListener(
          "click",
          async () => {

            const textToCopy =
              code
                ? code.innerText
                : pre.innerText;

            try {

              await navigator.clipboard.writeText(
                textToCopy
              );

              copyBtn.innerHTML =
                `<i data-lucide="check"
                    class="w-3.5 h-3.5 text-emerald-400"></i>
                 <span class="text-emerald-400">
                   Copied!
                 </span>`;

              if (window.lucide) {
                lucide.createIcons();
              }

              setTimeout(() => {

                copyBtn.innerHTML =
                  `<i data-lucide="copy"
                      class="w-3.5 h-3.5"></i>
                   <span>Copy</span>`;

                if (window.lucide) {
                  lucide.createIcons();
                }

              }, 2000);

            } catch (error) {

              showToast(
                "Failed to copy code",
                "error"
              );
            }
          }
        );
      }

      if (pre.parentNode) {

        pre.parentNode.insertBefore(
          wrapper,
          pre
        );

        wrapper.appendChild(pre);
      }
    });

    if (window.lucide) {
      lucide.createIcons();
    }
  }


  // ============================================================
  // SCROLL
  // ============================================================

  function scrollToBottom() {

    if (!chatMessagesEl) return;

    chatMessagesEl.scrollTop =
      chatMessagesEl.scrollHeight;
  }


  // ============================================================
  // SEND MESSAGE
  // ============================================================

  async function sendMessage() {

    const text =
      userInputEl.value.trim();

    if (
      !text ||
      isGenerating
    ) {
      return;
    }

    const session =
      getCurrentSession();

    if (!session) return;

    userInputEl.value = "";

    autoResizeInput();


    // First message title
    if (
      session.messages.length === 0
    ) {

      session.title =
        text.slice(0, 32) +
        (
          text.length > 32
            ? "..."
            : ""
        );

      if (currentBoardTitleEl) {

        currentBoardTitleEl.textContent =
          session.title;
      }

      renderSessionList();
    }


    // Add user message
    const userMsg = {

      role: "user",

      content: text,

      pinned: false

    };

    session.messages.push(
      userMsg
    );

    saveSessions();

    appendMessageToDOM(
      "user",
      text,
      true,
      false,
      session.messages.length - 1
    );

    scrollToBottom();


    // Bot message
    const botMessageDiv =
      appendMessageToDOM(
        "model",
        "",
        true,
        false,
        session.messages.length
      );

    if (!botMessageDiv) return;

    const contentEl =
      botMessageDiv.querySelector(
        ".message-content"
      );

    if (!contentEl) return;

    contentEl.innerHTML =
      `<span class="cursor-blink"></span>`;


    setGeneratingState(true);

    let fullResponseText = "";

    abortController =
      new AbortController();


    try {

      // Check backend URL
      if (
        !BACKEND_URL ||
        BACKEND_URL.includes(
          "YOUR-RENDER-APP"
        )
      ) {

        throw new Error(
          "Backend URL is not configured. Replace YOUR-RENDER-APP with your Render URL."
        );
      }


      const response =
        await fetch(
          `${BACKEND_URL}/api/chat/stream`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            signal:
              abortController.signal,

            body: JSON.stringify({

              messages:
                session.messages,

              model:
                appSettings.model,

              system_prompt:
                appSettings.systemPrompt,

              temperature:
                appSettings.temperature,

              api_key:
                appSettings.apiKey ||
                undefined
            })
          }
        );


      if (!response.ok) {

        let errorText =
          `Server returned HTTP ${response.status}`;

        try {

          const errorData =
            await response.text();

          if (errorData) {
            errorText +=
              `: ${errorData}`;
          }

        } catch (error) {
          // Ignore response parsing error
        }

        throw new Error(
          errorText
        );
      }


      if (!response.body) {

        throw new Error(
          "Backend returned an empty response."
        );
      }


      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder("utf-8");

      let buffer = "";


      while (true) {

        const {
          value,
          done
        } =
          await reader.read();

        if (done) break;

        buffer +=
          decoder.decode(
            value,
            { stream: true }
          );

        const lines =
          buffer.split("\n");

        buffer =
          lines.pop() || "";


        for (const line of lines) {

          processStreamLine(
            line,
            contentEl,
            botMessageDiv,
            responseState => {
              fullResponseText =
                responseState;
            }
          );

          // Get latest accumulated response
          if (
            botMessageDiv.dataset.response
          ) {

            fullResponseText =
              botMessageDiv.dataset.response;
          }
        }
      }


      // Process remaining buffer
      if (buffer.trim()) {

        processStreamLine(
          buffer,
          contentEl,
          botMessageDiv,
          responseState => {
            fullResponseText =
              responseState;
          }
        );

        if (
          botMessageDiv.dataset.response
        ) {

          fullResponseText =
            botMessageDiv.dataset.response;
        }
      }


      contentEl.innerHTML =
        renderMarkdown(
          fullResponseText ||
          "*(Empty response)*"
        );

      enhanceCodeBlocks(
        botMessageDiv
      );


      // Save AI response
      session.messages.push({

        role: "model",

        content:
          fullResponseText,

        pinned: false

      });

      saveSessions();


    } catch (error) {

      if (
        error.name ===
        "AbortError"
      ) {

        fullResponseText +=
          " *(Generation stopped)*";

        contentEl.innerHTML =
          renderMarkdown(
            fullResponseText
          );

        session.messages.push({

          role: "model",

          content:
            fullResponseText,

          pinned: false

        });

        saveSessions();

      } else {

        const errorMsg =
          `Unable to get response: ${error.message}`;

        contentEl.innerHTML =
          `<span class="text-rose-400 font-medium">
             ⚠️ ${escapeHtml(errorMsg)}
           </span>`;

        showToast(
          errorMsg,
          "error"
        );

        console.error(
          "Chat request error:",
          error
        );
      }

    } finally {

      setGeneratingState(false);

      abortController = null;

      renderCurrentMessages();

      scrollToBottom();
    }
  }


  // ============================================================
  // PROCESS STREAM
  // ============================================================

  function processStreamLine(
    line,
    contentEl,
    botMessageDiv,
    updateResponse
  ) {

    if (!line || !line.trim()) {
      return;
    }

    try {

      const data =
        JSON.parse(line);

      let currentResponse =
        botMessageDiv.dataset.response ||
        "";


      if (
        data.type === "content"
      ) {

        currentResponse +=
          data.data || "";

        botMessageDiv.dataset.response =
          currentResponse;

        updateResponse(
          currentResponse
        );

        contentEl.innerHTML =
          renderMarkdown(
            currentResponse
          ) +
          `<span class="cursor-blink"></span>`;

        enhanceCodeBlocks(
          botMessageDiv
        );

        scrollToBottom();
      }


      else if (
        data.type === "error"
      ) {

        currentResponse +=
          `\n\n> ⚠️ **Notice:** ${
            data.message || "Unknown error"
          }`;

        botMessageDiv.dataset.response =
          currentResponse;

        updateResponse(
          currentResponse
        );

        contentEl.innerHTML =
          renderMarkdown(
            currentResponse
          );

        enhanceCodeBlocks(
          botMessageDiv
        );

        showToast(
          data.message ||
          "Backend error",
          "error"
        );
      }


      else if (
        data.type === "done"
      ) {

        // Stream completed
      }

    } catch (error) {

      console.debug(
        "Stream JSON parse error:",
        error,
        line
      );
    }
  }


  // ============================================================
  // GENERATING STATE
  // ============================================================

  function setGeneratingState(
    generating
  ) {

    isGenerating =
      generating;

    if (generating) {

      sendBtn.classList.add(
        "hidden"
      );

      stopBtn.classList.remove(
        "hidden"
      );

      userInputEl.disabled =
        true;

    } else {

      stopBtn.classList.add(
        "hidden"
      );

      sendBtn.classList.remove(
        "hidden"
      );

      userInputEl.disabled =
        false;

      userInputEl.focus();
    }
  }


  // ============================================================
  // MOBILE SIDEBAR
  // ============================================================

  function closeMobileSidebar() {

    if (sidebarEl) {

      sidebarEl.classList.add(
        "-translate-x-full"
      );
    }

    if (sidebarBackdropEl) {

      sidebarBackdropEl.classList.add(
        "hidden"
      );
    }
  }


  function openMobileSidebar() {

    if (sidebarEl) {

      sidebarEl.classList.remove(
        "-translate-x-full"
      );
    }

    if (sidebarBackdropEl) {

      sidebarBackdropEl.classList.remove(
        "hidden"
      );
    }
  }


  // ============================================================
  // EVENT LISTENERS
  // ============================================================

  function setupEventListeners() {

    if (sendBtn) {

      sendBtn.addEventListener(
        "click",
        sendMessage
      );
    }


    if (stopBtn) {

      stopBtn.addEventListener(
        "click",
        () => {

          if (abortController) {
            abortController.abort();
          }

        }
      );
    }


    if (userInputEl) {

      userInputEl.addEventListener(
        "keydown",
        event => {

          if (
            event.key === "Enter" &&
            !event.shiftKey
          ) {

            event.preventDefault();

            sendMessage();
          }
        }
      );

      userInputEl.addEventListener(
        "input",
        autoResizeInput
      );
    }


    if (newChatBtn) {

      newChatBtn.addEventListener(
        "click",
        createNewSession
      );
    }


    // Prompt chips
    document
      .querySelectorAll(".prompt-chip")
      .forEach(chip => {

        chip.addEventListener(
          "click",
          () => {

            if (!userInputEl) return;

            userInputEl.value =
              chip.getAttribute(
                "data-prompt"
              ) ||
              chip.innerText.trim();

            sendMessage();
          }
        );

      });


    // Category pills
    categoryPills.forEach(
      pill => {

        pill.addEventListener(
          "click",
          () => {

            categoryPills.forEach(
              item => {

                item.classList.remove(
                  "bg-sky-500",
                  "text-white",
                  "active"
                );

                item.classList.add(
                  "bg-slate-800",
                  "text-slate-400"
                );
              }
            );

            pill.classList.remove(
              "bg-slate-800",
              "text-slate-400"
            );

            pill.classList.add(
              "bg-sky-500",
              "text-white",
              "active"
            );

            currentCategoryFilter =
              pill.getAttribute(
                "data-cat"
              ) || "all";

            renderSessionList();
          }
        );

      });


    // Board category
    if (boardCategorySelectEl) {

      boardCategorySelectEl.addEventListener(
        "change",
        event => {

          const session =
            getCurrentSession();

          if (session) {

            session.category =
              event.target.value;

            updateBoardBadge(
              session.category
            );

            saveSessions();

            renderSessionList();

            showToast(
              `Board tagged as "${session.category}"`,
              "info"
            );
          }
        }
      );
    }


    // Search
    if (searchInputEl) {

      searchInputEl.addEventListener(
        "input",
        event => {

          searchQuery =
            event.target.value.trim();

          renderSessionList();
        }
      );
    }


    // Model selector
    if (modelSelectEl) {

      modelSelectEl.addEventListener(
        "change",
        event => {

          appSettings.model =
            event.target.value;

          localStorage.setItem(
            "aichatboard_model",
            appSettings.model
          );

          showToast(
            `Model set to: ${appSettings.model}`,
            "info"
          );
        }
      );
    }


    // Clear all
    if (clearAllSessionsBtn) {

      clearAllSessionsBtn.addEventListener(
        "click",
        () => {

          if (
            confirm(
              "Are you sure you want to clear all board chats?"
            )
          ) {

            sessions = [];

            saveSessions();

            createNewSession();

            showToast(
              "All boards cleared",
              "info"
            );
          }
        }
      );
    }


    // Open settings
    if (openSettingsBtn) {

      openSettingsBtn.addEventListener(
        "click",
        () => {

          apiKeyInputEl.value =
            appSettings.apiKey;

          tempSliderEl.value =
            appSettings.temperature;

          tempValueEl.textContent =
            appSettings.temperature;

          systemPromptInputEl.value =
            appSettings.systemPrompt;

          settingsModalEl.classList.remove(
            "hidden"
          );
        }
      );
    }


    const hideModal = () => {

      if (settingsModalEl) {

        settingsModalEl.classList.add(
          "hidden"
        );
      }
    };


    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener(
        "click",
        hideModal
      );
    }


    if (cancelSettingsBtn) {
      cancelSettingsBtn.addEventListener(
        "click",
        hideModal
      );
    }


    if (tempSliderEl) {

      tempSliderEl.addEventListener(
        "input",
        event => {

          tempValueEl.textContent =
            event.target.value;
        }
      );
    }


    // API key visibility
    if (
      toggleKeyVisibilityBtn &&
      apiKeyInputEl
    ) {

      toggleKeyVisibilityBtn.addEventListener(
        "click",
        () => {

          const type =
            apiKeyInputEl.type ===
            "password"
              ? "text"
              : "password";

          apiKeyInputEl.type =
            type;

          const icon =
            toggleKeyVisibilityBtn.querySelector(
              "i"
            );

          if (icon) {

            icon.setAttribute(
              "data-lucide",
              type === "password"
                ? "eye"
                : "eye-off"
            );
          }

          if (window.lucide) {
            lucide.createIcons();
          }
        }
      );
    }


    // Presets
    presetButtons.forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const presetKey =
              button.getAttribute(
                "data-preset"
              );

            if (
              PRESETS[presetKey]
            ) {

              systemPromptInputEl.value =
                PRESETS[presetKey];

              showToast(
                `Applied ${button.innerText} preset`,
                "info"
              );
            }
          }
        );
      }
    );


    // Save settings
    if (saveSettingsBtn) {

      saveSettingsBtn.addEventListener(
        "click",
        async () => {

          const newKey =
            apiKeyInputEl.value.trim();

          appSettings.apiKey =
            newKey;

          appSettings.temperature =
            parseFloat(
              tempSliderEl.value
            );

          appSettings.systemPrompt =
            systemPromptInputEl.value.trim() ||
            PRESETS.general;


          localStorage.setItem(
            "aichatboard_gemini_key",
            appSettings.apiKey
          );

          localStorage.setItem(
            "aichatboard_temp",
            appSettings.temperature.toString()
          );

          localStorage.setItem(
            "aichatboard_system_prompt",
            appSettings.systemPrompt
          );


          updateApiStatusDot();

          hideModal();

          showToast(
            "Settings saved!",
            "success"
          );


          if (newKey) {

            try {

              const valRes =
                await fetch(
                  `${BACKEND_URL}/api/validate-key`,
                  {
                    method: "POST",

                    headers: {
                      "Content-Type":
                        "application/json"
                    },

                    body: JSON.stringify({
                      api_key:
                        newKey
                    })
                  }
                );


              if (!valRes.ok) {

                throw new Error(
                  `HTTP ${valRes.status}`
                );
              }


              const valData =
                await valRes.json();


              if (valData.valid) {

                showToast(
                  "Gemini API Key validated successfully!",
                  "success"
                );

              } else {

                showToast(
                  valData.message ||
                  "Key validation failed",
                  "warning"
                );
              }

            } catch (error) {

              console.error(
                "Key validation error:",
                error
              );

              showToast(
                "Could not connect to backend for key validation.",
                "error"
              );
            }
          }
        }
      );
    }


    // Clear current chat
    if (clearChatBtn) {

      clearChatBtn.addEventListener(
        "click",
        () => {

          const session =
            getCurrentSession();

          if (
            session &&
            confirm(
              "Clear all messages in this board?"
            )
          ) {

            session.messages = [];

            saveSessions();

            renderCurrentMessages();

            showToast(
              "Messages cleared",
              "info"
            );
          }
        }
      );
    }


    // Export
    if (exportChatBtn) {

      exportChatBtn.addEventListener(
        "click",
        () => {

          const session =
            getCurrentSession();

          if (
            !session ||
            session.messages.length === 0
          ) {

            showToast(
              "Nothing to export yet",
              "info"
            );

            return;
          }


          let md =
            `# ${session.title}\n`;

          md +=
            `*Category: ${
              session.category ||
              "General"
            } | Date: ${
              new Date().toLocaleString()
            }*\n\n---\n\n`;


          session.messages.forEach(
            message => {

              md +=
                `### ${
                  message.role === "user"
                    ? "🧑 You"
                    : "🤖 AI Chat Board"
                }:\n`;

              md +=
                `${message.content}\n\n`;
            }
          );


          const blob =
            new Blob(
              [md],
              {
                type:
                  "text/markdown;charset=utf-8;"
              }
            );

          const url =
            URL.createObjectURL(
              blob
            );

          const a =
            document.createElement(
              "a"
            );

          a.href = url;

          a.download =
            `${session.title
              .replace(
                /[^a-z0-9]/gi,
                "_"
              )
              .toLowerCase()
            }.md`;

          a.click();

          URL.revokeObjectURL(
            url
          );

          showToast(
            "Board exported to Markdown!",
            "success"
          );
        }
      );
    }


    // Mobile sidebar
    if (toggleSidebarBtn) {

      toggleSidebarBtn.addEventListener(
        "click",
        openMobileSidebar
      );
    }


    if (sidebarBackdropEl) {

      sidebarBackdropEl.addEventListener(
        "click",
        closeMobileSidebar
      );
    }
  }


  // ============================================================
  // AUTO RESIZE
  // ============================================================

  function autoResizeInput() {

    if (!userInputEl) return;

    userInputEl.style.height =
      "auto";

    userInputEl.style.height =
      Math.min(
        userInputEl.scrollHeight,
        180
      ) + "px";
  }


  // ============================================================
  // ESCAPE HTML
  // ============================================================

  function escapeHtml(text) {

    const div =
      document.createElement(
        "div"
      );

    div.textContent =
      String(text ?? "");

    return div.innerHTML;
  }


  // ============================================================
  // START APPLICATION
  // ============================================================

  init();

});
