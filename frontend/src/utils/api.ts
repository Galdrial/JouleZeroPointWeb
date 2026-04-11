import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notificationStore';

/**
 * Global Axios instance configured for Joule: Zero Point.
 * Centralizes all API communication with appropriate headers and interceptors.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Importante se gestisci cookie/sessioni in the future
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
      const backendError = error.response.data?.error;
      
      // Professional Session Expiry Handling (Unauthorized)
      if (status === 401) {
        if (window.location.pathname !== '/login') {
          authStore.logout();
          notifications.error(backendError || "Frequenza di sessione scaduta. Riconnessione richiesta.");
          window.location.href = '/login?session_expired=1';
        } else {
          // Se siamo già in login, mostriamo l'errore specifico (es. credenziali errate)
          notifications.error(backendError || "Credenziali non sincronizzate.");
        }
      } 
      // Forbidden / Not Found / Conflict / Bad Request
      else if ([400, 403, 404, 409].includes(status)) {
        notifications.warn(backendError || "Errore nel protocollo di accesso.");
      }
      // Backend-level Validation Errors
      else if (status === 422) {
        notifications.warn(backendError || "Parametri non validi rilevati.");
      } 
      // Internal Server Errors (Atlas Core failure)
      else if (status >= 500) {
        notifications.error("Rilevata dissonanza nel Backend. Prego riprovare più tardi.");
      }
    } 
    // Connection/Request failures (No Network Signal)
    else if (error.request) {
      notifications.error("Nessun segnale dal Backend Atlas. Controlla la tua connessione.");
    }
    
    return Promise.reject(error);
  }
);

export default api;
