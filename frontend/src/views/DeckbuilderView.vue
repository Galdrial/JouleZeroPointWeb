<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import { useAuthStore } from "../stores/auth";
import { useCardStore } from "../stores/cardStore";
import { useDeckStore, type SavedDeck } from "../stores/deckStore";
import { useNotificationStore } from "../stores/notificationStore";
import api from "../utils/api";
import { useDeckExport } from "../composables/useDeckExport";
import DeckDashboard from "../components/DeckDashboard.vue";
import DeckEditor from "../components/DeckEditor.vue";

const authStore = useAuthStore();
const cardStore = useCardStore();
const deckStore = useDeckStore();
const notifications = useNotificationStore();

const { cards: allCards } = storeToRefs(cardStore);
const {
  userDecks: decks,
  totalUserDecks: totalDecks,
  loading: decksLoading,
  error: decksError,
} = storeToRefs(deckStore);

const username = computed(() => authStore.username);

const costruttori = computed(() =>
  allCards.value.filter((c) => c.type === "Costruttore"),
);

// View orchestration
const viewMode = ref<"dashboard" | "editor">("dashboard");
const loading = ref(true);
const isSaving = ref(false);
const editingDeck = ref<SavedDeck | null>(null);

// Delete lifecycle
const deckToDelete = ref<string | number | null>(null);
const showDeleteConfirm = ref(false);

// Dashboard filter & pagination state (owned here — drives loadDecks)
const searchDashboard = ref("");
const filterCostruttore = ref<number | "">("");
const currentPage = ref(1);
const limit = 12;

const { isExporting, exportingId, exportingFormat, handleExport } =
  useDeckExport(allCards, decks);

const loadDecks = async () => {
  await deckStore.fetchUserDecks({
    q: searchDashboard.value,
    costruttoreId: filterCostruttore.value,
    page: currentPage.value,
    limit,
  });
};

const handleSearchChange = (q: string) => {
  searchDashboard.value = q;
  currentPage.value = 1;
  loadDecks();
};

const handleFilterChange = (id: number | "") => {
  filterCostruttore.value = id;
  currentPage.value = 1;
  loadDecks();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadDecks();
};

const confirmDelete = (id: string | number) => {
  deckToDelete.value = id;
  showDeleteConfirm.value = true;
};

const executeDelete = async () => {
  if (deckToDelete.value) {
    const success = await deckStore.deleteDeck(deckToDelete.value);
    if (success) {
      deckToDelete.value = null;
      showDeleteConfirm.value = false;
      loadDecks();
    } else {
      notifications.error("ERRORE DURANTE LA DISMISSIONE DEL MAZZO.");
    }
  }
};

const editDeck = (deck: SavedDeck) => {
  editingDeck.value = deck;
  viewMode.value = "editor";
};

const createNewDeck = () => {
  editingDeck.value = null;
  viewMode.value = "editor";
};

const handleSave = async (payload: SavedDeck) => {
  isSaving.value = true;
  try {
    await api.post("/decks", { ...payload, creator: username.value });
    notifications.success(
      "Mazzo sincronizzato correttamente con la Matrice Joule!",
    );
    viewMode.value = "dashboard";
    loadDecks();
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { error?: string } } })?.response
      ?.data?.error;
    notifications.error(
      msg || "ERRORE DURANTE LA SINCRONIZZAZIONE DELLA LINEA TEMPORALE.",
    );
  } finally {
    isSaving.value = false;
  }
};

watch(decksError, (newError) => {
  if (newError) {
    notifications.error(`ERRORE NELLA MATRICE: ${newError}`);
  }
});

onMounted(async () => {
  loading.value = true;
  await cardStore.fetchCards();

  const editId = new URLSearchParams(window.location.search).get("edit");
  if (editId) {
    try {
      const deckData = await deckStore.fetchDeckById(editId);
      if (deckData) {
        editDeck(deckData);
      } else {
        await loadDecks();
      }
    } catch (e) {
      console.error("Deck edit load error:", e);
      await loadDecks();
    }
  } else {
    await loadDecks();
  }
  loading.value = false;
});
</script>

