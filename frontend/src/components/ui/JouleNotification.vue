<script setup lang="ts">
import { useNotificationStore } from '../../stores/notificationStore';

/**
 * Global Notification Component
 * Orchestrates the display of ephemeral toast notifications across the application.
 * Synchronized with the Pinia notificationStore for centralized message management.
 */
const notificationStore = useNotificationStore();
</script>

<template>
  <div class="notification-container">
    <TransitionGroup name="toast">
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        class="toast-card"
        :class="notification.type"
        @click="notificationStore.removeNotification(notification.id)"
      >
        <div class="toast-icon">
          <span v-if="notification.type === 'success'">✔️</span>
          <span v-else-if="notification.type === 'error'">⚠️</span>
          <span v-else-if="notification.type === 'warning'">⚡</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="toast-body">
          <p class="toast-message">{{ notification.message }}</p>
        </div>
        <button class="toast-close">&times;</button>
        <div class="toast-progress" :style="{ animationDuration: (notification.duration || 5000) + 'ms' }"></div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  pointer-events: none;
  max-width: 400px;
  width: calc(100% - 3rem);
}

.toast-card {
  pointer-events: auto;
  position: relative;
  background: rgba(10, 15, 26, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 1rem 2.5rem 1rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.toast-card:hover {
  transform: translateX(-5px);
}

/* Tipi di Notifica (Cyber-Theme) */
.toast-card.success {
  border-left: 4px solid var(--accent-gold);
}
.toast-card.error {
  border-left: 4px solid var(--accent-magenta);
}
.toast-card.warning {
  border-left: 4px solid var(--accent-cyan);
}
.toast-card.info {
  border-left: 4px solid #fff;
}

.toast-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.toast-message {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-main);
  line-height: 1.4;
}

.toast-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.6;
}

.toast-card:hover .toast-close {
  opacity: 1;
}

/* Barra di Progresso */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 100%;
  background: rgba(255, 255, 255, 0.2);
  transform-origin: left;
  animation: shrink-progress linear forwards;
}

.success .toast-progress { background: var(--accent-gold); }
.error .toast-progress { background: var(--accent-magenta); }

@keyframes shrink-progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

/* Animazioni Vue */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
