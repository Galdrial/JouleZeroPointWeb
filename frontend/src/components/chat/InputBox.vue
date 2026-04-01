<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  isLoading: boolean;
  maxMessageLength?: number;
}>();

const emit = defineEmits(["send"]);

const userInput = ref("");
const MAX_LENGTH = props.maxMessageLength || 1200;

/**
 * Transmission Protocol: Submit User Directive
 */
const handleSubmit = () => {
  if (!userInput.value.trim() || props.isLoading) return;

  if (userInput.value.length > MAX_LENGTH) {
    // Internal guard: the store also handles this if needed
    alert(`ERRORE DI INPUT: Direttiva troppo lunga (max ${MAX_LENGTH}).`);
    return;
  }

  emit("send", userInput.value);
  userInput.value = "";
};
</script>

<template>
  <form class="input-area" @submit.prevent="handleSubmit">
    <input
      v-model="userInput"
      type="text"
      placeholder="Inserisci direttiva..."
      :disabled="isLoading"
      :maxlength="MAX_LENGTH"
      autofocus
      class="glass-input"
    />
    <button
      type="submit"
      class="cyber-btn btn-primary send-btn"
      :disabled="isLoading || !userInput.trim()"
    >
      <span class="btn-label">INVIA</span>
      <span class="btn-icon">➤</span>
    </button>
  </form>
</template>

<style scoped>
.input-area {
  padding: 1rem;
  display: flex;
  gap: 0.8rem;
  background: rgba(10, 15, 20, 0.9);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.glass-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.8rem 1.2rem;
  color: #fff;
  border-radius: 4px;
  font-family: var(--font-display);
  transition: all 0.3s;
}

.glass-input:focus {
  outline: none;
  border-color: var(--accent-gold);
  background: rgba(var(--accent-gold-rgb), 0.1);
}

.send-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0 1.2rem !important;
  height: 48px;
  letter-spacing: 2px;
  font-weight: 800;
}

.btn-icon {
  font-size: 1.2rem;
}

@media (max-width: 600px) {
  .btn-label {
    display: none;
  }
}
</style>
