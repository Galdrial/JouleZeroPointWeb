import { defineStore } from "pinia";
import { ref } from "vue";
import { chatService, type ChatMessage } from "../services/chatService";

const STORAGE_KEY = "joule-terminal-session";

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "PROTOCOLLO DI ACCESSO DIRETTO ATTIVATO. Sono il Terminale Punto Zero.\n\nInserisci la tua direttiva, Costruttore.",
};

const saveSession = (msgs: ChatMessage[], thread: string | null) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: msgs, threadId: thread }));
};

const loadSession = (): { messages: ChatMessage[]; threadId: string | null } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        return { messages: parsed.messages, threadId: parsed.threadId ?? null };
      }
    }
  } catch {
    // Ignore corrupted storage
  }
  return { messages: [{ ...WELCOME_MESSAGE }], threadId: null };
};

export const useChatStore = defineStore("chat", () => {
  const saved = loadSession();

  const messages = ref<ChatMessage[]>(saved.messages);
  const isLoading = ref(false);
  const isStreaming = ref(false);
  const threadId = ref<string | null>(saved.threadId);

  // Sync state when another tab writes or clears the session
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    if (e.newValue === null) {
      messages.value = [{ ...WELCOME_MESSAGE }];
      threadId.value = null;
    } else {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed.messages)) {
          messages.value = parsed.messages;
          threadId.value = parsed.threadId ?? null;
        }
      } catch { /* ignore corrupted data */ }
    }
  });

  /**
   * Memory Flush: Purge terminal dialogue and reset session.
   */
  const resetChat = () => {
    messages.value = [{ ...WELCOME_MESSAGE }];
    threadId.value = null;
    isLoading.value = false;
    isStreaming.value = false;
    localStorage.removeItem(STORAGE_KEY);
  };

  /**
   * Execution Protocol: Transmit message and handle streaming response.
   */
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading.value || isStreaming.value) return;

    messages.value.push({ role: "user", content });
    saveSession(messages.value, threadId.value);

    const assistantIndex = messages.value.length;
    messages.value.push({ role: "assistant", content: "" });

    isLoading.value = true;
    isStreaming.value = true;

    await chatService.streamChat(
      content,
      threadId.value,
      (delta) => {
        if (delta) {
          messages.value[assistantIndex].content += delta;
        }
      },
      () => {
        isLoading.value = false;
        isStreaming.value = false;
        saveSession(messages.value, threadId.value);
      },
      (errorObj) => {
        messages.value[assistantIndex].role = "error";
        messages.value[assistantIndex].category = errorObj.category;
        messages.value[assistantIndex].content = `ERRORE DI SINCRONIZZAZIONE: ${errorObj.message}`;
        messages.value[assistantIndex].originalInput = content;
        isLoading.value = false;
        isStreaming.value = false;
      }
    );
  };

  /**
   * Quick Retry for failed messages
   */
  const retryMessage = (originalContent: string) => {
    if (messages.value.length > 0 && messages.value[messages.value.length - 1].role === "error") {
      messages.value.pop();
    }
    if (messages.value.length > 0 && messages.value[messages.value.length - 1].role === "user") {
      messages.value.pop();
    }
    sendMessage(originalContent);
  };

  return {
    messages,
    isLoading,
    isStreaming,
    threadId,
    sendMessage,
    retryMessage,
    resetChat,
  };
});
