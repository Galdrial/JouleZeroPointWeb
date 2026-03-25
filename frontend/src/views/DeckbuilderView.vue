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
  isPublic?: boolean;
}

const username = ref(localStorage.getItem('username') || '');

// UI State
const viewMode = ref<'dashboard' | 'editor'>('dashboard');
const loading = ref(true);
const isSaving = ref(false);
const isCostruttoreDropdownOpen = ref(false);
const isEditorCostruttoreDropdownOpen = ref(false);
const isTypeDropdownOpen = ref(false);
const isPublic = ref(false);
const editingDeckId = ref<number | null>(null);
const showSavePrompt = ref(false);

// Delete State
const deckToDelete = ref<number | null>(null);
const showDeleteConfirm = ref(false);

// Preview & Modal State
const selectedCard = ref<Card | null>(null);

// Alert State
const alertMessage = ref('');
const showAlert = ref(false);

const showTerminalAlert = (msg: string) => {
  alertMessage.value = msg;
  showAlert.value = true;
};

// Editor State
const allCards = ref<Card[]>([]);
const currentDeck = ref<DeckCard[]>([]);
const selectedCostruttore = ref<Card | null>(null);
const deckName = ref("Nuovo Mazzo");
const editorSearchQuery = ref("");
const editorSelectedType = ref("");

const typeOptions = [
  { label: 'TUTTI I TIPI', value: '', color: 'transparent' },
  { label: 'Solido', value: 'Solido', color: '#007bff' },
  { label: 'Liquido', value: 'Liquido', color: '#28a745' },
  { label: 'Gas', value: 'Gas', color: '#fd7e14' },
  { label: 'Plasma', value: 'Plasma', color: '#dc3545' },
  { label: 'Materia Oscura', value: 'Materia Oscura', color: '#8a2be2' },
  { label: 'Evento', value: 'Evento', color: '#cd7f32' },
  { label: 'Anomalia', value: 'Anomalia', color: '#c0c0c0' }
];

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

const removeFromDeck = (card: Card) => {
  const index = currentDeck.value.findIndex(item => item.card.id === card.id);
  if (index !== -1) {
    if (currentDeck.value[index].count > 1) {
      currentDeck.value[index].count--;
    } else {
      currentDeck.value.splice(index, 1);
    }
  }
};

const saveDeck = () => {
  if (totalCards.value !== 40) {
    showTerminalAlert("IL MAZZO DEVE CONTENERE ESATTAMENTE 40 CARTE.");
    return;
  }
  if (!selectedCostruttore.value) {
    showTerminalAlert("SELEZIONA UN COSTRUTTORE PER SINCRONIZZARE IL MAZZO.");
    return;
  }

  if (editingDeckId.value) {
    showSavePrompt.value = true;
  } else {
    executeSave(false);
  }
};

const executeSave = async (overwrite: boolean) => {
  showSavePrompt.value = false;
  isSaving.value = true;
  try {
    const payload: SavedDeck = {
      ...(overwrite && editingDeckId.value ? { id: editingDeckId.value } : {}),
      name: deckName.value,
      costruttoreId: selectedCostruttore.value!.id,
      cards: currentDeck.value.map(item => ({ cardId: item.card.id, count: item.count })),
      creator: username.value,
      isPublic: isPublic.value
    };
    await axios.post('/api/decks', payload);
    viewMode.value = 'dashboard';
    loadDecks();
  } catch (e) {
    showTerminalAlert("ERRORE DURANTE LA SINCRONIZZAZIONE DELLA LINEA TEMPORALE.");
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

const selectDashboardCostruttore = (id: number | "") => {
  filterCostruttore.value = id;
  isCostruttoreDropdownOpen.value = false;
};

// Direttiva click-outside
const vClickOutside = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: any) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el: any) {
    document.body.removeEventListener('click', el.clickOutsideEvent);
  }
};

const confirmDelete = (id: number) => {
  deckToDelete.value = id;
  showDeleteConfirm.value = true;
};

const executeDelete = async () => {
  if (deckToDelete.value) {
    await axios.delete(`/api/decks/${deckToDelete.value}`);
    deckToDelete.value = null;
    showDeleteConfirm.value = false;
    loadDecks();
  }
};

