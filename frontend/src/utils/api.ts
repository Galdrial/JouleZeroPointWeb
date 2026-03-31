import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notificationStore';

/**
 * Client API Joule: Zero Point (100% Pro Edition)
 */
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercettore di Richiesta: Iniezione Automatica di Sicurezza
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    if (authStore.username) {
      config.headers['x-user'] = authStore.username;
    }
    
    // Iniezione Automatica della Chiave Amministrativa (se presente)
    const adminKey = sessionStorage.getItem('adminKey');
    if (adminKey) {
      config.headers['X-Admin-Key'] = adminKey;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercettore di Risposta: Scudo Globale con Feedback Visivo
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authStore = useAuthStore();
    const notifications = useNotificationStore();
    
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401) {
        // Sessione Scaduta (Professionale)
        authStore.logout();
        notifications.error("Frequenza di sessione scaduta. Re-autenticazione richiesta.");
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session_expired=1';
        }
      } else if (status === 422) {
        // Errore di Validazione (Segnale Pro arrivato dal Backend)
        notifications.warn(error.response.data.error || "Parametri non validi.");
      } else if (status >= 500) {
        // Collasso del Nucleo Atlas
        notifications.error("Dissonanza nel Backend. Riprova più tardi.");
      }
    } else if (error.request) {
      // Nessuna risposta: Segnale smarrito
      notifications.error("Nessun segnale dal Backend. Controlla la tua connessione.");
    }
    
    return Promise.reject(error);
  }
);

export default api;
