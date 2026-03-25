<script setup lang="ts">
import axios from "axios";
import { computed, onMounted, ref, watch } from "vue";

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

interface CostruttoreCard {
  id: number;
  name: string;
  image_url: string;
  type: string;
}

const username = ref(localStorage.getItem("username") || "");
const loading = ref(true);
const error = ref("");
const decks = ref<PublicDeck[]>([]);
const totalDecks = ref(0);
const currentPage = ref(1);
const limit = 12;

const searchQuery = ref("");
const filterCostruttore = ref<number | "">("");
const sortBy = ref<"recent" | "top" | "imports">("recent");

const costruttori = ref<CostruttoreCard[]>([]);
const isCostruttoreDropdownOpen = ref(false);
const isSortDropdownOpen = ref(false);

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
  return costruttori.value.find((c) => c.id === id)?.name.split(",")[0] || "Sconosciuto";
};

const getCostruttoreImg = (id: number | null) => {
  if (!id) return "";
  return costruttori.value.find((c) => c.id === id)?.image_url || "";
};

const getDeckCardsTotal = (deck: PublicDeck) => {
  return deck.cards.reduce((sum, item) => sum + item.count, 0);
};

const loadCostruttori = async () => {
  const response = await axios.get("/api/cards");
  costruttori.value = response.data.filter((c: CostruttoreCard) => c.type === "Costruttore");
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

  try {
    await axios.post(
      `/api/decks/${deck.id}/import`,
      {},
      {
        headers: { "x-user": username.value },
      },
    );

    deck.importsCount += 1;
  } catch (e: any) {
    error.value = e?.response?.data?.error || "Errore durante l'import.";
  }
};

watch([searchQuery, filterCostruttore, sortBy], () => {
  currentPage.value = 1;
  loadPublicDecks();
});

watch(currentPage, loadPublicDecks);

onMounted(async () => {
  username.value = localStorage.getItem("username") || "";
  await Promise.all([loadCostruttori(), loadPublicDecks()]);
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
            costruttori.find((c) => c.id === filterCostruttore)?.name.split(",")[0] ||
            "COSTRUTTORE"
          }}
          <span class="arrow" :class="{ open: isCostruttoreDropdownOpen }">▼</span>
        </div>
        <Transition name="slide-up">
          <div v-if="isCostruttoreDropdownOpen" class="dropdown-menu glass-panel">
            <div
              class="dropdown-item"
              :class="{ active: filterCostruttore === '' }"
              @click.stop="filterCostruttore = ''"
            >
              TUTTI
            </div>
            <div
              v-for="c in costruttori"
              :key="c.id"
              class="dropdown-item"
              :class="{ active: filterCostruttore === c.id }"
              @click.stop="filterCostruttore = c.id"
            >
              {{ c.name.split(",")[0] }}
            </div>
          </div>
        </Transition>
      </div>

      <div class="custom-dropdown" v-click-outside="() => (isSortDropdownOpen = false)">
        <div class="dropdown-trigger" @click.stop="isSortDropdownOpen = !isSortDropdownOpen">
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
        <span class="count-tag">Mazzi trovati {{ totalDecks }}</span>
      </div>
    </div>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <div v-if="loading" class="dashboard-loading">
      <div class="loader"></div>
    </div>

    <div v-else class="decks-grid">
      <div v-for="d in decks" :key="d.id" class="deck-card glass-panel">
        <div class="deck-top-row">
          <h3>{{ d.name }}</h3>
          <span class="deck-creator">@{{ d.creator }}</span>
        </div>

        <div class="deck-hero-container">
          <img :src="getCostruttoreImg(d.costruttoreId)" class="deck-hero-img" />
        </div>

        <div class="deck-meta">
          <span>{{ getCostruttoreName(d.costruttoreId) }}</span>
          <span>Carte: {{ getDeckCardsTotal(d) }}/40</span>
        </div>

        <div class="deck-counters">
          <span>▲ {{ d.votesCount }}</span>
          <span>⭳ {{ d.importsCount }}</span>
        </div>

        <div class="deck-actions">
          <button
            class="cyber-btn btn-secondary small"
            :class="{ voted: d.userVoted }"
            @click="voteDeck(d)"
          >
            {{ d.userVoted ? "Votato" : "Vota" }}
          </button>
          <button class="cyber-btn btn-primary small" @click="importDeck(d)">
            Importa
          </button>
        </div>
      </div>

      <div v-if="decks.length === 0" class="empty-dashboard glass-panel">
        Nessun mazzo pubblico trovato.
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="currentPage === 1" class="page-btn" @click="currentPage--">PREV</button>
      <span class="page-info">PAG {{ currentPage }} / {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" class="page-btn" @click="currentPage++">NEXT</button>
    </div>
  </div>
</template>

<style scoped>
.public-decks-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.main-title {
  text-align: center;
  font-size: 3rem;
  font-family: var(--font-display);
  letter-spacing: 0.4rem;
  margin-bottom: 1.5rem;
  color: var(--accent-cyan);
}

.search-container {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-box {
  flex: 1;
}

.search-input {
  height: 48px;
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
  height: 48px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  user-select: none;
}

.dropdown-trigger .arrow {
  margin-left: auto;
  font-size: 0.7rem;
  transition: transform 0.3s;
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
}

.dropdown-item:hover,
.dropdown-item.active {
  background: rgba(0, 240, 255, 0.1);
  color: var(--accent-cyan);
}

.stats-box {
  display: flex;
  align-items: center;
}

.count-tag {
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid var(--accent-cyan);
  padding: 0 1.1rem;
  height: 48px;
  display: flex;
  align-items: center;
  border-radius: 6px;
}

.error-banner {
  margin-bottom: 1rem;
  border: 1px solid var(--accent-magenta);
  color: var(--accent-magenta);
  background: rgba(255, 0, 110, 0.08);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.decks-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.2rem;
}

.deck-card {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.deck-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deck-top-row h3 {
  margin: 0;
  color: var(--accent-cyan);
  font-family: var(--font-display);
}

.deck-creator {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.deck-hero-container {
  width: 100%;
  height: 210px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.deck-hero-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.deck-meta,
.deck-counters,
.deck-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
}

.deck-meta,
.deck-counters {
  font-size: 0.85rem;
}

.deck-counters {
  color: var(--text-muted);
}

.cyber-btn.small {
  flex: 1;
  height: 36px;
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