const editDeck = (deck: SavedDeck) => {
  deckName.value = deck.name;
  editingDeckId.value = deck.id || null;
  isPublic.value = deck.isPublic || false;
  selectedCostruttore.value = allCards.value.find(c => c.id === deck.costruttoreId) || null;
  currentDeck.value = deck.cards.map(dc => {
    const card = allCards.value.find(c => c.id === dc.cardId);
    return card ? { card, count: dc.count } : null;
  }).filter(Boolean) as DeckCard[];
  viewMode.value = 'editor';
};

const createNewDeck = () => {
  deckName.value = "Nuovo Mazzo";
  editingDeckId.value = null;
  isPublic.value = false;
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

const getCostruttoreImg = (id: number | null) => {
  return allCards.value.find(c => c.id === id)?.image_url || '';
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
        <button @click="createNewDeck" class="cyber-btn btn-primary huge">NUOVO MAZZO</button>
      </div>

      <div class="search-container">
        <div class="search-box">
          <input v-model="searchDashboard" placeholder="Cerca mazzo..." class="glass-input search-input" />
        </div>

        <div class="custom-dropdown" v-click-outside="() => isCostruttoreDropdownOpen = false">
          <div class="dropdown-trigger" @click.stop="isCostruttoreDropdownOpen = !isCostruttoreDropdownOpen">
            {{ costruttori.find(c => c.id === filterCostruttore)?.name.split(',')[0] || 'COSTRUTTORE' }}
            <span class="arrow" :class="{ open: isCostruttoreDropdownOpen }">▼</span>
          </div>
          <Transition name="slide-up">
            <div v-if="isCostruttoreDropdownOpen" class="dropdown-menu glass-panel">
              <div 
                class="dropdown-item" 
                :class="{ active: filterCostruttore === '' }"
                @click.stop="selectDashboardCostruttore('')"
              >
                <span class="dot" style="background: transparent; opacity: 0;"></span>
                TUTTI
              </div>
              <div 
                v-for="c in costruttori" 
                :key="c.id" 
                class="dropdown-item" 
                :class="{ active: filterCostruttore === c.id }"
                @click.stop="selectDashboardCostruttore(c.id)"
              >
                <span class="dot" style="background: #ffd700; box-shadow: 0 0 5px #ffd700;"></span>
                {{ c.name.split(',')[0] }}
              </div>
            </div>
          </Transition>
        </div>

        <div class="stats-box">
          <span class="count-tag">Mazzi Rilevati {{ totalDecks }}</span>
        </div>
      </div>

      <div v-if="loading" class="dashboard-loading">
        <div class="loader"></div>
      </div>

      <div v-else class="decks-grid">
        <div v-for="d in decks" :key="d.id" class="deck-card glass-panel" @click="editDeck(d)">
          <!-- TOP ROW: Name and Delete -->
          <div class="deck-top-row">
            <div class="deck-title-row">
              <h3>{{ d.name }}</h3>
            </div>
            <button class="small-delete cyber-btn btn-danger mini" @click.stop="confirmDelete(d.id!)" title="Elimina Mazzo">
               <span class="trash-icon">×</span>
            </button>
          </div>

          <!-- HERO IMAGE: Wide like Database -->
          <div class="deck-hero-container">
            <img :src="getCostruttoreImg(d.costruttoreId)" class="deck-hero-img" @error="handleImgError" />
          </div>

          <!-- CAPTION: Costruttore name below image -->
          <div class="deck-hero-caption">
            <span class="caption-name">{{ getCostruttoreName(d.costruttoreId) }}</span>
          </div>
          <!-- FOOTER ROW: Privacy and Sincronizza -->
          <div class="deck-footer-row">
            <span class="deck-privacy" :class="d.isPublic ? 'public' : 'private'">
              {{ d.isPublic ? 'PUBBLICO' : 'PRIVATO' }}
            </span>
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
            <h3 class="uppercase-title">ARCHIVIO FRAMMENTI</h3>
            <button @click="viewMode = 'dashboard'" class="cyber-btn btn-primary small-btn">DASHBOARD</button>
          </div>
          <div class="filters">
            <input v-model="editorSearchQuery" placeholder="Cerca..." class="glass-input small" />
            <div class="custom-dropdown" v-click-outside="() => isTypeDropdownOpen = false">
              <div class="dropdown-trigger small" @click.stop="isTypeDropdownOpen = !isTypeDropdownOpen">
                {{ editorSelectedType || 'TUTTI I TIPI' }}
                <span class="arrow" :class="{ open: isTypeDropdownOpen }">▼</span>
              </div>
              <Transition name="slide-up">
                <div v-if="isTypeDropdownOpen" class="dropdown-menu glass-panel">
                  <div 
                    v-for="t in typeOptions" 
                    :key="t.value" 
                    class="dropdown-item" 
                    :class="{ active: editorSelectedType === t.value }"
                    @click.stop="editorSelectedType = t.value; isTypeDropdownOpen = false"
                  >
                    <span class="dot" :style="{ backgroundColor: t.color, opacity: t.value ? 1 : 0 }"></span>
                    {{ t.label }}
                  </div>
                </div>
              </Transition>
            </div>
          </div>
          <div class="library-grid-container">
            <div class="cards-grid">
              <div v-for="card in filteredLibrary" :key="card.id" class="glass-panel card-item" @click="selectedCard = card">
                <div class="card-header stacked">
                  <h3>{{ card.name }}</h3>
                  <span class="badge" :class="(card.type || '').split(' ')[0].toLowerCase()">{{ card.type }}</span>
                </div>
                <div class="card-image-container">
                  <img :src="card.image_url" :alt="card.name" class="card-img" @error="handleImgError" />
                </div>
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
              <label>COSTRUTTORE</label>
              <div class="custom-dropdown" v-click-outside="() => isEditorCostruttoreDropdownOpen = false">
                <div class="dropdown-trigger" @click.stop="isEditorCostruttoreDropdownOpen = !isEditorCostruttoreDropdownOpen">
                  {{ selectedCostruttore?.name.split(',')[0] || 'SCEGLI COSTRUTTORE' }}
                  <span class="arrow" :class="{ open: isEditorCostruttoreDropdownOpen }">▼</span>
                </div>
                <Transition name="slide-up">
                  <div v-if="isEditorCostruttoreDropdownOpen" class="dropdown-menu glass-panel">
                    <div 
                      v-for="c in costruttori" 
                      :key="c.id" 
                      class="dropdown-item" 
                      :class="{ active: selectedCostruttore?.id === c.id }"
                      @click.stop="selectedCostruttore = c; isEditorCostruttoreDropdownOpen = false"
                    >
                      <span class="dot" style="background: #ffd700; box-shadow: 0 0 5px #ffd700;"></span>
                      {{ c.name.split(',')[0] }}
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
            <div class="privacy-area">
              <label class="checkbox-container">
                <input type="checkbox" v-model="isPublic">
                <span class="checkmark"></span>
                Sincronia Pubblica (Condividi Mazzo)
              </label>
            </div>
          </div>

          <div class="deck-stats-bar">
            <div class="stat" :class="{ 'warning': totalCards !== 40, 'success': totalCards === 40 }">
              CARTE: <span>{{ totalCards }}</span>/40
            </div>
            <div class="composition-hints">
              <div class="hint">Frammenti: {{ totalFrammenti }}</div>
              <div class="hint">Eventi/Anomalie: {{ totalEvents }}</div>
            </div>
          </div>

          <div class="current-deck-list">
            <div v-for="item in currentDeck" :key="item.card.id" class="deck-row">
              <span class="count">{{ item.count }}x</span>
              <span class="name">{{ item.card.name }}</span>
                <div class="row-actions">
                  <button class="cyber-btn extra-small red-bg" @click="removeFromDeck(item.card)">-</button>
                  <button class="cyber-btn extra-small cyan-bg" @click="addToDeck(item.card)">+</button>
                </div>
            </div>
            <div v-if="currentDeck.length === 0" class="empty-deck">
              Seleziona le carte dall'archivio a sinistra.
            </div>
          </div>

          <div class="editor-actions">
            <button @click="saveDeck" class="cyber-btn btn-primary full-width" :disabled="isSaving">
              {{ isSaving ? 'SINCRONIZZAZIONE...' : 'SALVA LINEA TEMPORALE' }}
            </button>
          </div>
        </div>
      </div>
    </div>



    <!-- MODAL CARD PREVIEW (LIKE DATABASE WITH CONTROLS) -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="selectedCard" class="modal-overlay" @click.self="selectedCard = null">
          <div class="modal-content glass-panel">
            <button class="close-btn" @click="selectedCard = null">&times;</button>
            <div class="modal-body">
              <div class="modal-image-container">
                <img :src="selectedCard.image_url" :alt="selectedCard.name" @error="handleImgError" />
              </div>
              <div class="modal-info">
                <h2>{{ selectedCard.name }}</h2>
                <div class="badge-row">
                   <span class="badge" :class="(selectedCard.type || '').split(' ')[0].toLowerCase()">{{ selectedCard.type }}</span>
                   <span class="rarity-badge">{{ selectedCard.rarity }}</span>
                </div>
                <p class="modal-effect">{{ selectedCard.effect }}</p>
                <div class="modal-stats">
                  <div class="stat-box"><strong>ET</strong><span>{{ selectedCard.cost_et ?? '-' }}</span></div>
                  <div class="stat-box"><strong>PEP</strong><span>{{ selectedCard.pep ?? '-' }}</span></div>
                  <div class="stat-box"><strong>RP</strong><span>{{ selectedCard.rp ?? '-' }}</span></div>
                </div>
                
                <div class="modal-controls-wrapper">
                  <p v-if="selectedCard.role" class="modal-role">Ruolo: {{ selectedCard.role }}</p>
                  
                  <!-- RAPID CONTROLS -->
                  <div class="viewer-controls">
                    <button class="cyber-btn extra-small red-bg" @click="removeFromDeck(selectedCard)">-</button>
                    <span class="current-count">{{ currentDeck.find(d => d.card.id === selectedCard?.id)?.count || 0 }}</span>
                    <button class="cyber-btn extra-small cyan-bg" @click="addToDeck(selectedCard)">+</button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- TERMINAL ALERT OVERLAY -->
    <Transition name="fade">
      <div v-if="showAlert" class="alert-overlay" @click="showAlert = false">
        <div class="alert-box glass-panel" @click.stop>
          <div class="alert-header">
            <span class="alert-icon">⚠️</span>
            NOTIFICA TERMINALE
          </div>
          <div class="alert-content">
            {{ alertMessage }}
          </div>
          <div class="alert-actions">
            <button class="cyber-btn btn-primary small-btn" @click="showAlert = false">RICEVUTO</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- SAVE PROMPT OVERLAY -->
    <Transition name="fade">
      <div v-if="showSavePrompt" class="alert-overlay" @click="showSavePrompt = false">
        <div class="alert-box glass-panel" @click.stop>
          <div class="alert-header">
            <span class="alert-icon">⚠️</span>
            SOVRASCRITTURA LINEA TEMPORALE
          </div>
          <div class="alert-content" style="margin-bottom: 2rem;">
            Questa Linea Temporale esiste già. Vuoi aggiornarla o crearne una nuova variante?
          </div>
          <div class="alert-actions split-actions">
            <button class="cyber-btn btn-danger small-btn" @click="executeSave(true)" :disabled="isSaving">AGGIORNA ESISTENTE</button>
            <button class="cyber-btn btn-primary small-btn" @click="executeSave(false)" :disabled="isSaving">CREA NUOVO</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- DELETE CONFIRM OVERLAY -->
    <Transition name="fade">
      <div v-if="showDeleteConfirm" class="alert-overlay" @click="showDeleteConfirm = false">
        <div class="alert-box glass-panel" @click.stop>
          <div class="alert-header">
            PROTOCOLLO DI ELIMINAZIONE
          </div>
          <div class="alert-content" style="margin-bottom: 2rem;">
            Sei sicuro di voler distruggere definitivamente questa linea temporale dalla matrice?
          </div>
          <div class="alert-actions split-actions">
            <button class="cyber-btn btn-danger small-btn" @click="executeDelete" :disabled="loading">CONFERMA ELIMINAZIONE</button>
            <button class="cyber-btn btn-secondary small-btn" @click="showDeleteConfirm = false">ANNULLA</button>
          </div>
        </div>
      </div>
    </Transition>
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
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0;
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
  padding: 1.2rem 3rem;
  font-size: 1.2rem;
  letter-spacing: 0.15rem;
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.2);
}

