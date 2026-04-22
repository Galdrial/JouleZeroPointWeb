<script setup lang="ts">
import { ref } from "vue";
import { vClickOutside } from "../utils/directives";
import type { Card } from "../stores/cardStore";
import type { SavedDeck } from "../stores/deckStore";

interface Props {
  decks: SavedDeck[];
  loading: boolean;
  totalDecks: number;
  costruttori: Card[];
  isExporting: boolean;
  exportingId: string | number | null;
  exportingFormat: "pdf" | "tts" | null;
  currentPage: number;
  limit: number;
  search: string;
  filterCostruttore: number | "";
}

const props = defineProps<Props>();
const emit = defineEmits<{
  create: [];
  edit: [deck: SavedDeck];
  delete: [id: string | number];
  export: [id: string | number, format: "pdf" | "tts"];
  "update:currentPage": [page: number];
  "update:search": [q: string];
  "update:filterCostruttore": [id: number | ""];
}>();

const isCostruttoreDropdownOpen = ref(false);

const totalPages = () => Math.ceil(props.totalDecks / props.limit);

const selectCostruttore = (id: number | "") => {
  emit("update:filterCostruttore", id);
  isCostruttoreDropdownOpen.value = false;
};

const handleImgError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = "none";
};

const getCostruttoreName = (id: number | string | null): string =>
  props.costruttori.find((c) => String(c.id) === String(id))?.name || "Unknown";

const getCostruttoreImg = (id: number | string | null): string =>
  props.costruttori.find((c) => String(c.id) === String(id))?.image_url || "";
</script>

<template>
  <div class="dashboard-container">
    <h1 class="main-title">I MIEI MAZZI</h1>

    <div class="top-actions">
      <button @click="emit('create')" class="cyber-btn btn-primary huge">
        NUOVO MAZZO
      </button>
    </div>

    <div class="search-container">
      <div class="search-box">
        <input
          :value="search"
          @input="emit('update:search', ($event.target as HTMLInputElement).value)"
          placeholder="Cerca mazzo..."
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
            "Costruttore"
          }}
          <span class="arrow" :class="{ open: isCostruttoreDropdownOpen }">▼</span>
        </div>
        <Transition name="slide-up">
          <div v-if="isCostruttoreDropdownOpen" class="dropdown-menu glass-panel">
            <div
              class="dropdown-item"
              :class="{ active: filterCostruttore === '' }"
              @click.stop="selectCostruttore('')"
            >
              <span class="dot" style="background: transparent; opacity: 0"></span>
              Tutti
            </div>
            <div
              v-for="c in costruttori"
              :key="c.id"
              class="dropdown-item"
              :class="{ active: filterCostruttore === c.id }"
              @click.stop="selectCostruttore(c.id)"
            >
              <span class="dot" style="background: #ffd700; box-shadow: 0 0 5px #ffd700"></span>
              {{ c.name.split(",")[0] }}
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
      <div
        v-for="d in decks"
        :key="d.id"
        class="deck-card glass-panel"
        @click="emit('edit', d)"
      >
        <!-- TOP ROW: Name and Delete -->
        <div class="deck-top-row">
          <div class="deck-title-row">
            <h3>{{ d.name }}</h3>
          </div>
          <button
            class="small-delete cyber-btn btn-danger mini"
            @click.stop="emit('delete', d.id!)"
            title="Elimina Mazzo"
          >
            <span class="trash-icon">×</span>
          </button>
        </div>

        <!-- ACTIONS ROW: PDF and TTS above image -->
        <div class="deck-actions-row">
          <button
            @click.stop="emit('export', d.id!, 'pdf')"
            class="cyber-export-btn pdf"
            :disabled="isExporting"
            title="Scarica PDF Decklist"
          >
            {{ exportingId === d.id && exportingFormat === "pdf" ? "GENERAZIONE..." : "PDF" }}
          </button>
          <button
            @click.stop="emit('export', d.id!, 'tts')"
            class="cyber-export-btn tts"
            :disabled="isExporting"
            title="Esporta per Tabletop Simulator"
          >
            {{ exportingId === d.id && exportingFormat === "tts" ? "GENERAZIONE..." : "TTS" }}
          </button>
        </div>

        <!-- HERO IMAGE -->
        <div class="deck-hero-container">
          <img
            :src="getCostruttoreImg(d.costruttoreId)"
            :alt="getCostruttoreName(d.costruttoreId)"
            class="deck-hero-img"
            @error="handleImgError"
          />
        </div>

        <!-- CAPTION -->
        <div class="deck-hero-caption">
          <span class="caption-name">{{ getCostruttoreName(d.costruttoreId) }}</span>
        </div>

        <!-- FOOTER ROW -->
        <div class="deck-footer-row">
          <span class="deck-privacy" :class="d.isPublic ? 'public' : 'private'">
            {{ d.isPublic ? "PUBBLICO" : "PRIVATO" }}
          </span>
          <div class="edit-hint">SINCRONIZZA ➔</div>
        </div>
      </div>

      <div v-if="decks.length === 0" class="empty-dashboard">
        <p>Nessun mazzo trovato nella matrice.</p>
      </div>
    </div>

    <div v-if="totalPages() > 1" class="pagination">
      <button
        :disabled="currentPage === 1"
        @click="emit('update:currentPage', currentPage - 1)"
        class="page-btn"
      >PREV</button>
      <span class="page-info">LINEA {{ currentPage }} / {{ totalPages() }}</span>
      <button
        :disabled="currentPage === totalPages()"
        @click="emit('update:currentPage', currentPage + 1)"
        class="page-btn"
      >NEXT</button>
    </div>
  </div>
