<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

interface Card {
  id: number;
  name: string;
  type: string;
  rarity: string;
  cost_et: number | null;
  pep: number | null;
  rp: number | null;
  effect: string;
  role: string | null;
  image_url: string;
}

interface DeckCard {
  card: Card;
  count: number;
}

interface SavedDeck {
  id?: number;
  name: string;
  cards: { cardId: number; count: number }[];
  costruttoreId: number | null;
  creator?: string;
}

const username = ref(localStorage.getItem('username') || '');

const allCards = ref<Card[]>([]);
const decks = ref<SavedDeck[]>([]);
const currentDeck = ref<DeckCard[]>([]);
const selectedCostruttore = ref<Card | null>(null);
const deckName = ref("Nuovo Mazzo");
const loading = ref(true);
const isSaving = ref(false);

const searchQuery = ref("");
const selectedType = ref("");

// Filtri per la libreria
const filteredLibrary = computed(() => {
  return allCards.value.filter(c => {
    const isCostruttore = c.type === 'Costruttore';
    if (isCostruttore) return false; // I costruttori si scelgono a parte

    const nameMatch = c.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const typeMatch = !selectedType.value || c.type === selectedType.value;
    return nameMatch && typeMatch;
  });
});

const costruttori = computed(() => allCards.value.filter(c => c.type === 'Costruttore'));

const totalCards = computed(() => currentDeck.value.reduce((sum, item) => sum + item.count, 0));

const totalFrammenti = computed(() => {
  return currentDeck.value.reduce((sum, item) => {
    const isFrammento = ['Solido', 'Liquido', 'Gas', 'Plasma', 'Materia Oscura'].includes(item.card.type);
    return isFrammento ? sum + item.count : sum;
  }, 0);
});

const totalEvents = computed(() => {
  return currentDeck.value.reduce((sum, item) => {
    const isEvent = ['Evento', 'Anomalia'].includes(item.card.type);
    return isEvent ? sum + item.count : sum;
  }, 0);
});

const getLimit = (rarity: string) => {
  if (rarity === 'Critica') return 1;
  if (rarity === 'Instabile') return 2;
  return 3; // Stabile
};

const addToDeck = (card: Card) => {
  if (totalCards.value >= 40) {
    return; // Limite rigido raggiunto
  }

  const limit = getLimit(card.rarity);
  const existing = currentDeck.value.find(item => item.card.id === card.id);
  
  if (existing) {
    if (existing.count < limit) {
      existing.count++;
    }
  } else {
    currentDeck.value.push({ card, count: 1 });
  }
};

const removeFromDeck = (cardId: number) => {
  const index = currentDeck.value.findIndex(item => item.card.id === cardId);
  if (index !== -1) {
    if (currentDeck.value[index].count > 1) {
      currentDeck.value[index].count--;
    } else {
      currentDeck.value.splice(index, 1);
    }
  }
};

const saveDeck = async () => {
  if (totalCards.value !== 40) {
    alert("Il mazzo deve contenere esattamente 40 carte frammento/evento.");
    return;
  }
  if (!selectedCostruttore.value) {
    alert("Scegli un Costruttore per guidare il tuo mazzo.");
    return;
  }

  isSaving.value = true;
  try {
    const payload: SavedDeck = {
      name: deckName.value,
      costruttoreId: selectedCostruttore.value.id,
      cards: currentDeck.value.map(item => ({ cardId: item.card.id, count: item.count })),
      creator: username.value
    };
    await axios.post('/api/decks', payload);
    loadDecks();
  } catch (e) {
    alert("Errore durante il salvataggio.");
  } finally {
    isSaving.value = false;
  }
};

const loadDeck = (deck: SavedDeck) => {
  deckName.value = deck.name;
  selectedCostruttore.value = allCards.value.find(c => c.id === deck.costruttoreId) || null;
  currentDeck.value = deck.cards.map(dc => {
    const card = allCards.value.find(c => c.id === dc.cardId);
    return card ? { card, count: dc.count } : null;
  }).filter(Boolean) as DeckCard[];
};

const deleteDeck = async (id: number) => {
  if (confirm("Sei sicuro di voler distruggere questa linea temporale?")) {
    await axios.delete(`/api/decks/${id}`);
    loadDecks();
  }
};

const loadDecks = async () => {
  const res = await axios.get('/api/decks', {
    params: { creator: username.value }
  });
  decks.value = res.data;
};

const handleImgError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = 'none';
};

onMounted(async () => {
  const [cardsRes] = await Promise.all([
    axios.get('/api/cards')
  ]);
  allCards.value = cardsRes.data;
  await loadDecks();
  loading.value = false;
});
</script>

