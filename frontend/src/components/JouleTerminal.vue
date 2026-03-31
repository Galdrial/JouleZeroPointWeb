<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import api from "../utils/api";
import { useAuthStore } from "../stores/auth";

/**
 * Component Props
 * @property {boolean} isOpen - Controls the visibility of the terminal drawer.
 */
const props = defineProps<{
  isOpen: boolean;
}>();

// Global Orchestration: Identity & Session
const authStore = useAuthStore();
const emit = defineEmits(["close"]);

// UI State: Discourse & Input Buffer
const inputMessage = ref("");
const messages = ref<{ role: string; text: string }[]>([
  {
    role: "ai",
    text: "Operational Status: Online. I am the Zero Point Terminal. You can query me regarding game regulations, lore fragments, or specific card frequencies (stats). Enter your directive, Constructor.",
  },
]);

// Protocol State
const loading = ref(false);
const threadId = ref<string | null>(null); // Persistent AI context identifier
const chatBoxRow = ref<HTMLElement | null>(null);
const MAX_MESSAGE_LENGTH = 1200; // Thermal limit for input strings

/**
 * UI Support: Viewport Synchronization
 * Ensures the dialogue stream scrolls to the latest transmission.
 */
const scrollToBottom = async () => {
  await nextTick();
  if (chatBoxRow.value) {
    chatBoxRow.value.scrollTop = chatBoxRow.value.scrollHeight;
  }
};

/**
 * Memory Flush: Reset Terminal Protocol
 * Purges the current thread and restores the default state.
 */
const resetChat = () => {
  threadId.value = null;
  messages.value = [
    {
      role: "ai",
      text: "Synchronization complete. Terminal protocol reset. Enter your directive, Constructor.",
    },
  ];
};

/**
 * Text Synthesis: Content Formatting Bridge
 * Sanitizes and transforms raw AI output into semantic HTML.
 * @param text Raw response string
 */
const formatMessage = (text: string) => {
  if (!text) return "";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  
  // Transform newlines and markdown-like patterns
  let html = escaped.replace(/\n/g, "<br/>");
  html = html.replace(/\. ([A-Z])/g, ".<br/><br/>$1");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(?:^|<br\/>)\s*-\s+(.*?)(?=<br\/>|$)/g, "<br/>• $1");
  return html;
};

/**
 * Execution Protocol: Transmit Directive to Oracle
 * Interfaces with the central Matrix AI engine.
 */
const sendMessage = async () => {
  // Guard Clauses: Prevent empty or concurrent transmissions
  if (!inputMessage.value.trim()) return;

  // Thermal Limit Validation
  if (inputMessage.value.length > MAX_MESSAGE_LENGTH) {
    messages.value.push({
      role: "error",
      text: `Input Error: Directive exceeds thermal limit (max ${MAX_MESSAGE_LENGTH} characters).`,
    });
    return;
  }

  const userText = inputMessage.value;
  messages.value.push({ role: "user", text: userText });
  inputMessage.value = "";
  loading.value = true;
  await scrollToBottom();

  try {
    // Sychronize with the Matrix AI service
    const response = await api.post("/terminal/chat", {
      message: userText,
      threadId: threadId.value,
    });

    threadId.value = response.data.threadId;
    messages.value.push({ role: "ai", text: response.data.reply });
  } catch (error: any) {
    messages.value.push({
      role: "error",
      text:
        error.response?.data?.error ||
        "Quantum Interference detected. Unable to reach the IA core.",
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};

// --- Perspective Observers ---

// Auto-scroll when modal opens
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      scrollToBottom();
    }
  },
);

// Identity Isolation: Reset chat when current user changes
watch(
  () => authStore.username,
  () => {
    resetChat();
  }
);

/**
 * Custom Directive: Detect clicks outside the target element.
 * Bridges to the close emission.
 */
const vClickOutside = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: any) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.body.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted(el: any) {
    document.body.removeEventListener("click", el.clickOutsideEvent);
  },
};
</script>
>

