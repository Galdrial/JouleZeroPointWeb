import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notificationStore';

type AuthStoreLike = {
  token?: string | null;
  username?: string;
  logout: () => void;
};

type NotificationStoreLike = {
  error: ( message: string ) => void;
  warn: ( message: string ) => void;
};

type LocationLike = {
  pathname: string;
  href: string;
};

export function applyAuthHeaders(
  config: InternalAxiosRequestConfig,
  authStore: Pick<AuthStoreLike, 'token' | 'username'>,
) {
  if ( authStore.token ) {
    config.headers.Authorization = `Bearer ${ authStore.token }`;
  }

  if ( authStore.username ) {
    config.headers['x-user'] = authStore.username;
  }

  return config;
}

export function handleApiError(
  error: any,
  authStore: AuthStoreLike,
  notifications: NotificationStoreLike,
  locationLike: LocationLike = window.location,
) {
  if ( error.response ) {
    const status = error.response.status;
    const backendError = error.response.data?.error;

    if ( status === 401 ) {
      if ( locationLike.pathname !== '/login' ) {
        authStore.logout();
        notifications.error( backendError || 'Frequenza di sessione scaduta. Riconnessione richiesta.' );
        locationLike.href = '/login?session_expired=1';
      } else {
        notifications.error( backendError || 'Credenziali non sincronizzate.' );
      }
    } else if ( [400, 403, 404, 409].includes( status ) ) {
      notifications.warn( backendError || 'Errore nel protocollo di accesso.' );
    } else if ( status === 422 ) {
      notifications.warn( backendError || 'Parametri non validi rilevati.' );
    } else if ( status >= 500 ) {
      notifications.error( 'Rilevata dissonanza nel Backend. Prego riprovare più tardi.' );
    }
  } else if ( error.request ) {
    notifications.error( 'Nessun segnale dal Backend Atlas. Controlla la tua connessione.' );
  }

  return Promise.reject( error );
}

/**
 * Global Axios instance configured for Joule: Zero Point.
 * Centralizes all API communication with appropriate headers and interceptors.
 */
const api = axios.create( {
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Importante se gestisci cookie/sessioni in the future
} );

/**
 * Request Interceptor: Automatic Auth & Security Injection.
 * Injects JWT tokens, user identifiers, and administrative keys into outgoing requests.
 */
api.interceptors.request.use(
  ( config ) => {
    const authStore = useAuthStore();
    return applyAuthHeaders( config, authStore );
  },
  ( error ) => Promise.reject( error )
);

/**
 * Response Interceptor: Global Error Shield & UI Feedback.
 * Detects common status codes (401, 422, 500) and triggers global notifications
 * while handling session expiration automatically.
 */
api.interceptors.response.use(
  ( response ) => response,
  ( error ) => {
    const authStore = useAuthStore();
    const notifications = useNotificationStore();
    return handleApiError( error, authStore, notifications );
  }
);

export default api;
