import { defineStore } from "pinia";
import { ref } from "vue";
import { chatService, type ChatMessage } from "../services/chatService";

export const useChatStore = defineStore("chat", () => {
  // --- Operational State ---
  const messages = ref<ChatMessage[]>([
    {
      role: "assistant",
      content: "PROTOCOLLO DI ACCESSO DIRETTO ATTIVATO. Sono il Terminale Punto Zero.\n\nInserisci la tua direttiva, Costruttore.",
    },
  ]);
  
  const isLoading = ref(false);
  const isStreaming = ref(false);
  const threadId = ref<string | null>(null);

  /**
   * Memory Flush: Purge terminal dialogue and reset session.
   */
  const resetChat = () => {
    messages.value = [
      {
        role: "assistant",
        content: "MEMORIA PURGATA. Connessione ripristinata.\n\nIn attesa di nuove direttive...",
      },
    ];
    threadId.value = null;
    isLoading.value = false;
    isStreaming.value = false;
  };

  /**
   * Execution Protocol: Transmit message and handle streaming response.
   */
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading.value || isStreaming.value) return;

    // 1. Add User directive to history
    messages.value.push({ role: "user", content });
    
    // 2. Prepare Assistant Slot for incoming stream
    const assistantIndex = messages.value.length; // Will be the index of the soon-to-be-pushed assistant message
    messages.value.push({ role: "assistant", content: "" });
    
    isLoading.value = true;
    isStreaming.value = true;

    await chatService.streamChat(
      content,
      threadId.value,
      (delta) => {
        // Word by Word appearance: Append the delta content to the current message
        if (delta) {
          messages.value[assistantIndex].content += delta;
        }
      },
      () => {
        // Stream completed successfully
        isLoading.value = false;
        isStreaming.value = false;
      },
      (errorObj) => {
        // Error handling during stream or connection
        messages.value[assistantIndex].role = "error";
        messages.value[assistantIndex].category = errorObj.category;
        messages.value[assistantIndex].content = `ERRORE DI SINCRONIZZAZIONE: ${errorObj.message}`;
        messages.value[assistantIndex].originalInput = content; // Save input to allow retry
        
        isLoading.value = false;
        isStreaming.value = false;
      }
    );
  };

  /**
   * Quick Retry for failed messages
   */
  const retryMessage = (originalContent: string) => {
    // Remove the error message before retrying
    if (messages.value.length > 0 && messages.value[messages.value.length - 1].role === "error") {
      messages.value.pop();
    }
    // Remove the user message that caused the error (to avoid duplicate display)
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
