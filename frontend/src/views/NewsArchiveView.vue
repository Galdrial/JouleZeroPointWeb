<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../utils/api";
import {
  getNewsCategoryLabel,
  isStoryCategory,
  type NewsCategory,
} from "../utils/newsCategory";
import { resolveNewsImage } from "../utils/imageResolver";

/**
 * NewsPreview Data Structure
 * Minimal projection of news content for archival display.
 */
type NewsPreview = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: NewsCategory;
  imageUrl: string;
  sourceUrl: string;
  publishedAt: string; // ISO date string
  isFeatured: boolean;
  featuredOrder: number | null;
};

// Global Store & State Initialization
const route = useRoute();
const router = useRouter();
const newsItems = ref<NewsPreview[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");
const activeFilter = ref("all");

/**
 * Navigation Pulse: Synchronizes URL state with the selected Hub filter.
 * This ensures the Navbar and browser history remain aligned with the matrix state.
 * @param filter The category slug to navigate to.
 */
const updateFilter = (filter: string) => {
  const query = filter === "all" ? {} : { category: filter };
  router.push({ path: "/news", query });
};

/**
 * Synchronization Protocol: Fetch news items based on selected category filter.
 * @param filter The category slug to filter by, or 'all' for full registry retrieval.
 */
const fetchNews = async (filter: string) => {
  isLoading.value = true;
  activeFilter.value = filter;
  try {
    const params: Record<string, string> = {};
    if (filter !== "all") {
      params.category = filter;
    }
    const response = await api.get("/news", { params });
    newsItems.value = response.data;
  } catch {
    errorMessage.value = "Impossibile sincronizzare l'archivio centrale.";
  } finally {
    isLoading.value = false;
  }
};

/**
 * Date Localization Bridge
 * Formats ISO strings into human-readable Italian locale markers.
 * @param value ISO date string
 */
const formatNewsDate = (value: string) =>
  new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

onMounted(() => {
  const initialCategory = route.query.category as string;
  fetchNews(initialCategory || "all");
});

// Reactivity Bridge: Update filter when URL parameters shift
watch(() => route.query.category, (newCat) => {
  fetchNews((newCat as string) || "all");
});
</script>

<template>
  <div class="news-archive-page fade-in">
    <header class="archive-header">
      <div>
        <p class="archive-kicker">ARCHIVIO CENTRALE</p>
        <h1>Hub delle Comunicazioni</h1>
        <p class="archive-subtitle">
          Il registro unificato di Joule: Zero Point. Esplora aggiornamenti di gioco, roadmap e frammenti di storia del mondo.
        </p>
      </div>
      <RouterLink to="/" class="archive-link archive-link--back">
        <svg viewBox="0 0 16 16" class="archive-link-icon" aria-hidden="true">
          <path
            d="M9.5 3.5L5 8l4.5 4.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>Torna alla Home</span>
      </RouterLink>
    </header>

    <div class="archive-filters">
      <button 
        class="filter-btn" 
        :class="{ 'active': activeFilter === 'all' }"
        @click="updateFilter('all')"
      >
        TUTTE LE FREQUENZE
      </button>
      <button 
        class="filter-btn filter-btn--news" 
        :class="{ 'active': activeFilter === 'news' }"
        @click="updateFilter('news')"
      >
        STABILIZZAZIONE (NEWS)
      </button>
      <button 
        class="filter-btn filter-btn--lore" 
        :class="{ 'active': activeFilter === 'storia' }"
        @click="updateFilter('storia')"
      >
        FRAMMENTI (STORIA)
      </button>
    </div>

    <div class="archive-main-content" :class="{ 'is-syncing': isLoading }">
      <div v-if="errorMessage" class="glass-panel archive-state">
        {{ errorMessage }}
      </div>
      <div v-else-if="!newsItems.length && !isLoading" class="glass-panel archive-state">
        Nessun segnale rilevato per questa categoria.
      </div>

      <TransitionGroup 
        name="list" 
        tag="section" 
        class="archive-grid"
      >
        <article
          v-for="news in newsItems"
          :key="news.id"
          class="glass-panel archive-card"
          :class="{ 'archive-card--featured': news.isFeatured }"
        >
          <div class="archive-badges-row">
            <div
              class="archive-category-badge"
              :class="
                isStoryCategory(news.category)
                  ? 'archive-category-badge--lore'
                  : 'archive-category-badge--news'
              "
            >
              {{ getNewsCategoryLabel(news.category, { uppercase: true }) }}
            </div>
            <div v-if="news.isFeatured" class="archive-badge">IN EVIDENZA</div>
          </div>
          <img
            v-if="news.imageUrl"
            :src="resolveNewsImage(news.imageUrl)"
            :alt="news.title"
            class="archive-cover"
          />
          <p class="archive-date">{{ formatNewsDate(news.publishedAt) }}</p>
          <h2>{{ news.title }}</h2>
          <p class="archive-summary">{{ news.summary }}</p>
          <div class="archive-actions">
            <RouterLink :to="`/news/${news.slug}`" class="archive-primary-link">
              <span>Leggi la news completa</span>
              <svg
                viewBox="0 0 16 16"
                class="archive-link-icon"
                aria-hidden="true"
              >
                <path
                  d="M6.5 3.5L11 8l-4.5 4.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </RouterLink>
            <a
              v-if="news.sourceUrl"
              :href="news.sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="archive-secondary-link"
            >
              Fonte esterna
            </a>
          </div>
        </article>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.news-archive-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.6rem 2rem 2.4rem;
}

