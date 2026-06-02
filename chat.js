/* ==========================================================================
   TSS Exam Prep Hub - Live Realtime Chat System (Vanilla JS)
   ========================================================================== */

const NAME_KEY = "tss-chat-name";
const SUPABASE_URL = "https://mkfmhuhdyrgpdwunyviq.supabase.co";
const SUPABASE_KEY = "sb_publishable_nubvk-L7h0nKlAE5LRGUaA_Qvd5zOf4";

let supabaseClient = null;
let chatMessages = [];
let activeAccent = "primary"; // primary, csa, nit
let activeChannel = "General";
let pinnedMessageIds = JSON.parse(localStorage.getItem("tss-pinned-msgs") || "[]");
let searchQuery = "";

// Setup Supabase Client
function initSupabase() {
  if (typeof supabase !== "undefined") {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return true;
  }
  console.error("Supabase CDN not loaded.");
  return false;
}

// Extract channel from message text e.g., "[CHANNEL:NIT] Hello"
function parseMessageData(rawMessage) {
  let channel = "General";
  let content = rawMessage;
  
  const channelMatch = rawMessage.match(/^\[CHANNEL:([^\]]+)\]\s*(.*)$/si);
  if (channelMatch) {
    channel = channelMatch[1];
    content = channelMatch[2];
  }
  
  return { channel, content };
}

// Toggle Pin
window.togglePin = function(msgId) {
  const index = pinnedMessageIds.indexOf(msgId);
  if (index === -1) {
    pinnedMessageIds.push(msgId);
  } else {
    pinnedMessageIds.splice(index, 1);
  }
  localStorage.setItem("tss-pinned-msgs", JSON.stringify(pinnedMessageIds));
  renderMessages();
};

window.setChatChannel = function(channel) {
  activeChannel = channel;
  
  // Update UI buttons
  document.querySelectorAll('.channel-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.channel === channel);
  });
  
  renderMessages();
};

window.promptCustomGroup = function() {
  const group = prompt("Enter Custom Group Name:");
  if (group && group.trim()) {
    setChatChannel(group.trim());
  }
};

// Render Messages inside Container
function renderMessages() {
  const container = document.getElementById("chat-messages-container");
  if (!container) return;

  const nameInput = document.getElementById("chat-name-input");
  const myName = nameInput ? nameInput.value.trim().toLowerCase() : "";

  // Filter messages by channel and search
  const filteredMessages = chatMessages.filter(m => {
    const { channel, content } = parseMessageData(m.message);
    if (channel !== activeChannel) return false;
    if (searchQuery && !content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (filteredMessages.length === 0) {
    container.innerHTML = `
      <p class="chat-placeholder">No messages in ${activeChannel} yet — say hi 👋</p>
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

  container.innerHTML = filteredMessages
    .map((m) => {
      const isMine = myName && m.name.trim().toLowerCase() === myName;
      const bubbleClass = isMine ? "mine" : "other";
      const timeStr = new Date(m.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const { content } = parseMessageData(m.message);

      // Escape HTML to prevent XSS
      let escapedMsg = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
        
      const escapedName = m.name
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // Format code blocks (```code```)
      escapedMsg = escapedMsg.replace(/```([\s\S]*?)```/g, (match, code) => {
        return `<pre class="chat-code-block"><code>${code}</code></pre>`;
      });

      const isPinned = pinnedMessageIds.includes(m.id);
      const pinClass = isPinned ? "pinned-msg" : "";

      return `
        <div class="chat-bubble-container ${bubbleClass} ${pinClass}">
          <div class="chat-meta">
            <span>${escapedName} · ${timeStr}</span>
            <button onclick="togglePin('${m.id}')" class="pin-btn ${isPinned ? 'active' : ''}">
              <i data-lucide="pin" style="width: 12px; height: 12px;"></i>
            </button>
          </div>
          <div class="chat-bubble ${isMine ? accentClass : "bg-muted text-foreground"}">
            ${escapedMsg}
          </div>
        </div>
      `;
    })
    .join("");

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

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
  const rawContent = text.trim();

  if (!name || !rawContent) return;
  
  // Prepend channel info
  const message = `[CHANNEL:${activeChannel}] ${rawContent}`;

  // Persist name in localStorage
  localStorage.setItem(NAME_KEY, name);

  const { error } = await supabaseClient
    .from("chat_messages")
    .insert({ name, message });

  if (error) {
    if (typeof showToast !== "undefined") {
      showToast("Failed to send message", "error");
    }
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
    msgInput.placeholder = "Type a message... (Use ``` for code)";
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
    chatWidget.className = \`chat-widget \${accent}-theme\`;
  }

  if (!initSupabase()) return;

  // Set username from LocalStorage
  const cachedName = localStorage.getItem(NAME_KEY);
  const nameInput = document.getElementById("chat-name-input");
  if (nameInput && cachedName) {
    nameInput.value = cachedName;
  }
  
  // Bind Search Input
  const searchInput = document.getElementById("chat-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderMessages();
    });
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