/* Search Area Unified with Database */
.search-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 1000px; /* Un po' più larga per ospitare tutto orizzontalmente */
  margin: 0 auto;
}

.search-box {
  flex-grow: 1;
}

.search-input {
  padding-left: 1.5rem !important;
  font-size: 1.1rem;
  height: 50px;
  width: 100%;
  margin-bottom: 0 !important;
}

/* Custom Dropdown Styles (Identical to Database) */
.custom-dropdown {
  position: relative;
  min-width: 220px;
}

.dropdown-trigger {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: var(--text-main);
  padding: 0 1.2rem;
  height: 50px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-family: var(--font-body);
  transition: all 0.3s ease;
  user-select: none;
  white-space: nowrap;
}

.dropdown-trigger.small {
  padding: 0 0.8rem;
  height: 38px;
  font-size: 0.8rem;
}

.dropdown-trigger:hover {
  border-color: var(--accent-cyan);
}

.dropdown-trigger .arrow {
  margin-left: auto;
  font-size: 0.7rem;
  transition: transform 0.3s;
  color: #fff;
}

.dropdown-trigger .arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  z-index: 999;
  background: rgba(10, 15, 25, 0.98);
  backdrop-filter: blur(15px);
  border: 1px solid var(--accent-cyan);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0,0,0,0.8);
}

