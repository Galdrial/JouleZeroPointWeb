<script setup lang="ts">
import { useRouter } from "vue-router";
import { useChatStore } from "../stores/chatStore";

// Components: Modular AI Interface
import MessageList from "../components/chat/MessageList.vue";
import InputBox from "../components/chat/InputBox.vue";

// Global Orchestration: Identity & Route Navigation
const router = useRouter();
const chatStore = useChatStore();

/**
 * Execution Protocol: Return to Home sector
 */
const goBack = () => {
  router.push("/");
};
</script>

<template>
  <div class="terminal-page">
    <div class="terminal-container">
      <header class="terminal-header">
        <div class="status-indicator">
          <span class="pulse-dot"></span>
          TERMINALE PUNTO ZERO
        </div>
        <div class="header-actions">
          <button @click="chatStore.resetChat" class="action-btn" title="Reset">⟳</button>
          <button @click="goBack" class="action-btn" title="Esci">✕</button>
        </div>
      </header>

      <!-- Central Dialogue Stream: Modular List component -->
      <MessageList 
        :messages="chatStore.messages" 
        :is-loading="chatStore.isLoading || chatStore.isStreaming" 
      />

      <!-- Directive Input: Unified command interface -->
      <InputBox 
        :is-loading="chatStore.isLoading || chatStore.isStreaming" 
        @send="chatStore.sendMessage" 
      />
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
  height: 100dvh;
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
  border-left: 1px solid rgba(var(--accent-gold-rgb), 0.12);
  border-right: 1px solid rgba(var(--accent-gold-rgb), 0.12);
  background:
    radial-gradient(
      circle at top right,
      rgba(var(--accent-magenta-rgb), 0.08) 0%,
      transparent 40%
    ),
    radial-gradient(
      circle at bottom left,
      rgba(var(--accent-gold-rgb), 0.08) 0%,
      transparent 40%
    );
}

.terminal-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(10, 15, 20, 0.82);
  backdrop-filter: blur(20px);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  letter-spacing: 2px;
  color: var(--accent-gold);
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
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
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

@media (max-width: 768px) {
  .terminal-container {
    border: none;
  }
}
</style>
