/* ==========================================================================
   TSS Exam Prep Hub - Live Realtime Chat System (Vanilla JS)
   ========================================================================== */

const NAME_KEY = "tss-chat-name";
const SUPABASE_URL = "https://mkfmhuhdyrgpdwunyviq.supabase.co";
const SUPABASE_KEY = "sb_publishable_nubvk-L7h0nKlAE5LRGUaA_Qvd5zOf4";

let supabaseClient = null;
let chatMessages = [];
let activeAccent = "primary"; // primary, csa, nit

// Setup Supabase Client
function initSupabase() {
  if (typeof supabase !== "undefined") {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return true;
  }
  console.error("Supabase CDN not loaded.");
  return false;
}

// Render Messages inside Container
function renderMessages() {
  const container = document.getElementById("chat-messages-container");
  if (!container) return;

  const nameInput = document.getElementById("chat-name-input");
  const myName = nameInput ? nameInput.value.trim().toLowerCase() : "";

  if (chatMessages.length === 0) {
    container.innerHTML = `
      <p class="chat-placeholder">No messages yet — say hi 👋</p>
    `;
    return;
  }

  // Accent button classes
  let accentClass = "bg-primary text-primary-foreground";
  if (activeAccent === "csa") {
    accentClass = "bg-csa text-primary-foreground";
  } else if (activeAccent === "nit") {
    accentClass = "bg-nit text-white";
  }

  container.innerHTML = chatMessages
    .map((m) => {
      const isMine = myName && m.name.trim().toLowerCase() === myName;
      const bubbleClass = isMine ? "mine" : "other";
      const timeStr = new Date(m.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Escape message content and name to prevent XSS
      const escapedMsg = m.message
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const escapedName = m.name
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      return `
        <div class="chat-bubble-container ${bubbleClass}">
          <span class="chat-meta">${escapedName} · ${timeStr}</span>
          <div class="chat-bubble ${isMine ? accentClass : "bg-muted text-foreground"}">
            ${escapedMsg}
          </div>
        </div>
      `;
    })
    .join("");

  scrollToBottom();
}

function scrollToBottom() {
  const container = document.getElementById("chat-messages-container");
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

// Fetch chat history
async function fetchChatMessages() {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("Error fetching chat messages:", error);
    return;
  }

  chatMessages = data || [];
  renderMessages();
}

// Setup Realtime Subscription
function subscribeToChat() {
  if (!supabaseClient) return;

  supabaseClient
    .channel("chat_messages_rt")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages" },
      (payload) => {
        const newMsg = payload.new;
        // Check if message already exists in array (avoid duplicates)
        if (!chatMessages.some((m) => m.id === newMsg.id)) {
          chatMessages.push(newMsg);
          renderMessages();
        }
      }
    )
    .subscribe();
}

// Send Message
async function sendMessage(text) {
  if (!supabaseClient) return;

  const nameInput = document.getElementById("chat-name-input");
  const name = nameInput ? nameInput.value.trim() : "";
  const message = text.trim();

  if (!name || !message) return;

  // Persist name in localStorage
  localStorage.setItem(NAME_KEY, name);

  const { error } = await supabaseClient
    .from("chat_messages")
    .insert({ name, message });

  if (error) {
    showToast("Failed to send message", "error");
    console.error("Error inserting message:", error);
  }
}

// UI State Updates (inputs disabled if name is empty)
function updateChatControlsState() {
  const nameInput = document.getElementById("chat-name-input");
  const msgInput = document.getElementById("chat-msg-input");
  const sendBtn = document.getElementById("chat-send-btn");

  if (!nameInput || !msgInput || !sendBtn) return;

  const hasName = nameInput.value.trim().length > 0;
  msgInput.disabled = !hasName;
  sendBtn.disabled = !hasName || msgInput.value.trim().length === 0;

  if (hasName) {
    msgInput.placeholder = "Type a message...";
  } else {
    msgInput.placeholder = "Enter your name first";
  }
}

// Setup Chat Initialization
function initChat(accent = "primary") {
  activeAccent = accent;

  // Set accent themes
  const chatWidget = document.getElementById("global-chat-widget");
  if (chatWidget) {
    chatWidget.className = `chat-widget ${accent}-theme`;
  }

  if (!initSupabase()) return;

  // Set username from LocalStorage
  const cachedName = localStorage.getItem(NAME_KEY);
  const nameInput = document.getElementById("chat-name-input");
  if (nameInput && cachedName) {
    nameInput.value = cachedName;
  }

  // Bind Events
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      updateChatControlsState();
      renderMessages(); // Re-render to update the "mine" vs "other" bubble alignments
    });
  }

  const msgInput = document.getElementById("chat-msg-input");
  if (msgInput) {
    msgInput.addEventListener("input", updateChatControlsState);
  }

  const sendForm = document.getElementById("chat-send-form");
  if (sendForm) {
    sendForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!msgInput) return;

      const text = msgInput.value;
      if (!text.trim()) return;

      msgInput.value = "";
      updateChatControlsState();
      await sendMessage(text);
    });
  }

  // Initial updates & fetch
  updateChatControlsState();
  fetchChatMessages();
  subscribeToChat();
}
