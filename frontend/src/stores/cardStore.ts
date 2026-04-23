import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../utils/api';

/**
 * Representation of a Joule: Zero Point card.
 * Contains all primary attributes including statistics and effects.
 */
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
  [key: string]: unknown;
}

/**
 * Card Store for Joule: Zero Point.
 * Handles the global catalog of cards, providing caching and filtering utility.
 */
export const useCardStore = defineStore('cards', () => {
  // State: Global card catalog and loading status
  const cards = ref<Card[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Computed property to verify if the card data has been populated.
   */
  const isLoaded = computed(() => cards.value.length > 0);

  /**
   * Synchronizes the local card registry with the Atlas Matrix (Backend).
   * Implements a simple caching mechanism to prevent redundant network calls.
   * @param force - If true, bypasses the cache and forces a new fetch.
   */
  async function fetchCards(force = false) {
    if (isLoaded.value && !force) return;
    
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/cards');
      cards.value = response.data;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error during Matrix synchronization.';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Utility to retrieve a specific card object by its ID from the local cache.
   * @param id - The unique numeric or string identifier of the card.
   */
  function getCardById(id: number | string) {
    return cards.value.find(c => String(c.id) === String(id));
  }

  /**
   * Filtered subset of cards belonging to the 'Costruttore' (Builder) type.
   */
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