<template>
  <Transition name="terminal-slide">
    <div
      v-if="isOpen"
      class="terminal-modal glass-panel"
      v-click-outside="() => $emit('close')"
    >
      <div class="terminal-header">
        <div class="terminal-title">
          <span class="pulse-dot"></span>
          TERMINALE PUNTO ZERO
        </div>
        <div class="terminal-actions">
          <button
            @click="resetChat"
            class="action-btn"
            title="Reset Sincronizzazione"
          >
            ⟳
          </button>
          <button @click="$emit('close')" class="action-btn close-btn">
            ✕
          </button>
        </div>
      </div>

      <div class="chat-history" ref="chatBoxRow">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['chat-bubble', msg.role]"
        >
          <span class="sender"
            >{{
              msg.role === "user"
                ? "COSTRUTTORE"
                : msg.role === "error"
                  ? "SISTEMA"
                  : "TERMINALE"
            }}:</span
          >
          <div class="message-content" v-html="formatMessage(msg.text)"></div>
        </div>

        <div v-if="loading" class="chat-bubble ai typing">
          <span class="sender">TERMINALE:</span> Elaborazione...
          <span class="cursor">_</span>
        </div>
      </div>

      <form class="chat-input-area" @submit.prevent="sendMessage">
        <input
          v-model="inputMessage"
          type="text"
          class="glass-input"
          placeholder="Inserisci direttiva..."
          :disabled="loading"
          :maxlength="MAX_MESSAGE_LENGTH"
        />
        <button
          type="submit"
          class="cyber-btn btn-primary send-btn"
          :disabled="loading || !inputMessage.trim()"
        >
          INVIA
        </button>
      </form>
    </div>
  </Transition>
</template>

<style scoped>
.terminal-modal {
  position: fixed;
  bottom: 6rem;
  right: 2rem;
  width: 400px;
  height: 550px;
  max-height: 80vh;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  box-shadow:
    0 10px 50px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(var(--accent-gold-rgb), 0.14);
  border: 1px solid var(--glass-border);
  background: rgba(10, 15, 20, 0.95);
  backdrop-filter: blur(15px);
}

.terminal-header {
  padding: 1rem 1.2rem;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--glass-border);
}

.terminal-title {
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--accent-gold);
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--accent-gold);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--accent-gold);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.terminal-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 0.2rem;
  transition: all 0.2s;
}

.action-btn:hover {
  color: var(--accent-gold);
  transform: scale(1.1);
}

.close-btn:hover {
  color: var(--accent-magenta);
}

.chat-history {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chat-history::-webkit-scrollbar {
  width: 4px;
}

.chat-history::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 10px;
}

.chat-bubble {
  background: rgba(255, 255, 255, 0.03);
  padding: 0.8rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.5;
  border-left: 2px solid transparent;
}

.chat-bubble.user {
  border-left: none;
  border-right: 2px solid var(--accent-gold);
  background: rgba(var(--accent-gold-rgb), 0.08);
  align-self: flex-end;
  text-align: right;
  width: auto;
  min-width: 50%;
  max-width: 85%;
}

.chat-bubble.ai {
  border-left-color: var(--accent-magenta);
  background: rgba(var(--accent-magenta-rgb), 0.06);
  align-self: flex-start;
  width: 90%;
}

.sender {
  display: block;
  font-family: var(--font-display);
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 0.3rem;
  letter-spacing: 1px;
  opacity: 0.7;
}

.user .sender {
  color: var(--accent-gold);
}
.ai .sender {
  color: var(--accent-magenta);
}

.chat-input-area {
  padding: 1rem;
  display: flex;
  gap: 0.8rem;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid var(--glass-border);
}

.chat-input-area .glass-input {
  margin: 0;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  height: auto;
}

.send-btn {
  padding: 0.5rem 1.2rem;
  width: auto;
  font-size: 0.7rem;
  letter-spacing: 2px;
  flex-shrink: 0;
}

/* Transitions */
.terminal-slide-enter-active,
.terminal-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.terminal-slide-enter-from,
.terminal-slide-leave-to {
  transform: translateY(20px) scale(0.95);
  opacity: 0;
}

.cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@media (max-width: 500px) {
  .terminal-modal {
    width: calc(100% - 2rem);
    right: 1rem;
    left: 1rem;
    bottom: 5rem;
  }
}
</style>