.dropdown-item {
  padding: 1rem 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
  color: #fff;
  font-size: 0.9rem;
  text-align: left;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}

.dropdown-item.active {
  background: rgba(0, 240, 255, 0.1);
  color: var(--accent-cyan);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.3);
}

.stats-box {
  display: flex;
  align-items: center;
}

.count-tag {
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid var(--accent-cyan);
  padding: 0 1.2rem;
  height: 50px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: var(--font-display);
  color: var(--accent-cyan);
  white-space: nowrap;
}

/* Transitions */
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease-out;
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  background: rgba(255, 255, 255, 0.02);
}

.deck-card:hover {
  transform: translateY(-8px);
  border-color: var(--accent-cyan);
  box-shadow: 0 15px 40px rgba(0, 240, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
}

.deck-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.deck-title-row h3 {
  font-family: var(--font-display);
  font-size: 1.6rem;
  margin: 0;
  color: var(--accent-cyan);
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}

.deck-hero-container {
  width: 100%;
  height: 280px; /* Aumentato per immagini più grandi */
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.deck-hero-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* Garantisce visibilità totale senza ritagli */
  transition: transform 0.5s ease;
}

.deck-card:hover .deck-hero-img {
  transform: scale(1.1);
}

.deck-hero-caption {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0 0.5rem;
}

.caption-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 2px;
  font-weight: 800;
}

