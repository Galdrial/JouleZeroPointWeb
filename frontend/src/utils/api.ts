import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notificationStore';

/**
 * Global Axios instance configured for Joule: Zero Point.
 * Centralizes all API communication with appropriate headers and interceptors.
 */
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor: Automatic Auth & Security Injection.
 * Injects JWT tokens, user identifiers, and administrative keys into outgoing requests.
 */
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    // Inject Bearer token if session is active
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    // Inject user identifier for contextual tracking
    if (authStore.username) {
      config.headers['x-user'] = authStore.username;
    }
    
    // Automatic injection of Admin Secret Key if stored in current session
    const adminKey = sessionStorage.getItem('adminKey');
    if (adminKey) {
      config.headers['X-Admin-Key'] = adminKey;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Global Error Shield & UI Feedback.
 * Detects common status codes (401, 422, 500) and triggers global notifications
 * while handling session expiration automatically.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authStore = useAuthStore();
    const notifications = useNotificationStore();
    
    if (error.response) {
      const status = error.response.status;
      
      // Professional Session Expiry Handling (Unauthorized)
      if (status === 401) {
        authStore.logout();
        notifications.error("Session frequency expired. Re-authentication required.");
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session_expired=1';
        }
      } 
      // Backend-level Validation Errors
      else if (status === 422) {
        notifications.warn(error.response.data.error || "Invalid parameters detected.");
      } 
      // Internal Server Errors (Atlas Core failure)
      else if (status >= 500) {
        notifications.error("Backend dissonance detected. Please try again later.");
      }
    } 
    // Connection/Request failures (No Network Signal)
    else if (error.request) {
      notifications.error("No signal from Atlas Backend. Check your connection.");
    }
    
    return Promise.reject(error);
  }
);

export default api;
