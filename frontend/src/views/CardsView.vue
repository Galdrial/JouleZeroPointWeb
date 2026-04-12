<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import {
  CARDS_VIEW_TYPE_OPTIONS,
  type CardTypeOption,
} from "../constants/cardTypes";
import { useCardStore, type Card } from "../stores/cardStore";
import { useNotificationStore } from "../stores/notificationStore";

// State Orchestration: Stores & Core Refs
const cardStore = useCardStore();
const notifications = useNotificationStore();
const { cards, loading, error } = storeToRefs(cardStore);

// Reactive Discovery Filters
const searchQuery = ref("");
const selectedType = ref("");
const filterEt = ref(10); // Energy Threshold ceiling
const filterPep = ref(10); // Power level ceiling
const filterRp = ref(10); // Resilience level ceiling

// Modal & Preview State
const selectedCard = ref<Card | null>(null);

// UI Toggle State
const showFilters = ref(false);
const isTypeDropdownOpen = ref(false);

// Pagination Attributes
const currentPage = ref(1);
const itemsPerPage = 20;
const types: CardTypeOption[] = CARDS_VIEW_TYPE_OPTIONS;

// Computed Logic: Dropdown Label Synthesis
const selectedTypeOption = computed(() =>
  types.find((typeOption) => typeOption.value === selectedType.value),
);

/**
 * Filter Sequence: Type Selection
 */
const selectType = (type: string) => {
  selectedType.value = type;
  isTypeDropdownOpen.value = false;
};

// Sorting State Management
const sortBy = ref("id");
const isSortDropdownOpen = ref(false);
const sortOptions = [
  { value: "id", label: "Default (ID)" },
  { value: "name", label: "Name (A-Z)" },
  { value: "cost_et", label: "Cost (ET)" },
  { value: "pep", label: "Power (PEP)" },
  { value: "rp", label: "Resilience (RP)" },
];

/**
 * Filter Sequence: Sort Selection
 */
const selectSort = (val: string) => {
  sortBy.value = val;
  isSortDropdownOpen.value = false;
};

/**
 * Lifecycle Observer: Modal Scroll Management
 * Locks the main perspective scroll when a fragment is in detailed view.
 */
watch(selectedCard, (val) => {
  if (val) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
});

/**
 * Asset Hydration Error Handler
 */
const handleImgError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.style.display = "none";
  target.parentElement?.classList.add("missing-image");
};

/**
 * Computed Logic: Matrix Filtering & Sorting Sequence
 * Orchestrates the multi-layered filter application for card discovery.
 */
const filteredCards = computed(() => {
  return (cards.value as Card[])
    .filter((card: Card) => {
      // Identity Match
      const nameMatch = card.name
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase());

      // Categorical Match
      const typeMatch = !selectedType.value || card.type === selectedType.value;

      // Capability Thresholds:
      // If filter is at maximum (10), all cards pass.
      // If constrained, card must possess the attribute and stay within range.
      const etMatch =
        filterEt.value >= 10 ||
        (card.cost_et !== null && card.cost_et <= filterEt.value);
      const pepMatch =
        filterPep.value >= 10 ||
        (card.pep !== null && card.pep <= filterPep.value);
      const rpMatch =
        filterRp.value >= 10 || (card.rp !== null && card.rp <= filterRp.value);

      return nameMatch && typeMatch && etMatch && pepMatch && rpMatch;
    })
    .sort((a: Card, b: Card) => {
      if (sortBy.value === "id") return 0; // Maintain original sequence
      if (sortBy.value === "name") return a.name.localeCompare(b.name);

      // Capability Ranking (Descending)
      if (sortBy.value === "pep" || sortBy.value === "rp") {
        const valA = a[sortBy.value] ?? -1;
        const valB = b[sortBy.value] ?? -1;
        return (valB as number) - (valA as number);
      }

      // Cost Ranking (Ascending)
      const valA = a[sortBy.value] ?? 999;
      const valB = b[sortBy.value] ?? 999;
      return (valA as number) - (valB as number);
    });
});

/**
 * Computed Logic: Pagination Metrics
 */
const totalPages = computed(() =>
  Math.ceil(filteredCards.value.length / itemsPerPage),
);

/**
 * Computed Logic: Active Paginated Slice
 */
const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredCards.value.slice(start, start + itemsPerPage);
});

/**
 * State Hygiene: Reset pagination on filter recalibration
 */
