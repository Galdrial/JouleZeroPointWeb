import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from './auth';

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
  const userDecks = ref<SavedDeck[]>([]);
  const publicDecks = ref<PublicDeck[]>([]);
  const totalUserDecks = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchUserDecks(params: any = {}) {
    if (!authStore.isLoggedIn) return;
    
    loading.value = true;
    try {
      const res = await axios.get('/api/v1/decks', {
        params: {
          ...params,
        },
        headers: {
          "x-user": authStore.username,
          "Authorization": `Bearer ${authStore.token}`
        },
      });
      userDecks.value = res.data.decks;
      totalUserDecks.value = res.data.total;
    } catch (err: any) {
      error.value = err.message || 'Errore durante il caricamento dei mazzi.';
      console.error('ERRORE_DECK_STORE_USER:', err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchPublicDecks(params: any = {}) {
    loading.value = true;
    try {
      const res = await axios.get('/api/v1/decks/public', {
        params: {
          ...params,
        },
        headers: {
          "x-user": authStore.username
        }
      });
      publicDecks.value = res.data.decks || res.data;
      return res.data;
    } catch (err: any) {
      error.value = err.message || 'Errore durante il caricamento dei mazzi pubblici.';
      console.error('ERRORE_DECK_STORE_PUBLIC:', err);
    } finally {
      loading.value = false;
    }
  }

  async function deleteDeck(id: string | number) {
    if (!authStore.isLoggedIn) return;
    
    try {
      await axios.delete(`/api/v1/decks/${id}`, {
        headers: { "Authorization": `Bearer ${authStore.token}` }
      });
      userDecks.value = userDecks.value.filter(d => d.id !== id);
      totalUserDecks.value--;
      return true;
    } catch (err) {
      console.error('ERRORE_DECK_DELETE:', err);
      return false;
    }
  }

  async function fetchDeckById(id: string | number) {
    loading.value = true;
    try {
      const res = await axios.get(`/api/v1/decks/${id}`, {
        headers: { "Authorization": `Bearer ${authStore.token}` }
      });
      return res.data;
    } catch (err: any) {
      error.value = err.message || 'Errore durante il caricamento del mazzo.';
      console.error('ERRORE_DECK_FETCH_ID:', err);
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
