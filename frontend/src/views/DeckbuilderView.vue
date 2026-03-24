<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
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

// UI State
const viewMode = ref<'dashboard' | 'editor'>('dashboard');
const loading = ref(true);
const isSaving = ref(false);

// Editor State
const allCards = ref<Card[]>([]);
const currentDeck = ref<DeckCard[]>([]);
const selectedCostruttore = ref<Card | null>(null);
const deckName = ref("Nuovo Mazzo");
const editorSearchQuery = ref("");
const editorSelectedType = ref("");

// Dashboard State
const decks = ref<SavedDeck[]>([]);
const totalDecks = ref(0);
const searchDashboard = ref("");
const filterCostruttore = ref<number | "">("");
const currentPage = ref(1);
const limit = 12;

// Computed for Editor
const filteredLibrary = computed(() => {
  return allCards.value.filter(c => {
    if (c.type === 'Costruttore') return false;
    const nameMatch = c.name.toLowerCase().includes(editorSearchQuery.value.toLowerCase());
    const typeMatch = !editorSelectedType.value || c.type === editorSelectedType.value;
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
  return 3;
};

// Funzioni Editor
const addToDeck = (card: Card) => {
  if (totalCards.value >= 40) return;
  const limit = getLimit(card.rarity);
  const existing = currentDeck.value.find(item => item.card.id === card.id);
  if (existing) {
    if (existing.count < limit) existing.count++;
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
    alert("Il mazzo deve contenere esattamente 40 carte.");
    return;
  }
  if (!selectedCostruttore.value) {
    alert("Scegli un Costruttore.");
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
    viewMode.value = 'dashboard';
    loadDecks();
  } catch (e) {
    alert("Errore salvataggio.");
  } finally {
    isSaving.value = false;
  }
};

// Funzioni Dashboard
const loadDecks = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/decks', {
      params: { 
        creator: username.value,
        q: searchDashboard.value,
        costruttoreId: filterCostruttore.value,
        page: currentPage.value,
        limit: limit
      }
    });
    decks.value = res.data.decks;
    totalDecks.value = res.data.total;
  } finally {
    loading.value = false;
  }
};

const deleteDeck = async (id: number) => {
  if (confirm("Distruggere questa linea temporale?")) {
    await axios.delete(`/api/decks/${id}`);
    loadDecks();
  }
};

const editDeck = (deck: SavedDeck) => {
  deckName.value = deck.name;
  selectedCostruttore.value = allCards.value.find(c => c.id === deck.costruttoreId) || null;
  currentDeck.value = deck.cards.map(dc => {
    const card = allCards.value.find(c => c.id === dc.cardId);
    return card ? { card, count: dc.count } : null;
  }).filter(Boolean) as DeckCard[];
  viewMode.value = 'editor';
};

const createNewDeck = () => {
  deckName.value = "Nuovo Mazzo";
  selectedCostruttore.value = null;
  currentDeck.value = [];
  viewMode.value = 'editor';
};

const totalPages = computed(() => Math.ceil(totalDecks.value / limit));

// Utils
const handleImgError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = 'none';
};

const getCostruttoreName = (id: number | null) => {
  return allCards.value.find(c => c.id === id)?.name || 'Sconosciuto';
};

// Watchers per Dashboard
watch([searchDashboard, filterCostruttore], () => {
  currentPage.value = 1;
  loadDecks();
});

