<script setup lang="ts">
import axios from "axios";
import { nextTick, ref, watch } from "vue";

const props = defineProps<{
  isOpen: boolean;
  username: string;
}>();

const emit = defineEmits(["close"]);

const inputMessage = ref("");
const messages = ref<{ role: string; text: string }[]>([
  {
    role: "ai",
    text: "Stato Operativo: Online. Sono il Terminale del Punto Zero. Puoi interrogarmi sul regolamento, sui frammenti di lore o sulle frequenze specifiche (statistiche) di ogni Carta. Inserisci la tua direttiva, Costruttore.",
  },
]);
const loading = ref(false);
const threadId = ref<string | null>(null);
const chatBoxRow = ref<HTMLElement | null>(null);
const MAX_MESSAGE_LENGTH = 1200;

const scrollToBottom = async () => {
  await nextTick();
  if (chatBoxRow.value) {
    chatBoxRow.value.scrollTop = chatBoxRow.value.scrollHeight;
  }
};

const resetChat = () => {
  threadId.value = null;
  messages.value = [
    {
      role: "ai",
      text: "Sincronizzazione completata. Protocollo Terminale resettato. Inserisci la tua direttiva, Costruttore.",
    },
  ];
};

const formatMessage = (text: string) => {
  if (!text) return "";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  let html = escaped.replace(/\n/g, "<br/>");
  html = html.replace(/\. ([A-Z])/g, ".<br/><br/>$1");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(?:^|<br\/>)\s*-\s+(.*?)(?=<br\/>|$)/g, "<br/>• $1");
  return html;
};

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return;

  if (inputMessage.value.length > MAX_MESSAGE_LENGTH) {
    messages.value.push({
      role: "error",
      text: `Messaggio troppo lungo (max ${MAX_MESSAGE_LENGTH} caratteri).`,
    });
    return;
  }

  const userText = inputMessage.value;
  messages.value.push({ role: "user", text: userText });
  inputMessage.value = "";
  loading.value = true;
  await scrollToBottom();

  try {
    const username = localStorage.getItem("username") || "";
    const response = await axios.post("/api/v1/terminal/chat", {
      message: userText,
      threadId: threadId.value,
    }, {
      headers: {
        "x-user": username
      }
    });

    threadId.value = response.data.threadId;
    messages.value.push({ role: "ai", text: response.data.reply });
  } catch (error: any) {
    messages.value.push({
      role: "error",
      text:
        error.response?.data?.error ||
        "Interferenza Quantica. Impossibile connettersi al server IA.",
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};

// Auto-scroll when modal opens
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      scrollToBottom();
    }
  },
);

// Reset chat when identity changes (Login/Logout isolation)
watch(
  () => props.username,
  () => {
    resetChat();
  }
);

// Direttiva click-outside per chiudere il modal (opzionale, ma utile)
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
    0 0 20px rgba(212, 175, 55, 0.14);
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
  color: var(--accent-cyan);
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--accent-cyan);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--accent-cyan);
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
  color: var(--accent-cyan);
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
  border-right: 2px solid var(--accent-cyan);
  background: rgba(212, 175, 55, 0.08);
  align-self: flex-end;
  text-align: right;
  width: auto;
  min-width: 50%;
  max-width: 85%;
}

.chat-bubble.ai {
  border-left-color: var(--accent-magenta);
  background: rgba(255, 159, 28, 0.06);
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
  color: var(--accent-cyan);
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
