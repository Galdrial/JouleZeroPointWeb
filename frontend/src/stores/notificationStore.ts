import { defineStore } from 'pinia';
import { ref } from 'vue';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  duration?: number;
}

/**
 * Store Notifiche Joule (100% Pro Edition)
 * Gestisce i messaggi di feedback globali con auto-rimozione.
 */
export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);
  let nextId = 0;

  function addNotification(message: string, type: NotificationType = 'info', duration = 5000) {
    const id = nextId++;
    const notification: Notification = { id, message, type, duration };
    
    notifications.value.push(notification);

    // Auto-rimozione dopo la durata specificata (Sincronia Temporale)
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }

  function removeNotification(id: number) {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  }

  // Comandi rapidi per l'eccellenza operativa
  const success = (msg: string) => addNotification(msg, 'success');
  const error = (msg: string) => addNotification(msg, 'error', 6000);
  const warn = (msg: string) => addNotification(msg, 'warning');
  const info = (msg: string) => addNotification(msg, 'info');

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warn,
    info
  };
});
