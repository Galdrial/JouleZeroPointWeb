import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../utils/api';

export interface Card {
  id: number;
  name: string;
  type: string;
  rarity: string;
  status?: string;
  cost_et: number | null;
  pep: number | null;
  rp: number | null;
  effect: string;
  role: string | null;
  image_url: string;
  [key: string]: any;
}

export const useCardStore = defineStore('cards', () => {
  const cards = ref<Card[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isLoaded = computed(() => cards.value.length > 0);

  async function fetchCards(force = false) {
    if (isLoaded.value && !force) return;
    
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/cards');
      cards.value = response.data;
    } catch (err: any) {
      error.value = err.message || 'Errore durante la sincronizzazione della Matrice.';
    } finally {
      loading.value = false;
    }
  }

  function getCardById(id: number | string) {
    return cards.value.find(c => String(c.id) === String(id));
  }

  const costruttori = computed(() => 
    cards.value.filter(c => c.type === 'Costruttore')
  );

  return { 
    cards, 
    loading, 
    error, 
    isLoaded, 
    fetchCards, 
    getCardById,
    costruttori
  };
});