<template>
  <div class="deckbuilder fade-in">
    <div v-if="loading" class="loading-overlay">
      <div class="loader"></div>
      <p>Sincronizzazione col Nucleo...</p>
    </div>

    <div v-else class="builder-layout">
      <!-- Colonna Sinistra: Lista Mazzi Salvati e Libreria -->
      <div class="side-panel left-side">
        <div class="glass-panel saved-decks">
          <h3>Linee Temporali Caricate</h3>
          <div class="decks-list">
            <div v-for="d in decks" :key="d.id" class="deck-file" @click="loadDeck(d)">
              <span>{{ d.name }}</span>
              <button class="small-delete" @click.stop="deleteDeck(d.id!)">&times;</button>
            </div>
            <p v-if="decks.length === 0" class="empty-hint">Nessun mazzo salvato.</p>
          </div>
        </div>

        <div class="glass-panel library-panel">
          <div class="library-header">
            <h3>Archivio Frammenti</h3>
            <div class="filters">
              <input v-model="searchQuery" placeholder="Cerca..." class="glass-input small" />
              <select v-model="selectedType" class="glass-input small">
                <option value="">Tutti</option>
                <option v-for="t in ['Solido','Liquido','Gas','Plasma','Materia Oscura','Evento','Anomalia']" :key="t" :value="t">{{t}}</option>
              </select>
            </div>
          </div>
          <div class="library-grid">
            <div v-for="card in filteredLibrary" :key="card.id" class="lib-card" @click="addToDeck(card)">
              <div class="lib-card-img">
                <img :src="card.image_url" @error="handleImgError" />
                <div class="lib-card-title">{{ card.name }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Colonna Destra: Mazzo Corrente e Statistiche -->
      <div class="side-panel right-side">
        <div class="glass-panel current-deck-panel">
          <div class="deck-config">
            <input v-model="deckName" class="deck-name-input" placeholder="Nome Mazzo..." />
            <div class="costruttore-area">
              <label>Costruttore Selezionato:</label>
              <select v-model="selectedCostruttore" class="glass-input">
                <option :value="null">Scegli un Costruttore...</option>
                <option v-for="c in costruttori" :key="c.id" :value="c">{{ c.name }}</option>
              </select>
            </div>
          </div>

          <div class="deck-stats-bar">
            <div class="stat" :class="{ 'warning': totalCards !== 40 }">
              CARTE: <span>{{ totalCards }}</span>/40
            </div>
            <div class="composition-hints">
              <div class="hint" :class="{ 'text-muted': totalFrammenti >= 25 }">
                Frammenti: {{ totalFrammenti }} (Min 25)
              </div>
              <div class="hint" :class="{ 'text-muted': totalEvents <= 15 }">
                Eventi/Anomalie: {{ totalEvents }} (Max 15)
              </div>
            </div>
          </div>

          <div class="current-deck-list">
            <div v-for="item in currentDeck" :key="item.card.id" class="deck-row">
              <span class="count">{{ item.count }}x</span>
              <span class="name">{{ item.card.name }}</span>
              <div class="row-actions">
                 <button @click="addToDeck(item.card)">+</button>
                 <button @click="removeFromDeck(item.card.id)">-</button>
              </div>
            </div>
            <div v-if="currentDeck.length === 0" class="empty-deck">
              Seleziona le carte dall'archivio a sinistra.
            </div>
          </div>

          <button @click="saveDeck" class="btn-primary full-width" :disabled="isSaving">
            {{ isSaving ? 'SINCRONIZZAZIONE...' : 'SALVA LINEA TEMPORALE' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.deckbuilder {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  height: calc(100vh - 120px);
}

.builder-layout {
  display: grid;
  grid-template-columns: 1fr 450px;
  gap: 1.5rem;
  height: 100%;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
}

.library-panel {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.lib-card {
  aspect-ratio: 2/3;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
}

.lib-card:hover {
  border-color: var(--accent-cyan);
  transform: scale(1.03);
}

.lib-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lib-card-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.8);
  color: #fff;
  font-size: 0.75rem;
  padding: 0.4rem;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.saved-decks {
  max-height: 200px;
  display: flex;
  flex-direction: column;
}

.decks-list {
  overflow-y: auto;
}

.deck-file {
  padding: 0.6rem;
  background: rgba(255,255,255,0.05);
  margin-bottom: 0.5rem;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
}

.deck-file:hover { background: rgba(0, 240, 255, 0.1); }

.deck-name-input {
  background: none;
  border: none;
  border-bottom: 2px solid var(--accent-cyan);
  color: #fff;
  font-size: 1.4rem;
  font-family: var(--font-display);
  width: 100%;
  margin-bottom: 1.5rem;
}

.deck-stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0,0,0,0.3);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.stat { font-family: var(--font-display); font-weight: 800; font-size: 1.2rem; }
.stat.warning { color: var(--accent-magenta); }

.current-deck-list {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.deck-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.row-actions button {
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  padding: 0.2rem 0.5rem;
  margin-left: 0.3rem;
  cursor: pointer;
  border-radius: 4px;
}

.row-actions button:hover { background: var(--accent-cyan); color: #000; }

.composition-hints { font-size: 0.8rem; text-align: right; }
.text-muted { opacity: 0.6; }

.small-delete { background: none; border: none; color: var(--accent-magenta); cursor: pointer; }

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