watch(
  [searchQuery, selectedType, filterEt, filterPep, filterRp, sortBy],
  () => {
    currentPage.value = 1;
  },
);

/**
 * Viewport Bridge: Scroll to top of the matrix
 */
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(async () => {
  // Initialization Sequence: Synchronize card repository
  try {
    await cardStore.fetchCards();
  } catch (err) {
    // Managed via global notification infrastructure
  }
});

/**
 * Dissonance Observer: Monitor for database synchronization errors
 */
watch(error, (newError) => {
  if (newError) {
    notifications.error("Dissonanza nel database delle carte: " + newError);
  }
});

/**
 * UI Support: Click-Outside Directive
 */
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
</script>

<template>
  <div class="cards-view fade-in">
    <h1 class="glitch-text" data-text="DATABASE">DATABASE</h1>

    <!-- Central search bar -->
    <div class="search-container">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Es: Nucleo di Basalto"
          class="glass-input search-input"
          @keyup.enter="showFilters = false"
        />
      </div>
      <button
        class="cyber-btn btn-primary toggle-filters-btn"
        @click="showFilters = !showFilters"
      >
        {{ showFilters ? "CHIUDI FILTRI" : "FILTRI AVANZATI" }}
      </button>
    </div>

    <!-- Advanced filters panel (toggle) -->
    <Transition name="fade-slide">
      <div v-if="showFilters" class="glass-panel filter-panel">
        <div class="filter-group">
          <label>Tipo</label>
          <div
            class="custom-dropdown"
            v-click-outside="() => (isTypeDropdownOpen = false)"
          >
            <div
              class="dropdown-trigger"
              @click.stop="isTypeDropdownOpen = !isTypeDropdownOpen"
            >
              <span
                class="dot"
                :style="{
                  backgroundColor: selectedTypeOption?.color || 'transparent',
                  opacity: selectedType ? 1 : 0,
                }"
              ></span>
              {{ selectedTypeOption?.label || "Tutti" }}
              <span class="arrow" :class="{ open: isTypeDropdownOpen }">▼</span>
            </div>
            <Transition name="slide-up">
              <div v-if="isTypeDropdownOpen" class="dropdown-menu glass-panel">
                <div
                  v-for="t in types"
                  :key="t.value"
                  class="dropdown-item"
                  :class="{ active: selectedType === t.value }"
                  @click.stop="selectType(t.value)"
                >
                  <span
                    class="dot"
                    :style="{
                      backgroundColor: t.color,
                      opacity: t.value ? 1 : 0,
                    }"
                  ></span>
                  {{ t.label }}
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <div class="filter-group">
          <label>Ordina Per</label>
          <div
            class="custom-dropdown"
            v-click-outside="() => (isSortDropdownOpen = false)"
          >
            <div
              class="dropdown-trigger"
              @click.stop="isSortDropdownOpen = !isSortDropdownOpen"
            >
              {{ sortOptions.find((o) => o.value === sortBy)?.label }}
              <span class="arrow" :class="{ open: isSortDropdownOpen }">▼</span>
            </div>
            <Transition name="slide-up">
              <div v-if="isSortDropdownOpen" class="dropdown-menu glass-panel">
                <div
                  v-for="o in sortOptions"
                  :key="o.value"
                  class="dropdown-item"
                  :class="{ active: sortBy === o.value }"
                  @click.stop="selectSort(o.value)"
                >
                  {{ o.label }}
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <div class="filter-group">
          <label>Max ET: {{ filterEt >= 10 ? "∞" : filterEt }}</label>
          <input
            v-model.number="filterEt"
            type="range"
            min="0"
            max="10"
            step="1"
            class="glass-range"
          />
        </div>

        <div class="filter-group">
          <label>Max PEP: {{ filterPep >= 10 ? "10+" : filterPep }}</label>
          <input
            v-model.number="filterPep"
            type="range"
            min="0"
            max="10"
            step="1"
            class="glass-range"
          />
        </div>

        <div class="filter-group">
          <label>Max RP: {{ filterRp >= 10 ? "10+" : filterRp }}</label>
          <input
            v-model.number="filterRp"
            type="range"
            min="0"
            max="10"
            step="1"
            class="glass-range"
          />
        </div>

        <div class="filter-group">
          <button
            @click="
              searchQuery = '';
              selectedType = '';
              filterEt = 10;
              filterPep = 10;
              filterRp = 10;
              sortBy = 'id';
            "
            class="cyber-btn btn-danger small"
          >
            RESET
          </button>
        </div>
      </div>
    </Transition>

    <div v-if="loading" class="glass-panel main-panel text-center">
      <h3>Sincronizzazione in corso...</h3>
      <div class="loader"></div>
    </div>

    <div v-else-if="error" class="glass-panel auth-panel text-center">
      <h3 class="text-red">ERRORE IT</h3>
      <p>Sincronizzazione fallita. Ricaricare la Matrice.</p>
    </div>

    <div v-else class="cards-grid">
      <div
        v-for="card in paginatedCards"
        :key="card.id"
        class="glass-panel card-item"
        @click="selectedCard = card"
      >
        <div class="card-header stacked">
          <h3>{{ card.name }}</h3>
          <span class="badge" :class="card.type?.toLowerCase()"
            >{{ card.type }} | {{ card.status }}</span
          >
        </div>
        <div class="card-image-container">
          <img
            :src="card.image_url"
            :alt="card.name"
            class="card-img"
            @error="handleImgError"
          />
        </div>
      </div>
    </div>

    <!-- Pagination controls -->
    <div v-if="totalPages > 1" class="pagination-controls fade-in">
      <button
        class="cyber-btn btn-primary pag-btn"
        :disabled="currentPage === 1"
        @click="
          currentPage--;
          scrollToTop();
        "
      >
        <svg viewBox="0 0 16 16" class="pag-btn-icon" aria-hidden="true">
          <path
            d="M9.5 3.5L5 8l4.5 4.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        PREV
      </button>

      <div class="page-info">
        <span>PAGINA</span>
        <span class="current-page">{{ currentPage }}</span>
        <span>DI {{ totalPages }}</span>
      </div>

      <button
        class="cyber-btn btn-primary pag-btn"
        :disabled="currentPage === totalPages"
        @click="
          currentPage++;
          scrollToTop();
        "
      >
        NEXT
        <svg viewBox="0 0 16 16" class="pag-btn-icon" aria-hidden="true">
          <path
            d="M6.5 3.5L11 8l-4.5 4.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <!-- Zoom modal via Teleport to avoid positioning issues -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="selectedCard"
          class="modal-overlay"
          @click.self="selectedCard = null"
        >
          <div class="modal-content glass-panel">
            <button class="close-btn" @click="selectedCard = null">
              &times;
            </button>
            <div class="modal-body">
              <div class="modal-image-container">
                <img
                  :src="selectedCard.image_url"
                  :alt="selectedCard.name"
                  @error="handleImgError"
                />
              </div>
              <div class="modal-info">
                <h2>{{ selectedCard.name }}</h2>
                <div class="badge-row">
                  <span
                    class="badge"
                    :class="selectedCard.type?.toLowerCase()"
                    >{{ selectedCard.type }}</span
                  >
                  <span class="rarity-badge">{{ selectedCard.rarity }}</span>
                </div>
                <p class="modal-effect">{{ selectedCard.effect }}</p>
                <div class="modal-stats">
                  <div class="stat-box">
                    <strong>ET</strong
                    ><span>{{ selectedCard.cost_et ?? "-" }}</span>
                  </div>
                  <div class="stat-box">
                    <strong>PEP</strong
                    ><span>{{ selectedCard.pep ?? "-" }}</span>
                  </div>
                  <div class="stat-box">
                    <strong>RP</strong><span>{{ selectedCard.rp ?? "-" }}</span>
                  </div>
                </div>
                <p v-if="selectedCard.role" class="modal-role">
                  Ruolo: {{ selectedCard.role }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@import "../assets/card-badge-types.css";
@import "../assets/card-modal-shared.css";

.glitch-text {
  margin-bottom: 3.5rem !important;
}
.cards-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  text-align: center;
  padding: clamp(1rem, 3vw, 2rem);
  padding-bottom: clamp(2rem, 6vw, 4rem);
  min-height: calc(100vh - 120px);
}
.cards-view h1 {
  font-size: clamp(2.2rem, 5vw, 3.5rem);
  font-family: var(--font-display);
  letter-spacing: clamp(0.18rem, 1vw, 0.5rem);
  background: linear-gradient(135deg, #fff 0%, var(--accent-gold) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: clamp(2rem, 5vw, 3.5rem);
  text-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
}
.subtitle {
  margin-bottom: 2rem;
}
.text-center {
  text-align: center;
}
.text-red {
  color: var(--accent-magenta);
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
  width: 100%;
  max-width: 1400px;
  margin: 0 auto 3rem auto;
}
.card-item {
  padding: 1rem;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.card-item:hover {
  transform: translateY(-8px);
  border-color: var(--accent-gold);
  box-shadow: 0 10px 30px rgba(212, 175, 55, 0.18);
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
  font-size: 1.2rem;
  color: var(--text-main);
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
}

/* Filters */
.search-container {
  display: flex;
  justify-content: center;
  align-items: stretch;
  flex-wrap: wrap;
  gap: clamp(0.75rem, 2vw, 1rem);
  max-width: 900px;
  margin: 1rem auto clamp(2rem, 6vw, 4rem) auto;
  padding-inline: clamp(0rem, 1vw, 0.5rem);
}
.search-box {
  position: relative;
  flex: 1 1 320px;
  min-width: min(100%, 280px);
}
.search-icon {
  display: none;
}
.search-input {
  padding-left: 1.5rem !important;
  font-size: clamp(1rem, 2vw, 1.1rem);
  height: var(--control-height);
  width: 100%;
}
.toggle-filters-btn {
  height: var(--control-height);
  padding: 0 clamp(1rem, 3vw, 1.5rem);
  white-space: nowrap;
  flex: 0 1 220px;
  width: min(100%, 260px);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.filter-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
  padding: clamp(1rem, 2.5vw, 1.5rem);
  margin: calc(clamp(2rem, 6vw, 4rem) * -1) auto clamp(2rem, 6vw, 4rem) auto;
  max-width: 1200px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  align-items: stretch;
  border-radius: 12px;
  border: 1px solid rgba(212, 175, 55, 0.22);
  position: relative;
  z-index: 100;
  text-align: left;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}
.filter-group label {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 600;
}
.glass-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: var(--glass-border);
  border-radius: 2px;
  outline: none;
}
.glass-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 15px;
  height: 15px;
  background: var(--accent-gold);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px var(--accent-gold);
}

