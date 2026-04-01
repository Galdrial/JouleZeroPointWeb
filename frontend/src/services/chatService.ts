import { useAuthStore } from "../stores/auth";

export interface ChatMessage {
  role: "user" | "assistant" | "error";
  content: string;
}

export interface ChatDelta {
  type: "content" | "error" | "done";
  content?: string;
  message?: string;
}

export const chatService = {
  /**
   * Executive Protocol: Stream Dialogue from the Oracle
   * Handles SSE connection and provides a callback for each chunk.
   */
  async streamChat(
    message: string,
    threadId: string | null,
    onDelta: (delta: string) => void,
    onDone: () => void,
    onError: (error: string) => void
  ) {
    const authStore = useAuthStore();
    const API_URL = "/api/v1";

    try {
      const response = await fetch(`${API_URL}/terminal/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": authStore.username || "",
        },
        body: JSON.stringify({ message, threadId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("ReadableStream not supported.");

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE lines
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // Keep the last incomplete line in buffer

        for (let line of lines) {
          line = line.trim();
          if (!line) continue;
          
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace("data: ", "");
            try {
              const data: ChatDelta = JSON.parse(jsonStr);
              
              if (data.type === "content" && data.content) {
                onDelta(data.content);
              } else if (data.type === "done") {
                onDone();
              } else if (data.type === "error") {
                onError(data.message || "Unknown error");
              }
            } catch (e) {
              console.error("JSON Parse Error in SSE:", e);
            }
          }
        }
      }
    } catch (err: any) {
      onError(err.message || "Connection failure");
    }
  },
};