.archive-main-content {
  position: relative;
}

.archive-main-content.is-syncing .archive-grid {
  opacity: 0.6;
  pointer-events: none;
}

.archive-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.8rem;
}

.archive-kicker {
  margin: 0 0 0.45rem;
  color: var(--accent-gold);
  letter-spacing: 2px;
  font-family: var(--font-display);
  font-size: 0.8rem;
}

.archive-header h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3vw, 2.4rem);
  line-height: 1.15;
}

.archive-subtitle {
  margin: 0.7rem 0 0;
  max-width: 720px;
  color: var(--text-muted);
  line-height: 1.7;
}

.archive-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2.2rem;
  flex-wrap: wrap;
}

.filter-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  color: var(--text-muted);
  padding: 0.6rem 1.4rem;
  border-radius: 4px;
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-main);
  transform: translateY(-2px);
}

.filter-btn.active {
  background: rgba(254, 220, 104, 0.1);
  border-color: var(--accent-gold);
  color: var(--accent-gold);
  box-shadow: 0 0 15px rgba(254, 220, 104, 0.2);
  text-shadow: 0 0 8px rgba(254, 220, 104, 0.4);
}

.filter-btn--lore.active {
  background: rgba(0, 255, 150, 0.1);
  border-color: #00ff96;
  color: #00ff96;
  box-shadow: 0 0 15px rgba(0, 255, 150, 0.2);
  text-shadow: 0 0 8px rgba(0, 255, 150, 0.4);
}

.archive-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.archive-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.1rem;
  min-height: 50vh;
  position: relative;
}

.archive-card {
  position: relative;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.archive-card--featured {
  border-color: rgba(255, 205, 120, 0.28);
  box-shadow: 0 0 0 1px rgba(255, 205, 120, 0.14) inset;
}

.archive-badge {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #ffd892;
  background: rgba(255, 190, 92, 0.12);
  border: 1px solid rgba(255, 205, 120, 0.2);
  border-radius: 999px;
  padding: 0.18rem 0.5rem;
}

.archive-badges-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.archive-category-badge {
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.85px;
  border-radius: 999px;
  padding: 0.18rem 0.52rem;
}

.archive-category-badge--news {
  color: var(--accent-gold);
  background: rgba(254, 220, 104, 0.12);
  border: 1px solid rgba(254, 220, 104, 0.26);
}

.archive-category-badge--lore {
  color: #00ff96;
  background: rgba(0, 255, 150, 0.12);
  border: 1px solid rgba(0, 255, 150, 0.26);
}

.archive-cover {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.archive-date {
  margin: 0;
  color: rgba(226, 232, 240, 0.72);
  font-size: 0.76rem;
}

.archive-card h2 {
  margin: 0;
  font-size: 1rem;
  line-height: 1.4;
}

.archive-summary {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.65;
  font-size: 0.92rem;
}

.archive-actions {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.archive-primary-link {
  color: var(--accent-gold);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.archive-link-icon {
  width: 0.9rem;
  height: 0.9rem;
  flex: 0 0 auto;
}

.archive-secondary-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.8rem;
}

.archive-state {
  padding: 1.2rem 1.4rem;
  color: var(--text-muted);
}

@media (max-width: 980px) {
  .archive-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .news-archive-page {
    padding: 1.2rem 1rem 1.8rem;
  }

  .archive-grid {
    grid-template-columns: 1fr;
  }
}

/* --- Quantum Shift Transitions (List Animation) --- */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

/* Smooth Reordering */
.list-move {
  transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Ensure leaving items don't block layout during transition */
.list-leave-active {
  position: absolute;
  width: calc(33.333% - 0.75rem); /* Proportional to grid columns */
  z-index: 0;
}

@media (max-width: 980px) {
  .list-leave-active {
    width: calc(50% - 0.6rem);
  }
}

@media (max-width: 640px) {
  .list-leave-active {
    width: calc(100% - 2rem);
  }
}
</style>