.caption-name {
  font-size: 0.95rem;
  color: #fff;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.deck-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.1rem;
  padding-top: 0.4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.small-delete.cyber-btn.mini {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 1.2rem;
  border-radius: 4px;
  background: rgba(255, 0, 110, 0.1);
  border: 1px solid var(--accent-magenta);
  color: var(--accent-magenta);
  transition: all 0.2s;
}

.small-delete.cyber-btn.mini:hover {
  background: var(--accent-magenta);
  color: #fff;
  box-shadow: 0 0 15px var(--accent-magenta);
}

.deck-privacy {
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  font-size: 0.75rem;
  border-radius: 4px;
  font-weight: 800;
  letter-spacing: 1px;
}

.deck-costruttore {
  font-size: 0.7rem;
  background: rgba(255,255,255,0.05);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  color: var(--text-muted);
}

.deck-privacy {
  font-size: 0.65rem;
  letter-spacing: 1px;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
}
.deck-privacy.public {
  background: rgba(0, 240, 255, 0.1);
  color: var(--accent-cyan);
  border: 1px solid var(--accent-cyan);
}
.deck-privacy.private {
  background: rgba(255, 0, 110, 0.1);
  color: var(--accent-magenta);
  border: 1px solid var(--accent-magenta);
}

.deck-costruttore-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.deck-costruttore-thumb {
  width: 40px;
  height: 40px;
  border-radius: 5px;
  object-fit: cover;
  border: 1px solid rgba(255,255,255,0.1);
  background: #1a1a1a;
}

.small-delete.cyber-btn.mini {
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  background: rgba(255, 0, 110, 0.1);
  border: 1px solid var(--accent-magenta);
  color: var(--accent-magenta);
  transition: all 0.3s;
  cursor: pointer;
}

.small-delete.cyber-btn.mini:hover {
  background: var(--accent-magenta);
  color: #fff;
  box-shadow: 0 0 15px var(--accent-magenta);
  transform: scale(1.1);
}

.trash-icon {
  font-size: 1.4rem;
  line-height: 1;
  margin-top: -2px;
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
  grid-template-columns: 1fr 380px; /* Ridotto da 450px per evitare overlap */
  gap: 1.5rem;
  height: calc(100vh - 180px); /* Altezza dinamica */
  min-height: 700px;
}

.side-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.library-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.uppercase-title {
  font-family: var(--font-display);
  letter-spacing: 2px;
  font-size: 1.2rem;
  margin: 0;
}

.small-btn {
  padding: 0.5rem 1.2rem;
  font-size: 0.8rem;
  height: auto;
}

.filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.library-grid-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.8rem;
  margin-bottom: 0.5rem;
  /* Hide scrollbar */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.library-grid-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 Colonne per visibilità totale come in Database */
  gap: 1.5rem;
  padding: 30px; /* Aumentato per prevenire clip in ogni direzione */
  transform-origin: center;
}

