<script setup lang="ts">
import axios from "axios";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

interface CardRef {
  cardId: number;
  count: number;
}

interface PublicDeck {
  id: number;
  name: string;
  creator: string;
  costruttoreId: number | null;
  cards: CardRef[];
  createdAt: number;
  importsCount: number;
  votesCount: number;
  userVoted: boolean;
}

interface Card {
  id: number;
  name: string;
  image_url: string;
  type: string;
}

const username = ref(localStorage.getItem("username") || "");
const loading = ref(true);
const error = ref("");
const successMessage = ref("");
let successMessageTimer: ReturnType<typeof setTimeout> | null = null;
const decks = ref<PublicDeck[]>([]);
const totalDecks = ref(0);
const currentPage = ref(1);
const limit = 12;

const searchQuery = ref("");
const filterCostruttore = ref<number | "">("");
const sortBy = ref<"recent" | "top" | "imports">("recent");

const allCards = ref<Card[]>([]);
const selectedDeck = ref<PublicDeck | null>(null);
const isCostruttoreDropdownOpen = ref(false);
const isSortDropdownOpen = ref(false);

const costruttori = computed(() =>
  allCards.value.filter((c) => c.type === "Costruttore"),
);

const sortOptions = [
  { value: "recent", label: "Recenti" },
  { value: "top", label: "Più votati" },
  { value: "imports", label: "Più importati" },
] as const;

const totalPages = computed(() => Math.ceil(totalDecks.value / limit));

const vClickOutside = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: any) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.body.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted(el: any) {
    document.body.removeEventListener("click", el.clickOutsideEvent);
  },
};

const getCostruttoreName = (id: number | null) => {
  if (!id) return "Sconosciuto";
  return costruttori.value.find((c) => c.id === id)?.name || "Sconosciuto";
};

const getCostruttoreImg = (id: number | null) => {
  if (!id) return "";
  return costruttori.value.find((c) => c.id === id)?.image_url || "";
};

