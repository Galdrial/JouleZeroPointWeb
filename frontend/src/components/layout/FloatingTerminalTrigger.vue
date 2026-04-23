<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import logo2 from "../../assets/logo2.webp";

/**
 * Component Props
 * @property {boolean} isOpen - Current state of the terminal drawer.
 */
defineProps({
  isOpen: Boolean
});

// Event Emission: Toggle the terminal state
defineEmits(['toggle']);

// Route Orchestration: Conditional visibility
const route = useRoute();

/**
 * Visibility Logic
 * Determines if the terminal trigger should be rendered based on route metadata (hideUI flag).
 */
const hideUI = computed(() => route.meta.hideUI === true);
</script>

<template>
  <button
    v-if="!hideUI"
    class="terminal-trigger"
    :class="{ active: isOpen }"
    title="Terminale Punto Zero"
    @click.stop="$emit('toggle')"
  >
    <img
      :src="logo2"
      alt="Terminale Punto Zero"
      class="terminal-trigger-logo"
    />
    <span class="pulse-ring"></span>
  </button>
</template>

<style scoped>
.terminal-trigger {
  position: fixed;
  bottom: max(clamp(0.9rem, 2vw, 1.2rem), env(safe-area-inset-bottom));
  right: max(clamp(0.9rem, 2vw, 1.2rem), env(safe-area-inset-right));
  width: clamp(4rem, 8vw, 4.5rem);
  height: clamp(4rem, 8vw, 4.5rem);
  border-radius: 50%;
  background: rgba(10, 15, 20, 0.8);
  border: 1px solid var(--accent-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 999;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 0 15px rgba(var(--accent-gold-rgb), 0.22);
  backdrop-filter: blur(10px);
  transform-origin: center;
}

.terminal-trigger-logo {
  width: 88%;
  height: 88%;
  object-fit: contain;
  transition: all 0.3s ease;
  z-index: 2;
  filter: drop-shadow(0 0 6px rgba(var(--accent-gold-rgb), 0.35));
}

@media (hover: hover) and (pointer: fine) {
  .terminal-trigger:hover {
    transform: scale(1.1) rotate(10deg);
    box-shadow: 0 0 25px rgba(var(--accent-gold-rgb), 0.4);
    border-color: #fff;
  }
}

.terminal-trigger.active {
  background: rgba(var(--accent-magenta-rgb), 0.14);
  border-color: var(--accent-magenta);
  transform: scale(1.06) rotate(6deg);
}

.terminal-trigger.active .terminal-trigger-logo {
  filter: drop-shadow(0 0 6px var(--accent-magenta));
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid var(--accent-gold);
  animation: pulse-ring 2s infinite;
  opacity: 0;
}

@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}
</style>