</template>

<style scoped>
.main-title {
  text-align: center;
  font-size: 3.5rem;
  font-family: var(--font-display);
  letter-spacing: 0.5rem;
  background: linear-gradient(135deg, #fff 0%, var(--accent-gold) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0;
  text-shadow: 0 0 30px rgba(0, 240, 255, 0.3);
}

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
  box-shadow: 0 0 30px rgba(212, 175, 55, 0.22);
}

.search-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

.search-box { flex-grow: 1; }

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

.dropdown-trigger:hover { border-color: var(--accent-gold); }

.dropdown-trigger .arrow {
  margin-left: auto;
  font-size: 0.7rem;
  transition: transform 0.3s;
  color: #fff;
}

.dropdown-trigger .arrow.open { transform: rotate(180deg); }

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
  text-align: left;
}

.dropdown-item:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-main); }
.dropdown-item.active { background: rgba(212, 175, 55, 0.12); color: var(--accent-gold); }

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.stats-box { display: flex; align-items: center; }

.count-tag {
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid var(--accent-gold);
  padding: 0 1.2rem;
  height: 50px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: var(--font-display);
  color: var(--accent-gold);
  white-space: nowrap;
}

.slide-up-enter-active,
.slide-up-leave-active { transition: all 0.3s ease-out; }
.slide-up-enter-from,
.slide-up-leave-to { opacity: 0; transform: translateY(10px); }

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
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  background: rgba(255, 255, 255, 0.02);
}

.deck-card:hover {
  transform: translateY(-8px);
  border-color: var(--accent-gold);
  box-shadow: 0 15px 40px rgba(212, 175, 55, 0.18);
  background: rgba(255, 255, 255, 0.05);
}

.deck-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  min-height: 66px;
}

.deck-title-row {
  flex: 1;
  min-width: 0;
  min-height: 66px;
  padding-right: 0.6rem;
}

.deck-title-row h3 {
  font-family: var(--font-display);
  font-size: 1.45rem;
  line-height: 1.25;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--accent-gold);
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.deck-hero-container {
  width: 100%;
  height: 280px;
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
  object-fit: contain;
  transition: transform 0.5s ease;
}