<template>
  <div class="deck-view fade-in">
    <DeckDashboard
      v-if="viewMode === 'dashboard'"
      :decks="decks"
      :loading="decksLoading"
      :total-decks="totalDecks"
      :costruttori="costruttori"
      :is-exporting="isExporting"
      :exporting-id="exportingId"
      :exporting-format="exportingFormat"
      :current-page="currentPage"
      :limit="limit"
      :search="searchDashboard"
      :filter-costruttore="filterCostruttore"
      @create="createNewDeck"
      @edit="editDeck"
      @delete="confirmDelete"
      @export="handleExport"
      @update:current-page="handlePageChange"
      @update:search="handleSearchChange"
      @update:filter-costruttore="handleFilterChange"
    />

    <DeckEditor
      v-else
      :all-cards="allCards"
      :costruttori="costruttori"
      :initial-deck="editingDeck"
      :is-saving="isSaving"
      @save="handleSave"
      @back="viewMode = 'dashboard'"
    />

    <!-- EXPORT LOADER OVERLAY -->
    <Transition name="matrix-fade">
      <div v-if="isExporting" class="export-overlay">
        <div class="matrix-background"></div>
        <div class="extraction-container">
          <div class="glitch-title" data-text="ESTRAZIONE DATI">
            ESTRAZIONE DATI
          </div>
          <div class="processing-core">
            <div class="core-ring"></div>
            <div class="core-ring"></div>
            <div class="core-ring"></div>
            <div class="core-pulse"></div>
            <div class="scanning-line"></div>
          </div>
          <div class="extraction-status">
            <span class="status-indicator">●</span>
            <span class="status-text">
              Sincronizzazione Frammenti:
              {{ (exportingFormat || "pdf").toUpperCase() }}...
            </span>
          </div>
          <div class="matrix-code">
            01010110 01001111 01001001 01000100 00100000 01011010 01000101
            01010010 01001111 00100000 01010000 01001111 01001001 01001110
            01010100
          </div>
        </div>
      </div>
    </Transition>

    <!-- DELETE CONFIRM OVERLAY -->
    <Transition name="fade">
      <div
        v-if="showDeleteConfirm"
        class="alert-overlay"
        @click="showDeleteConfirm = false"
      >
        <div class="alert-box glass-panel" @click.stop>
          <div class="alert-header">PROTOCOLLO DI ELIMINAZIONE</div>
          <div class="alert-content">
            Sei sicuro di voler distruggere definitivamente questa linea
            temporale dalla matrice?
          </div>
          <div class="alert-actions split-actions">
            <button
              class="cyber-btn btn-danger small-btn"
              @click="executeDelete"
              :disabled="loading"
            >
              CONFERMA ELIMINAZIONE
            </button>
            <button
              class="cyber-btn btn-secondary small-btn"
              @click="showDeleteConfirm = false"
            >
              ANNULLA
            </button>
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

/* ── Delete Confirm Modal ── */
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
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
  box-shadow: 0 0 30px rgba(255, 159, 28, 0.24);
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

.alert-content {
  color: #fff;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  font-family: var(--font-body);
}

.alert-actions.split-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.btn-secondary {
  border-color: var(--accent-gold) !important;
  color: var(--accent-gold) !important;
  font-size: 0.8rem !important;
  background: rgba(0, 255, 255, 0.05) !important;
}

.btn-secondary:hover {
  background: var(--accent-gold) !important;
  color: #000 !important;
}

.small-btn {
  padding: 0.5rem 1.2rem;
  font-size: 0.8rem;
  height: auto;
}

/* ── Transitions ── */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

.matrix-fade-enter-active,
.matrix-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.matrix-fade-enter-from,
.matrix-fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0);
}

/* ── Export Overlay ── */
.export-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #050a10;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.matrix-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at center,
    rgba(0, 243, 255, 0.05) 0%,
    transparent 70%
  );
  opacity: 0.5;
}

.extraction-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  width: 100%;
  max-width: 600px;
}

.glitch-title {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 8px;
  color: #fff;
  position: relative;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

.processing-core {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.core-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
}

.core-ring:nth-child(1) {
  width: 100%;
  height: 100%;
  border-top-color: var(--accent-gold);
  animation: rotate 2s linear infinite;
  box-shadow: 0 0 20px var(--accent-gold);
}

.core-ring:nth-child(2) {
  width: 75%;
  height: 75%;
  border-bottom-color: var(--accent-magenta);
  animation: rotate 1.5s linear infinite reverse;
}

.core-ring:nth-child(3) {
  width: 50%;
  height: 50%;
  border-left-color: var(--accent-gold);
  animation: rotate 3s linear infinite;
}

.core-pulse {
  width: 30px;
  height: 30px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 50px #fff;
  animation: pulse 1s ease-in-out infinite alternate;
}

.scanning-line {
  position: absolute;
  width: 250px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-gold), transparent);
  box-shadow: 0 0 15px var(--accent-gold);
  animation: scan 4s ease-in-out infinite;
}

.extraction-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: var(--font-display);
  letter-spacing: 2px;
}

.status-indicator {
  color: var(--accent-gold);
  animation: blink 0.8s infinite;
}

.status-text {
  color: #fff;
  font-size: 1.1rem;
  text-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
}

.matrix-code {
  font-family: monospace;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.2);
  max-width: 400px;
  text-align: center;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  from { transform: scale(0.8); opacity: 0.5; }
  to { transform: scale(1.2); opacity: 1; }
}

@keyframes scan {
  0% { transform: translateY(-150px); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(150px); opacity: 0; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@media (max-width: 768px) {
  .deck-view { padding: 1rem 0.5rem; }

  .alert-box { padding: 1.4rem 1rem; }

  .alert-actions.split-actions {
    flex-direction: column;
  }

  .alert-actions.split-actions .cyber-btn,
  .alert-actions .cyber-btn {
    width: 100%;
  }
}
</style>
