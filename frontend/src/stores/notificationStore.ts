import { defineStore } from 'pinia';
import { ref } from 'vue';

// Available notification severity levels for visual consistency
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Technical representation of a single UI notification (Toast).
 */
export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  duration?: number;
}

/**
 * Notification Store for Joule: Zero Point.
 * Centralizes global UI feedback messaging with automatic and manual cleanup logic.
 */
export const useNotificationStore = defineStore('notifications', () => {
  // Collection of active notifications currently tracked in the UI state
  const notifications = ref<Notification[]>([]);
  let nextId = 0;

  /**
   * Dispatches a new notification to the global messaging queue.
   * @param message - The text content to display to the user.
   * @param type - Severity level affecting styling and animation.
   * @param duration - Time (ms) before the notification is automatically purged.
   * @returns The unique ID assigned to the new notification.
   */
  function addNotification(message: string, type: NotificationType = 'info', duration = 5000) {
    const id = nextId++;
    const notification: Notification = { id, message, type, duration };
    
    notifications.value.push(notification);

    // Automatic dismissal logic synchronized with the specified duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }

  /**
   * Manually removes a notification from the active queue by its ID.
   * @param id - The unique identifier of the notification to be purged.
   */
  function removeNotification(id: number) {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  }

  // Convenience Shorthand Commands for Operational Excellence
  const success = (msg: string) => addNotification(msg, 'success');
  const error = (msg: string) => addNotification(msg, 'error', 6000); // 6s duration for critical errors
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