.deck-card:hover .deck-hero-img { transform: scale(1.1); }

.deck-hero-caption {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0 0.5rem;
  min-height: 2.8rem;
}

.caption-name {
  font-size: 0.95rem;
  color: #fff;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.4;
  min-height: 2.8rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.deck-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.1rem;
  padding-top: 0.4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.deck-privacy {
  height: 32px;
  display: flex;
  align-items: center;
  font-size: 0.65rem;
  letter-spacing: 1px;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
}

.deck-privacy.public {
  background: rgba(212, 175, 55, 0.12);
  color: var(--accent-gold);
  border: 1px solid var(--accent-gold);
}

.deck-privacy.private {
  background: rgba(255, 159, 28, 0.14);
  color: var(--accent-magenta);
  border: 1px solid var(--accent-magenta);
}

.small-delete.cyber-btn.mini {
  flex-shrink: 0;
  width: 36px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 1.2rem;
  font-weight: 900;
  border-radius: 0;
  background: var(--accent-magenta);
  border: 1px solid var(--accent-magenta);
  color: #fff;
  transition: all 0.3s;
  cursor: pointer;
}

.small-delete.cyber-btn.mini:hover {
  background: #ff1f55;
  color: #fff;
  box-shadow: 0 0 10px currentColor;
  transform: scale(1.1);
}

.trash-icon { font-size: 1.4rem; line-height: 1; margin-top: -2px; }

.edit-hint {
  font-size: 0.75rem;
  letter-spacing: 1px;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.deck-card:hover .edit-hint { opacity: 1; color: var(--accent-gold); }

.pagination {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
}

.page-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--accent-gold);
  color: var(--accent-gold);
  padding: 0.8rem 1.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) { background: var(--accent-gold); color: #000; }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.deck-actions-row {
  display: flex;
  gap: 1rem;
  padding: 0 1.25rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.cyber-export-btn {
  flex: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--accent-gold);
  color: var(--accent-gold);
  font-family: var(--font-display);
  font-size: 0.75rem;
  padding: 0.35rem 0.8rem;
  cursor: pointer;
  letter-spacing: 1px;
  transition: all 0.3s;
  text-align: center;
  border-radius: 4px;
  text-transform: uppercase;
}

.cyber-export-btn.pdf { border-color: var(--accent-gold); color: var(--accent-gold); }
.cyber-export-btn.pdf:hover { background: var(--accent-gold); color: #000; box-shadow: 0 0 15px var(--accent-gold); }
.cyber-export-btn.tts { border-color: var(--accent-magenta); color: var(--accent-magenta); }
.cyber-export-btn.tts:hover { background: var(--accent-magenta); color: #fff; box-shadow: 0 0 15px var(--accent-magenta); }
.cyber-export-btn:disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }

@media (max-width: 768px) {
  .main-title { font-size: 2rem; letter-spacing: 0.12rem; }
  .dashboard-container { gap: 1rem; }
  .top-actions { justify-content: stretch; }
  .btn-primary.huge { width: 100%; padding: 0.95rem 1.2rem; font-size: 0.95rem; }
  .search-container { flex-direction: column; align-items: stretch; }
  .custom-dropdown { min-width: 100%; }
  .decks-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
  .deck-card { padding: 1rem; }
  .deck-title-row h3 { font-size: 1.15rem; }
  .deck-hero-container { height: 220px; }
  .pagination { width: 100%; flex-wrap: wrap; justify-content: center; gap: 0.75rem; }
  .page-info { width: 100%; text-align: center; order: -1; }
}

@media (max-width: 480px) {
  .decks-grid { grid-template-columns: 1fr; }
  .deck-hero-container { height: 200px; }
  .pagination { gap: 1rem; }
  .dropdown-item { padding: 0.85rem 0.9rem; gap: 0.7rem; font-size: 0.85rem; }
}
</style>