watch(currentPage, loadDecks);

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
  <div class="deck-view fade-in">
    <!-- DASHBOARD MODE -->
    <div v-if="viewMode === 'dashboard'" class="dashboard-container">
      <h1 class="main-title">MAZZI</h1>
      
      <div class="top-actions">
        <button @click="createNewDeck" class="btn-primary huge">NUOVO MAZZO</button>
      </div>

      <div class="dashboard-controls glass-panel">
        <div class="search-box">
          <input v-model="searchDashboard" placeholder="Cerca mazzo..." class="glass-input" />
        </div>
        <div class="filter-box">
          <select v-model="filterCostruttore" class="glass-input">
            <option value="">Tutti i Costruttori</option>
            <option v-for="c in costruttori" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="stats-box">
          <span class="count-tag">{{ totalDecks }} Mazzi Rilevati</span>
        </div>
      </div>

      <div v-if="loading" class="dashboard-loading">
        <div class="loader"></div>
      </div>

      <div v-else class="decks-grid">
        <div v-for="d in decks" :key="d.id" class="deck-card glass-panel" @click="editDeck(d)">
          <div class="deck-header">
            <div class="deck-costruttore">
              {{ getCostruttoreName(d.costruttoreId) }}
            </div>
            <button class="small-delete" @click.stop="deleteDeck(d.id!)">&times;</button>
          </div>
          <div class="deck-body">
            <h3>{{ d.name }}</h3>
            <div class="deck-meta">
              <span>{{ d.cards?.reduce((s, c) => s + c.count, 0) || 0 }} / 40 Carte</span>
            </div>
          </div>
          <div class="deck-footer">
            <div class="edit-hint">SINCRONIZZA ➔</div>
          </div>
        </div>
        <div v-if="decks.length === 0" class="empty-dashboard">
          <p>Nessun mazzo trovato nella matrice.</p>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="currentPage === 1" @click="currentPage--" class="page-btn">PREV</button>
        <span class="page-info">LINEA {{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="currentPage++" class="page-btn">NEXT</button>
      </div>
    </div>

    <!-- EDITOR MODE -->
    <div v-else class="builder-layout">
      <div class="side-panel left-side">
        <div class="glass-panel library-panel">
          <div class="library-header">
            <h3>Archivio Frammenti</h3>
            <button @click="viewMode = 'dashboard'" class="btn-back">🔙 Dashboard</button>
          </div>
          <div class="filters">
            <input v-model="editorSearchQuery" placeholder="Cerca..." class="glass-input small" />
            <select v-model="editorSelectedType" class="glass-input small">
              <option value="">Tutti</option>
              <option v-for="t in ['Solido','Liquido','Gas','Plasma','Materia Oscura','Evento','Anomalia']" :key="t" :value="t">{{t}}</option>
            </select>
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

          <div class="editor-actions">
            <button @click="saveDeck" class="btn-primary full-width" :disabled="isSaving">
              {{ isSaving ? 'SINCRONIZZAZIONE...' : 'SALVA LINEA TEMPORALE' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.deck-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 120px);
}

.main-title {
  text-align: center;
  font-size: 3.5rem;
  font-family: var(--font-display);
  letter-spacing: 0.5rem;
  background: linear-gradient(135deg, #fff 0%, var(--accent-cyan) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 2rem;
  text-shadow: 0 0 30px rgba(0, 240, 255, 0.3);
}

/* Dashboard Styles */
.dashboard-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.top-actions {
  width: 100%;
  display: flex;
  justify-content: center;
}

.btn-primary.huge {
  padding: 1.5rem 4rem;
  font-size: 1.5rem;
  letter-spacing: 0.2rem;
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.2);
}

.dashboard-controls {
  width: 100%;
  max-width: 900px;
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1.5rem;
  align-items: center;
  padding: 1.5rem 2rem;
}

.count-tag {
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid var(--accent-cyan);
  padding: 0.6rem 1rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: var(--font-display);
  color: var(--accent-cyan);
}

.decks-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.deck-card {
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.deck-card:hover {
  transform: translateY(-5px);
  border-color: var(--accent-cyan);
  box-shadow: 0 10px 30px rgba(0, 240, 255, 0.1);
}

.deck-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deck-costruttore {
  font-size: 0.7rem;
  background: rgba(255,255,255,0.05);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  color: var(--text-muted);
}

.deck-body h3 {
  font-size: 1.5rem;
  margin: 0.5rem 0;
  color: #fff;
}

.deck-meta {
  font-size: 0.85rem;
  color: var(--accent-cyan);
}

.deck-footer {
  margin-top: auto;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 1rem;
  text-align: right;
}

.edit-hint {
  font-size: 0.75rem;
  letter-spacing: 1px;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.deck-card:hover .edit-hint {
  opacity: 1;
  color: var(--accent-cyan);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
}

.page-btn {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--accent-cyan);
  color: var(--accent-cyan);
  padding: 0.8rem 1.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: var(--accent-cyan);
  color: #000;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Editor Refined Styles */
.builder-layout {
  display: grid;
  grid-template-columns: 1fr 450px;
  gap: 1.5rem;
  height: 800px;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.btn-back {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-back:hover {
  background: rgba(255,255,255,0.1);
}

.filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 1rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.lib-card {
  aspect-ratio: 2/3;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--glass-border);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
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
  background: rgba(0,0,0,0.85);
  color: #fff;
  font-size: 0.7rem;
  padding: 0.4rem;
  text-align: center;
}

.deck-name-input {
  background: none;
  border: none;
  border-bottom: 2px solid var(--accent-cyan);
  color: #fff;
  font-size: 1.5rem;
  font-family: var(--font-display);
  width: 100%;
  margin-bottom: 1rem;
}

.current-deck-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.current-deck-list {
  flex: 1;
  overflow-y: auto;
  margin: 1rem 0;
}

.deck-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.deck-stats-bar {
  background: rgba(0,0,0,0.4);
  padding: 1rem;
  border-radius: 8px;
}

.stat { font-family: var(--font-display); font-size: 1.2rem; }
.warning { color: var(--accent-magenta); text-shadow: 0 0 10px var(--accent-magenta); }

.small-delete {
  background: none;
  border: none;
  color: var(--accent-magenta);
  font-size: 1.2rem;
  cursor: pointer;
}

.small-delete:hover {
  transform: scale(1.2);
}

@media (max-width: 1100px) {
  .builder-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
}
</style>