.badge {
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-main);
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: 1px;
}
.badge.plasma {
  background: rgba(220, 53, 69, 0.2);
  border-bottom: 2px solid #dc3545;
  color: #ff80a0;
}
.badge.costruttore {
  background: rgba(255, 215, 0, 0.2);
  border-bottom: 2px solid #ffd700;
  color: #fff080;
}

.card-stats strong {
  font-size: 0.8rem;
}
.card-effect p {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #ccd6f6;
  flex-grow: 1;
}
.card-role {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 0.5rem;
  font-style: italic;
}

.card-image-container {
  margin-top: auto;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  border: 1px dashed rgba(255, 255, 255, 0.05);
}

.custom-dropdown {
  position: relative;
  width: 100%;
  min-width: 180px;
}
.dropdown-trigger {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: var(--text-main);
  padding: 0.6rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-family: var(--font-body);
  transition: all 0.3s ease;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dropdown-trigger:hover {
  border-color: var(--accent-gold);
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
  border: 1px solid var(--accent-gold);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8);
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
}
.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}
.dropdown-item.active {
  background: rgba(212, 175, 55, 0.12);
  color: var(--accent-gold);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 5px currentColor;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.card-img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
}
.missing-image::after {
  content: "Nessuna Scansione Immagine";
  font-family: var(--font-display);
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.loader {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: var(--accent-gold);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.modal-role {
  font-size: 0.9rem;
  color: var(--text-muted);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1rem;
}
/* Pagination Styles */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: clamp(0.75rem, 3vw, 2rem);
  margin: clamp(2rem, 6vw, 4rem) 0;
  padding: clamp(1rem, 2.5vw, 1.5rem) clamp(0.5rem, 2vw, 1.5rem);
}
.page-info {
  display: flex;
  align-items: center;
  gap: clamp(0.4rem, 1vw, 0.8rem);
  font-family: var(--font-display);
  font-size: clamp(0.75rem, 2vw, 0.9rem);
  letter-spacing: 1px;
}
.current-page {
  font-size: clamp(1.1rem, 3vw, 1.4rem);
  color: #fff;
  text-shadow: 0 0 10px var(--accent-gold);
  padding: 0 0.5rem;
}
.pag-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.pag-btn-icon {
  width: 0.85rem;
  height: 0.85rem;
  flex: 0 0 auto;
}
</style>
