<script setup lang="ts">
import axios from "axios";
import { nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const userInput = ref("");
const messages = ref([
  {
    role: "assistant",
    content:
      "PROTOCOLLO DI ACCESSO DIRETTO ATTIVATO. Sono il Terminale del Punto Zero.\n\nInserisci la tua direttiva, Costruttore.",
  },
]);
const isLoading = ref(false);
const threadId = ref<string | null>(null);
const chatContainer = ref<HTMLElement | null>(null);
const MAX_MESSAGE_LENGTH = 1200;

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return;

  if (userInput.value.length > MAX_MESSAGE_LENGTH) {
    messages.value.push({
      role: "assistant",
      content: `ERRORE INPUT: Messaggio troppo lungo (max ${MAX_MESSAGE_LENGTH} caratteri).`,
    });
    return;
  }

  const text = userInput.value;
  messages.value.push({ role: "user", content: text });
  userInput.value = "";
  isLoading.value = true;
  await scrollToBottom();

  try {
    const response = await axios.post("/api/chat", {
      message: text,
      threadId: threadId.value,
    });

    threadId.value = response.data.threadId;
    messages.value.push({ role: "assistant", content: response.data.reply });
  } catch (error) {
    messages.value.push({
      role: "assistant",
      content:
        "ERRORE DI SINCRONIZZAZIONE: Connessione alla Matrice interrotta. Verifica lo stato del database.",
    });
  } finally {
    isLoading.value = false;
    await scrollToBottom();
  }
};

const resetChat = () => {
  threadId.value = null;
  messages.value = [
    {
      role: "assistant",
      content:
        "MEMORIA RESETTATA. Connessione ripristinata.\n\nIn attesa di nuove direttive...",
    },
  ];
};

const goBack = () => {
  router.push("/");
};

onMounted(scrollToBottom);
</script>

<template>
  <div class="terminal-page">
    <div class="terminal-container">
      <div class="terminal-header">
        <div class="status-indicator">
          <span class="pulse-dot"></span>
          TERMINALE PUNTO ZERO
        </div>
        <div class="header-actions">
          <button @click="resetChat" class="action-btn" title="Reset">⟳</button>
          <button @click="goBack" class="action-btn" title="Esci">✕</button>
        </div>
      </div>

      <div class="chat-area" ref="chatContainer">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message-row', msg.role]"
        >
          <div class="message-bubble">
            <span
              :class="[
                'author-tag',
                msg.role === 'assistant' ? 'terminal-tag' : 'constructor-tag',
              ]"
            >
              {{ msg.role === "assistant" ? "TERMINALE:" : "COSTRUTTORE:" }}
            </span>
            <div class="message-content">{{ msg.content }}</div>
          </div>
        </div>
        <div v-if="isLoading" class="message-row assistant">
          <div class="message-bubble ghost">
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="input-area">
        <input
          v-model="userInput"
          @keyup.enter="sendMessage"
          placeholder="Inserisci direttiva..."
          :disabled="isLoading"
          :maxlength="MAX_MESSAGE_LENGTH"
          autofocus
        />
        <button
          @click="sendMessage"
          :disabled="isLoading || !userInput.trim()"
          class="cyber-btn btn-primary send-btn"
        >
          ➤
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.terminal-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport for mobile */
  background: #000;
  color: #fff;
  display: flex;
  flex-direction: column;
  z-index: 10000;
  font-family: var(--font-display);
}

.terminal-container {
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(212, 175, 55, 0.12);
  border-right: 1px solid rgba(212, 175, 55, 0.12);
  background:
    radial-gradient(
      circle at top right,
      rgba(255, 159, 28, 0.08) 0%,
      transparent 40%
    ),
    radial-gradient(
      circle at bottom left,
      rgba(212, 175, 55, 0.08) 0%,
      transparent 40%
    );
}

.terminal-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(10, 15, 20, 0.8);
  backdrop-filter: blur(20px);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  letter-spacing: 2px;
  color: var(--accent-cyan);
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
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.4;
  }
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.3s;
}

.action-btn:hover {
  opacity: 1;
  transform: scale(1.1);
  color: var(--accent-magenta);
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-cyan) transparent;
}

.message-row {
  display: flex;
  width: 100%;
}

.message-row.user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 85%;
  padding: 1.2rem;
  border-radius: 4px;
  background: rgba(255, 159, 28, 0.08);
  border-left: 2px solid var(--accent-magenta);
  position: relative;
}

.user .message-bubble {
  border-left: none;
  border-right: 2px solid var(--accent-cyan);
  background: rgba(212, 175, 55, 0.08);
  text-align: right;
}

.author-tag {
  display: block;
  font-size: 0.7rem;
  letter-spacing: 2px;
  margin-bottom: 0.5rem;
  font-weight: 800;
  text-transform: uppercase;
}

.terminal-tag {
  color: var(--accent-magenta);
  opacity: 1;
}
.constructor-tag {
  color: var(--accent-cyan);
  opacity: 1;
}

.message-content {
  line-height: 1.6;
  font-size: 1rem;
  white-space: pre-wrap;
}

.input-area {
  padding: 1.5rem;
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
  background: rgba(10, 15, 20, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 0.8rem;
  flex-shrink: 0;
}

input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem 1.5rem;
  color: #fff;
  border-radius: 4px;
  font-family: inherit;
  transition: all 0.3s;
}

input:focus {
  outline: none;
  border-color: var(--accent-cyan);
  background: rgba(212, 175, 55, 0.08);
}

.send-btn {
  padding: 0 2.5rem !important;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem !important;
}

.send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  filter: grayscale(1);
}

@media (max-width: 768px) {
  .terminal-container {
    border: none;
  }
  .terminal-header {
    padding: 1rem;
  }
  .chat-area {
    padding: 1rem;
    gap: 1rem;
  }
  .input-area {
    padding: 1rem;
    padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  }
  .message-bubble {
    padding: 1rem;
    font-size: 0.9rem;
  }
}

.typing-dots {
  display: flex;
  gap: 5px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: var(--accent-cyan);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-5px);
    opacity: 1;
  }
}
</style>
