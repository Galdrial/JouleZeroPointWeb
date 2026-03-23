<script setup lang="ts">
import axios from "axios";
import { nextTick, ref } from "vue";

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
  // Converte \n in <br/> e gestisce i punti seguiti da spazio per andare a capo (se non sono abbreviazioni comuni)
  let html = text.replace(/\n/g, "<br/>");
  // Aggiunge un a capo dopo i punti se seguiti da spazio e lettera maiuscola (opzionale, ma richiesto dall'utente)
  html = html.replace(/\. ([A-Z])/g, ".<br/><br/>$1");
  // Supporto Markdown Base: Grassetto
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Supporto Liste (Semplice: trattino all'inizio riga)
  html = html.replace(/(?:^|<br\/>)\s*-\s+(.*?)(?=<br\/>|$)/g, "<br/>• $1");
  return html;
};

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return;

  const userText = inputMessage.value;
  messages.value.push({ role: "user", text: userText });
  inputMessage.value = "";
  loading.value = true;
  await scrollToBottom();

  try {
    const response = await axios.post("/api/chat", {
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
        "Interferenza Quantica. Impossibile connettersi al server IA.",
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};
</script>

<template>
  <div class="home-view fade-in">
    <div class="header-section">
      <h1 class="glitch-text" data-text="TERMINALE DEL PUNTO ZERO">TERMINALE DEL PUNTO ZERO</h1>
      <p class="subtitle">Interfaccia Terminale Attiva...</p>
      <button @click="resetChat" class="btn-secondary sync-btn" :disabled="loading">
        SINCRONIZZA TERMINALE
      </button>
    </div>

    <div class="glass-panel main-panel chat-container">
      <div class="chat-history" ref="chatBoxRow">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['chat-bubble', msg.role]"
        >
          <span class="sender"
            >{{
              msg.role === "user"
                ? "Costruttore"
                : msg.role === "error"
                  ? "Sistema"
                  : "Terminale"
            }}:</span
          >
          <div
            class="message-content"
            v-html="formatMessage(msg.text)"
          ></div>
        </div>

        <div v-if="loading" class="chat-bubble ai typing">
          <span class="sender">Terminale:</span> Elaborazione direttive...
          <span class="cursor">_</span>
        </div>
      </div>

      <form class="chat-input-area" @submit.prevent="sendMessage">
        <input
          v-model="inputMessage"
          type="text"
          class="glass-input"
          placeholder="Istruisci il Terminale (es: 'Come si gioca un Frammento?' o 'Quanto costa Nucleo di Basalto?')"
          :disabled="loading"
        />
        <button
          type="submit"
          class="btn-primary"
          :disabled="loading || !inputMessage.trim()"
        >
          INVIA
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.header-section {
  text-align: center;
  margin-bottom: 2rem;
}
.chat-container {
  display: flex;
  flex-direction: column;
  height: 65vh;
  min-height: 500px;
  max-width: 1000px;
  width: 100%;
  padding: 1.5rem;
}
.chat-history {
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.chat-history::-webkit-scrollbar {
  width: 6px;
}
.chat-history::-webkit-scrollbar-thumb {
  background: var(--glass-border);
  border-radius: 10px;
}
.chat-bubble {
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 8px;
  border-left: 3px solid transparent;
  font-family: var(--font-body);
  line-height: 1.6;
  font-size: 0.95rem;
}
.chat-bubble.user {
  background: rgba(0, 240, 255, 0.05);
  border-left-color: var(--accent-cyan);
  align-self: flex-end;
  width: 85%;
}
.chat-bubble.ai {
  background: rgba(255, 0, 60, 0.05);
  border-left-color: var(--accent-magenta);
  align-self: flex-start;
  width: 90%;
}
.chat-bubble.error {
  border-left-color: #ff0000;
  color: #ff80a0;
  background: rgba(255, 0, 0, 0.1);
}
.sender {
  display: block;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.75rem;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
}
.chat-bubble.user .sender {
  color: var(--accent-cyan);
}
.chat-bubble.ai .sender {
  color: var(--accent-magenta);
}
.chat-bubble.error .sender {
  color: #ff0000;
}

.chat-input-area {
  display: flex;
  gap: 1rem;
  align-items: stretch;
}
.chat-input-area .glass-input {
  margin-bottom: 0;
  flex-grow: 1;
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

/* Formattazione speciale per i messaggi del bot che contengono markdown base */
.message-content {
  white-space: pre-wrap; /* Mantiene gli a capo naturali */
  line-height: 1.6;
}
.message-content strong {
  color: var(--accent-cyan);
  text-shadow: 0 0 5px rgba(0, 240, 255, 0.3);
}
.message-content br {
  margin-bottom: 0.5rem;
  display: block;
  content: "";
}

.sync-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid var(--accent-cyan);
  color: var(--accent-cyan);
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-display);
  letter-spacing: 2px;
}

.sync-btn:hover:not(:disabled) {
  background: var(--accent-cyan);
  color: var(--bg-main);
  box-shadow: 0 0 15px var(--accent-cyan);
}

.sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
