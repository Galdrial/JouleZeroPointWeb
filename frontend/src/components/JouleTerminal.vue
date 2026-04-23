<script setup lang="ts">
import { watch } from "vue";
import { useAuthStore } from "../stores/auth";
import { useChatStore } from "../stores/chatStore";

// Components: Modular AI Interface
import MessageList from "./chat/MessageList.vue";
import InputBox from "./chat/InputBox.vue";

/**
 * Component Props
 * @property {boolean} isOpen - Controls the visibility of the terminal drawer.
 */
const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(["close"]);

// Global Orchestration: Identity & Conversation State
const authStore = useAuthStore();
const chatStore = useChatStore();

// Identity Isolation: Reset chat only when a different user identity is detected
watch(
  () => authStore.username,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      chatStore.resetChat();
    }
  }
);

/**
 * Custom Directive: Detect clicks outside the target element.
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

<template>
  <Transition name="terminal-slide">
    <div
      v-if="isOpen"
      class="terminal-modal glass-panel"
      v-click-outside="() => $emit('close')"
    >
      <header class="terminal-header">
        <div class="terminal-title">
          <span class="pulse-dot"></span>
          TERMINALE PUNTO ZERO
        </div>
        <div class="terminal-actions">
          <button
            @click="chatStore.resetChat"
            class="action-btn"
            title="Reset Sincronizzazione"
          >
            ⟳
          </button>
          <button @click="$emit('close')" class="action-btn close-btn">
            ✕
          </button>
        </div>
      </header>

      <!-- Central Dialogue Stream -->
      <MessageList 
        :messages="chatStore.messages" 
        :is-loading="chatStore.isLoading || chatStore.isStreaming" 
        @retry="chatStore.retryMessage"
      />

      <!-- Directive Input -->
      <InputBox 
        :is-loading="chatStore.isLoading || chatStore.isStreaming" 
        @send="chatStore.sendMessage" 
      />

      <footer class="terminal-footer">
        <p class="ai-disclaimer">
          <span class="warning-icon">⚠</span>
          <strong>AI TRANSPARENCY:</strong> Questo terminale è un sistema di intelligenza artificiale. Le risposte possono contenere imprecisioni. Non inserire dati personali.
        </p>
      </footer>
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
  background: rgba(10, 15, 20, 0.96);
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
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
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

@media (max-width: 500px) {
  .terminal-modal {
    width: calc(100% - 2rem);
    right: 1rem;
    left: 1rem;
    bottom: 5rem;
  }
}

.terminal-footer {
  padding: 0.6rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(var(--accent-gold-rgb), 0.1);
  text-align: center;
}

.ai-disclaimer {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
  letter-spacing: 0.5px;
  opacity: 0.8;
}

.ai-disclaimer strong {
  color: var(--accent-gold);
  font-size: 0.7rem;
}

.warning-icon {
  color: var(--accent-gold);
  margin-right: 4px;
}
</style>