.card-item {
  padding: 1rem;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  cursor: pointer;
  background: rgba(10, 15, 25, 0.6);
}

.card-item:hover {
  transform: translateY(-8px);
  border-color: var(--accent-cyan);
  box-shadow: 0 10px 30px rgba(0, 240, 255, 0.15);
  position: relative;
  z-index: 10;
  transform-origin: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header.stacked {
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-main);
  text-shadow: 0 0 5px rgba(255,255,255,0.2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.card-img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
  border-radius: 8px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-enter-from .modal-content {
  transform: scale(0.9) translateY(20px);
}

.modal-content {
  max-width: 900px;
  width: 100%;
  background: rgba(10, 15, 25, 0.9);
  padding: 2rem;
  position: relative;
  border: 1px solid var(--accent-cyan);
  box-shadow: 0 0 50px rgba(0, 240, 255, 0.2);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 2.5rem;
  cursor: pointer;
  transition: color 0.3s;
  line-height: 1;
}
.close-btn:hover {
  color: var(--accent-magenta);
}

.modal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.modal-image-container img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
}

.modal-info h2 {
  font-family: var(--font-display);
  font-size: 2.2rem;
  margin-bottom: 1rem;
  color: var(--text-main);
  background: linear-gradient(to right, #fff, var(--accent-cyan));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.badge-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.rarity-badge {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  display: flex;
  align-items: center;
}

.modal-effect {
  font-size: 1.1rem;
  line-height: 1.7;
  color: #ccd6f6;
  margin-bottom: 2rem;
  font-style: italic;
}

.modal-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-box {
  background: rgba(0, 240, 255, 0.05);
  padding: 0.8rem 1.2rem;
  border-radius: 10px;
  border: 1px solid rgba(0, 240, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}
.stat-box strong {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}
.stat-box span {
  font-family: var(--font-display);
  font-size: 1.4rem;
  color: var(--accent-cyan);
}

.modal-role {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.modal-controls-wrapper {
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 1.5rem;
}

.viewer-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.current-count {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--accent-cyan);
  min-width: 60px;
  text-align: center;
}

.cyber-btn.small {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: transparent;
  font-family: var(--font-display);
  transition: all 0.3s;
}

.cyber-btn.cyan { border: 1px solid var(--accent-cyan); color: var(--accent-cyan); }
.cyber-btn.cyan:hover { background: var(--accent-cyan); color: #000; box-shadow: 0 0 15px var(--accent-cyan); }

.cyber-btn.magenta { border: 1px solid var(--accent-magenta); color: var(--accent-magenta); }
.cyber-btn.magenta:hover { background: var(--accent-magenta); color: #fff; box-shadow: 0 0 15px var(--accent-magenta); }

/* Reusing badges and stats from Database */
.badge {
  font-size: 0.75rem;
  padding: 0.35rem 0.8rem;
  border-radius: 4px;
  font-family: var(--font-display);
  letter-spacing: 1px;
}
.badge.solido { background: rgba(0, 123, 255, 0.2); border-bottom: 2px solid #007bff; color: #80cfff; }
.badge.liquido { background: rgba(40, 167, 69, 0.2); border-bottom: 2px solid #28a745; color: #80ffc0; }
.badge.gas { background: rgba(253, 126, 20, 0.2); border-bottom: 2px solid #fd7e14; color: #ffc080; }
.badge.plasma { background: rgba(220, 53, 69, 0.2); border-bottom: 2px solid #dc3545; color: #ff80a0; }
.badge.materia { background: rgba(138, 43, 226, 0.3); border-bottom: 2px solid #8a2be2; color: #d0a0ff; }
.badge.evento { background: rgba(205, 127, 50, 0.2); border-bottom: 2px solid #cd7f32; color: #dfaf80; }
.badge.anomalia { background: rgba(192, 192, 192, 0.2); border-bottom: 2px solid #c0c0c0; color: #e0e0e0; }

.card-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.card-stats p {
  background: rgba(0,0,0,0.3);
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  font-family: var(--font-display);
  color: var(--accent-cyan);
}
.card-stats strong { color: var(--text-muted); margin-right: 4px; }

.card-effect h3 {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--accent-magenta);
  margin-bottom: 0.8rem;
}

.card-role {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
}

.costruttore-area {
  margin-top: 1rem;
}

.costruttore-area label {
  display: block;
  font-family: var(--font-display);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  color: var(--accent-cyan);
}

.privacy-area {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  font-size: 0.9rem;
  user-select: none;
}

.checkbox-container input {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid var(--accent-cyan);
  border-radius: 4px;
  position: relative;
}

.checkbox-container input:checked + .checkmark::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--accent-cyan);
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 0 0 5px var(--accent-cyan);
}

.stat.success {
  color: #00ff88;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.4);
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
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.current-deck-list::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.deck-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.row-actions {
  display: flex;
  gap: 0.8rem;
  margin-left: auto;
}

.cyan-bg {
  background: var(--accent-cyan) !important;
  color: #000 !important;
}

.red-bg {
  background: var(--accent-magenta) !important;
  color: #fff !important;
}

.extra-small {
  width: 36px !important; /* Slightly larger to accommodate clip-path */
  height: 32px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 1.2rem !important;
  font-weight: 900 !important;
  border-radius: 0 !important; /* Clip-path handles the shape */
}

.extra-small:hover {
  transform: scale(1.1);
  box-shadow: 0 0 10px currentColor;
}


.deck-stats-bar {
  background: rgba(0,0,0,0.4);
  padding: 1rem;
  border-radius: 8px;
}

.stat { font-family: var(--font-display); font-size: 1.2rem; }
.warning { color: var(--accent-magenta); text-shadow: 0 0 10px var(--accent-magenta); }

.small-delete:hover {
  transform: scale(1.2);
}

/* Alert Modal Styles */
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.alert-box {
  width: 90%;
  max-width: 450px;
  padding: 2.5rem;
  border: 1px solid var(--accent-magenta);
  box-shadow: 0 0 30px rgba(255, 0, 110, 0.2);
  text-align: center;
}

.alert-header {
  font-family: var(--font-display);
  color: var(--accent-magenta);
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.alert-actions.split-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.btn-primary.danger {
  border-color: var(--accent-magenta);
  color: var(--accent-magenta);
}

.btn-primary.danger:hover:not(:disabled) {
  background: var(--accent-magenta);
  color: #fff;
  box-shadow: 0 0 20px rgba(255, 0, 110, 0.4);
}

.alert-content {
  color: #fff;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  font-family: var(--font-body);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 1100px) {
  .builder-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
}
</style>
