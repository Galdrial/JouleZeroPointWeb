import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../utils/api';
import { useAuthStore } from './auth';
import { useNotificationStore } from './notificationStore';

/**
 * Representation of a saved deck in the user's collection.
 */
export interface SavedDeck {
  id?: string | number;
  name: string;
  cards: { cardId: number; count: number }[];
  costruttoreId: number | null;
  creator?: string;
  isPublic?: boolean;
  createdAt?: string | number;
}

/**
 * Enhanced deck structure for the Public Library, including social metrics.
 */
export interface PublicDeck extends SavedDeck {
  importsCount: number;
  votesCount: number;
  userVoted: boolean;
}

/**
 * Deck Store for Joule: Zero Point.
 * Manages fetching, creation, deletion, and public sharing of user decks.
 */
export const useDeckStore = defineStore('decks', () => {
  const authStore = useAuthStore();
  const notifications = useNotificationStore();
  
  // State: Reactive collections and status flags
  const userDecks = ref<SavedDeck[]>([]);
  const publicDecks = ref<PublicDeck[]>([]);
  const totalUserDecks = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Fetches the current user's private deck collection from Atlas Backend.
   * Requires authentication.
   * @param params - Optional pagination or filter parameters.
   */
  async function fetchUserDecks(params: any = {}) {
    if (!authStore.isLoggedIn) return;
    
    loading.value = true;
    try {
      const res = await api.get('/decks', { params });
      userDecks.value = res.data.decks;
      totalUserDecks.value = res.data.total;
    } catch (err: any) {
      error.value = err.message || 'Errore durante il caricamento dei mazzi.';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetches public decks shared by the community.
   * @param params - Optional search or sorting parameters.
   * @returns The raw response data for component-level processing.
   */
  async function fetchPublicDecks(params: any = {}) {
    loading.value = true;
    try {
      const res = await api.get('/decks/public', { params });
      publicDecks.value = res.data.decks || res.data;
      return res.data;
    } catch (err: any) {
      error.value = err.message || 'Errore durante il caricamento dei mazzi pubblici.';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Permanently removes a deck from the user's collection.
   * @param id - The unique identifier of the deck to be purged.
   * @returns Boolean indicating success or failure.
   */
  async function deleteDeck(id: string | number) {
    if (!authStore.isLoggedIn) return;
    
    try {
      await api.delete(`/decks/${id}`);
      // Optimistic UI update: Remove from local state immediately
      userDecks.value = userDecks.value.filter(d => d.id !== id);
      totalUserDecks.value--;
      notifications.success("Mazzo rimosso correttamente dalla memoria.");
      return true;
    } catch (err) {
      // Errors are handled by the global api interceptor
      return false;
    }
  }

  /**
   * Retrieves detailed data for a specific deck by its ID.
   * @param id - The deck identifier.
   */
  async function fetchDeckById(id: string | number) {
    loading.value = true;
    try {
      const res = await api.get(`/decks/${id}`);
      return res.data;
    } catch (err: any) {
      error.value = err.message || 'Errore durante il caricamento del mazzo.';
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { 
    userDecks, 
    publicDecks, 
    totalUserDecks, 
    loading, 
    error, 
    fetchUserDecks, 
    fetchPublicDecks,
    deleteDeck,
    fetchDeckById
  };
});
