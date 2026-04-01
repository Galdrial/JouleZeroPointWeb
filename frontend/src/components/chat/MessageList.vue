<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import MessageBubble from "./MessageBubble.vue";
import type { ChatMessage } from "../../services/chatService";

const props = defineProps<{
  messages: ChatMessage[];
  isLoading?: boolean;
}>();

const listContainer = ref<HTMLElement | null>(null);

/**
 * UI Support: Viewport Synchronization Protocol
 * Ensures the dialogue stream remains focused on the latest transmission.
 * Only scrolls if the user was already near the bottom or if it's the assistant talking.
 */
const scrollToBottom = async () => {
  await nextTick();
  if (listContainer.value) {
    listContainer.value.scrollTop = listContainer.value.scrollHeight;
  }
};

// --- Perspective Observers ---

// Sync scroll when messages change
watch(
  () => props.messages,
  () => scrollToBottom(),
  { deep: true }
);

// Sync scroll when loading state changes
watch(
  () => props.isLoading,
  (newVal) => {
    if (newVal) scrollToBottom();
  }
);

onMounted(scrollToBottom);
</script>

<template>
  <div class="message-list-container" ref="listContainer">
    <template v-for="(msg, index) in messages" :key="index">
      <!-- Skip rendering empty assistant messages (the streaming slot) while loading -->
      <MessageBubble
        v-if="!(msg.role === 'assistant' && msg.content === '' && isLoading)"
        :role="msg.role"
        :content="msg.content"
      />
    </template>

    <!-- System Presence Indicator: Show typing dots ONLY when waiting for first delta -->
    <MessageBubble
      v-if="isLoading && (!messages.length || messages[messages.length - 1].content === '')"
      role="assistant"
      content=""
      is-ghost
    >
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </MessageBubble>
  </div>
</template>

<style scoped>
.message-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-gold) transparent;
}

.message-list-container::-webkit-scrollbar {
  width: 4px;
}

.message-list-container::-webkit-scrollbar-thumb {
  background: var(--accent-gold);
  border-radius: 10px;
}

.typing-dots {
  display: flex;
  gap: 5px;
  padding: 0.5rem 0;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: var(--accent-gold);
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