const previewCards = computed(() => {
  if (!selectedDeck.value) return [];
  return selectedDeck.value.cards
    .map((item) => {
      const card = allCards.value.find((c) => c.id === item.cardId);
      return {
        cardId: item.cardId,
        count: item.count,
        name: card?.name || `Carta #${item.cardId}`,
        type: card?.type || "Sconosciuto",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
});

const loadCostruttori = async () => {
  const response = await axios.get("/api/cards");
  allCards.value = response.data;
};

const loadPublicDecks = async () => {
  loading.value = true;
  error.value = "";
  try {
    const response = await axios.get("/api/public-decks", {
      params: {
        q: searchQuery.value,
        costruttoreId: filterCostruttore.value,
        sort: sortBy.value,
        page: currentPage.value,
        limit,
      },
      headers: {
        "x-user": username.value,
      },
    });

    decks.value = response.data.decks;
    totalDecks.value = response.data.total;
  } catch (e) {
    console.error(e);
    error.value = "Errore caricamento mazzi pubblici dalla rete.";
  } finally {
    loading.value = false;
  }
};

const voteDeck = async (deck: PublicDeck) => {
  if (!username.value) {
    error.value = "Effettua il login per votare i mazzi.";
    return;
  }

  try {
    const response = await axios.post(
      `/api/decks/${deck.id}/vote`,
      {},
      {
        headers: { "x-user": username.value },
      },
    );

    deck.votesCount = response.data.votesCount;
    deck.userVoted = response.data.userVoted;
  } catch (e: any) {
    error.value = e?.response?.data?.error || "Errore durante il voto.";
  }
};

const importDeck = async (deck: PublicDeck) => {
  if (!username.value) {
    error.value = "Effettua il login per importare i mazzi.";
    return;
  }

  if (
    (deck.creator || "").trim().toLowerCase() ===
    username.value.trim().toLowerCase()
  ) {
    error.value = "Non puoi importare un tuo mazzo.";
    return;
  }

  try {
    const response = await axios.post(
      `/api/decks/${deck.id}/import`,
      {},
      {
        headers: { "x-user": username.value },
      },
    );

    deck.importsCount += 1;
    const importedDeckName =
      response?.data?.importedDeck?.name || "Mazzo importato";
    showSuccessMessage(`Import riuscito: ${importedDeckName}`);
    error.value = "";
  } catch (e: any) {
    clearSuccessMessage();
    error.value = e?.response?.data?.error || "Errore durante l'import.";
  }
};

const clearSuccessMessage = () => {
  successMessage.value = "";
  if (successMessageTimer) {
    clearTimeout(successMessageTimer);
    successMessageTimer = null;
  }
};

const showSuccessMessage = (message: string) => {
  clearSuccessMessage();
  successMessage.value = message;
  successMessageTimer = setTimeout(() => {
    successMessage.value = "";
    successMessageTimer = null;
  }, 3500);
};

const openPreview = (deck: PublicDeck) => {
  selectedDeck.value = deck;
};

watch([searchQuery, filterCostruttore, sortBy], () => {
  currentPage.value = 1;
  clearSuccessMessage();
  loadPublicDecks();
});

watch(currentPage, loadPublicDecks);

watch(selectedDeck, (value) => {
  document.body.style.overflow = value ? "hidden" : "";
});

onMounted(async () => {
  username.value = localStorage.getItem("username") || "";
  await Promise.all([loadCostruttori(), loadPublicDecks()]);
});

onBeforeUnmount(() => {
  clearSuccessMessage();
});
</script>

<template>
  <div class="public-decks-view fade-in">
    <h1 class="main-title">MAZZI PUBBLICI</h1>

    <div class="search-container">
      <div class="search-box">
        <input
          v-model="searchQuery"
          placeholder="Cerca per nome o creatore..."
          class="glass-input search-input"
        />
      </div>

      <div
        class="custom-dropdown"
        v-click-outside="() => (isCostruttoreDropdownOpen = false)"
      >
        <div
          class="dropdown-trigger"
          @click.stop="isCostruttoreDropdownOpen = !isCostruttoreDropdownOpen"
        >
          {{
            costruttori
              .find((c) => c.id === filterCostruttore)
              ?.name.split(",")[0] || "COSTRUTTORE"
          }}
          <span class="arrow" :class="{ open: isCostruttoreDropdownOpen }"
            >▼</span
          >
        </div>
        <Transition name="slide-up">
          <div
            v-if="isCostruttoreDropdownOpen"
            class="dropdown-menu glass-panel"
          >
            <div
              class="dropdown-item"
              :class="{ active: filterCostruttore === '' }"
              @click.stop="filterCostruttore = ''"
            >
              <span
                class="dot"
                style="background: transparent; opacity: 0"
              ></span>
              TUTTI
            </div>
            <div
              v-for="c in costruttori"
              :key="c.id"
              class="dropdown-item"
              :class="{ active: filterCostruttore === c.id }"
              @click.stop="filterCostruttore = c.id"
            >
              <span
                class="dot"
                style="background: #ffd700; box-shadow: 0 0 5px #ffd700"
              ></span>
              {{ c.name.split(",")[0] }}
            </div>
          </div>
        </Transition>
      </div>

      <div
        class="custom-dropdown"
        v-click-outside="() => (isSortDropdownOpen = false)"
      >
        <div
          class="dropdown-trigger"
          @click.stop="isSortDropdownOpen = !isSortDropdownOpen"
        >
          {{ sortOptions.find((s) => s.value === sortBy)?.label }}
          <span class="arrow" :class="{ open: isSortDropdownOpen }">▼</span>
        </div>
        <Transition name="slide-up">
          <div v-if="isSortDropdownOpen" class="dropdown-menu glass-panel">
            <div
              v-for="opt in sortOptions"
              :key="opt.value"
              class="dropdown-item"
              :class="{ active: sortBy === opt.value }"
              @click.stop="sortBy = opt.value"
            >
              {{ opt.label }}
            </div>
          </div>
        </Transition>
      </div>

      <div class="stats-box">
        <span class="count-tag">Mazzi Rilevati {{ totalDecks }}</span>
      </div>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>
    <div v-if="successMessage" class="success-banner">
      <span>{{ successMessage }}</span>
      <button class="success-close" @click="clearSuccessMessage">×</button>
    </div>

    <div v-if="loading" class="dashboard-loading">
      <div class="loader"></div>
    </div>

    <div v-else class="decks-grid">
      <div v-for="d in decks" :key="d.id" class="deck-card glass-panel">
        <div class="deck-top-row">
          <div class="deck-title-row">
            <h3>{{ d.name }}</h3>
            <span class="deck-creator">@{{ d.creator }}</span>
          </div>
        </div>

        <div class="deck-hero-container">
          <img
            :src="getCostruttoreImg(d.costruttoreId)"
            class="deck-hero-img"
          />
        </div>

        <div class="deck-hero-caption">
          <span class="caption-name">{{
            getCostruttoreName(d.costruttoreId)
          }}</span>
        </div>

        <div class="deck-footer-row">
          <div class="stat-chip">
            <span class="stat-key">VOTI</span>
            <span class="stat-val">{{ d.votesCount }}</span>
          </div>
          <div class="stat-chip">
            <span class="stat-key">IMPORT</span>
            <span class="stat-val">{{ d.importsCount }}</span>
          </div>
        </div>

        <div class="deck-actions">
          <button
            class="cyber-btn btn-secondary small preview-btn"
            @click="openPreview(d)"
          >
            Visualizza
          </button>
          <button
            class="cyber-btn btn-secondary small"
            :class="{ voted: d.userVoted }"
            @click="voteDeck(d)"
          >
            {{ d.userVoted ? "Votato" : "Vota" }}
          </button>
          <button
            class="cyber-btn btn-primary small"
            :disabled="
              (d.creator || '').trim().toLowerCase() ===
              username.trim().toLowerCase()
            "
            :title="
              (d.creator || '').trim().toLowerCase() ===
              username.trim().toLowerCase()
                ? 'Non puoi importare un tuo mazzo.'
                : ''
            "
            @click="importDeck(d)"
          >
            Importa
          </button>
        </div>
      </div>

      <div v-if="decks.length === 0" class="empty-dashboard glass-panel">
        Nessun mazzo pubblico trovato.
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="selectedDeck"
          class="modal-overlay"
          @click.self="selectedDeck = null"
        >
          <div class="modal-content glass-panel">
            <button class="close-btn" @click="selectedDeck = null">
              &times;
            </button>
            <h2 class="modal-title">{{ selectedDeck.name }}</h2>
            <div class="modal-subtitle">
              <span>@{{ selectedDeck.creator }}</span>
              <span>{{ getCostruttoreName(selectedDeck.costruttoreId) }}</span>
            </div>

            <div class="preview-list">
              <div
                v-for="item in previewCards"
                :key="item.cardId"
                class="preview-row"
              >
                <span class="preview-count">{{ item.count }}x</span>
                <span class="preview-name">{{ item.name }}</span>
                <span class="preview-type">{{ item.type }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div v-if="totalPages > 1" class="pagination">
      <button
        :disabled="currentPage === 1"
        class="page-btn"
        @click="currentPage--"
      >
        PREV
      </button>
      <span class="page-info">PAG {{ currentPage }} / {{ totalPages }}</span>
      <button
        :disabled="currentPage === totalPages"
        class="page-btn"
        @click="currentPage++"
      >
        NEXT
      </button>
    </div>
  </div>
</template>

<style scoped>
.public-decks-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  padding-bottom: 4rem;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
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
  margin-bottom: 3.5rem;
  text-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
}

.search-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  width: 100%;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
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
  z-index: 10;
  background: rgba(10, 15, 25, 0.98);
  border: 1px solid var(--accent-cyan);
  border-radius: 10px;
  overflow: hidden;
}

.dropdown-item {
  padding: 0.85rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dropdown-item:hover,
.dropdown-item.active {
  background: rgba(212, 175, 55, 0.12);
  color: var(--accent-cyan);
}

.stats-box {
  display: flex;
  align-items: center;
}

.count-tag {
  background: rgba(212, 175, 55, 0.12);
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

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.error-banner {
  margin: 0;
  border: 1px solid var(--accent-magenta);
  color: var(--accent-magenta);
  background: rgba(255, 159, 28, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.success-banner {
  margin: 0;
  border: 1px solid rgba(0, 255, 136, 0.6);
  color: #00ff88;
  background: rgba(0, 255, 136, 0.1);
  box-shadow: 0 0 18px rgba(0, 255, 136, 0.15);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.success-close {
  border: 0;
  background: transparent;
  color: #00ff88;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.decks-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-items: stretch;
  gap: 1.2rem;
  margin-top: 0.2rem;
}

.deck-card {
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.deck-card:hover {
  transform: translateY(-8px);
  border-color: var(--accent-cyan);
  box-shadow: 0 15px 40px rgba(212, 175, 55, 0.18);
  background: rgba(255, 255, 255, 0.05);
}

.deck-top-row {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}

.deck-title-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-height: 66px;
}

.deck-title-row h3 {
  margin: 0;
  color: var(--accent-cyan);
  font-family: var(--font-display);
  font-size: 1.3rem;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.deck-creator {
  font-size: 0.78rem;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.deck-hero-container {
  width: 100%;
  height: 260px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.deck-hero-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.45s ease;
}

.deck-card:hover .deck-hero-img {
  transform: scale(1.08);
}

.deck-hero-caption {
  display: flex;
  align-items: flex-start;
  padding: 0 0.4rem;
  min-height: 42px;
}

.caption-name {
  font-size: 0.92rem;
  color: #fff;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.45px;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.deck-footer-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: 0.8rem;
  padding-top: 0.5rem;
  min-height: 44px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 30px;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(212, 175, 55, 0.22);
  background: rgba(212, 175, 55, 0.08);
}

.stat-key {
  font-size: 0.68rem;
  letter-spacing: 1px;
  color: var(--text-muted);
  font-family: var(--font-display);
}

.stat-val {
  font-size: 0.85rem;
  color: var(--accent-cyan);
  font-family: var(--font-display);
}

.cyber-btn.small {
  width: 100%;
  height: 36px;
}

.deck-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  margin-top: auto;
}

.preview-btn {
  grid-column: 1 / -1;
}

.cyber-btn.voted {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.empty-dashboard {
  grid-column: 1 / -1;
  padding: 1rem;
  text-align: center;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.page-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--accent-cyan);
  color: var(--accent-cyan);
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

.page-btn:disabled {
  opacity: 0.4;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-content {
  width: 100%;
  max-width: 760px;
  max-height: 82vh;
  overflow-y: auto;
  padding: 1.5rem;
  border: 1px solid var(--accent-cyan);
  position: relative;
}

.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.9rem;
  background: transparent;
  border: 0;
  color: var(--text-muted);
  font-size: 2rem;
  cursor: pointer;
}

.modal-title {
  margin: 0 0 0.7rem 0;
  color: var(--accent-cyan);
  font-family: var(--font-display);
}

.modal-subtitle {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  color: var(--text-muted);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.preview-list {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
}

.preview-row {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.55rem 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.preview-row:last-child {
  border-bottom: 0;
}

.preview-count {
  color: var(--accent-cyan);
  font-family: var(--font-display);
}

.preview-name {
  color: var(--text-main);
}

.preview-type {
  color: var(--text-muted);
  font-size: 0.82rem;
}

@media (max-width: 980px) {
  .search-container {
    flex-direction: column;
    align-items: stretch;
  }

  .custom-dropdown {
    min-width: 100%;
  }
}
</style>
