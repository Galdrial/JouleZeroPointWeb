import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../utils/api';
import { useAuthStore } from './auth';
import { useNotificationStore } from './notificationStore';

export interface SavedDeck {
  id?: string | number;
  name: string;
  cards: { cardId: number; count: number }[];
  costruttoreId: number | null;
  creator?: string;
  isPublic?: boolean;
  createdAt?: string | number;
}

export interface PublicDeck extends SavedDeck {
  importsCount: number;
  votesCount: number;
  userVoted: boolean;
}

export const useDeckStore = defineStore('decks', () => {
  const authStore = useAuthStore();
  const notifications = useNotificationStore();
  const userDecks = ref<SavedDeck[]>([]);
  const publicDecks = ref<PublicDeck[]>([]);
  const totalUserDecks = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

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

  async function deleteDeck(id: string | number) {
    if (!authStore.isLoggedIn) return;
    
    try {
      await api.delete(`/decks/${id}`);
      userDecks.value = userDecks.value.filter(d => d.id !== id);
      totalUserDecks.value--;
      notifications.success("Mazzo rimosso dalla memoria con successo.");
      return true;
    } catch (err) {
      return false;
    }
  }

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
