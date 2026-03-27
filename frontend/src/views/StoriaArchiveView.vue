<script setup lang="ts">
import axios from "axios";
import { onMounted, ref } from "vue";
import { type NewsCategory } from "../utils/newsCategory";

type StoryPreview = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: NewsCategory;
  imageUrl: string;
  sourceUrl: string;
  publishedAt: string;
  isFeatured: boolean;
  featuredOrder: number | null;
};

const storyItems = ref<StoryPreview[]>([]);
const isLoading = ref(true);
const errorMessage = ref("");

const formatNewsDate = (value: string) =>
  new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

onMounted(async () => {
  try {
    const response = await axios.get("/api/news", {
      params: { category: "storia" },
    });
    storyItems.value = response.data;
  } catch (_error) {
    errorMessage.value = "Impossibile caricare l'archivio storia.";
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="story-archive-page fade-in">
    <header class="archive-header">
      <div>
        <p class="archive-kicker">ARCHIVIO STORIA</p>
        <h1>La storia del Punto Zero</h1>
        <p class="archive-subtitle">
          Approfondimenti narrativi, contesto del mondo di gioco e frammenti
          lore ordinati in timeline.
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

    <div v-if="isLoading" class="glass-panel archive-state">
      Caricamento storia…
    </div>
    <div v-else-if="errorMessage" class="glass-panel archive-state">
      {{ errorMessage }}
    </div>
    <div v-else-if="!storyItems.length" class="glass-panel archive-state">
      Nessun contenuto storia disponibile.
    </div>

    <section v-else class="archive-grid">
      <article
        v-for="story in storyItems"
        :key="story.id"
        class="glass-panel archive-card"
        :class="{ 'archive-card--featured': story.isFeatured }"
      >
        <div class="archive-badges-row">
          <div class="archive-category-badge archive-category-badge--storia">
            STORIA
          </div>
          <div v-if="story.isFeatured" class="archive-badge">IN EVIDENZA</div>
        </div>
        <img
          v-if="story.imageUrl"
          :src="story.imageUrl"
          :alt="story.title"
          class="archive-cover"
        />
        <p class="archive-date">{{ formatNewsDate(story.publishedAt) }}</p>
        <h2>{{ story.title }}</h2>
        <p class="archive-summary">{{ story.summary }}</p>
        <div class="archive-actions">
          <RouterLink :to="`/news/${story.slug}`" class="archive-primary-link">
            <span>Leggi la storia completa</span>
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
            v-if="story.sourceUrl"
            :href="story.sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="archive-secondary-link"
          >
            Fonte esterna
          </a>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.story-archive-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.6rem 2rem 2.4rem;
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
  color: #00ff96;
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

.archive-category-badge--storia {
  color: #00ff96;
  background: rgba(0, 255, 150, 0.12);
  border: 1px solid rgba(0, 255, 150, 0.26);
}

.archive-cover {
  width: 100%;
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
  color: var(--accent-cyan);
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
  .story-archive-page {
    padding: 1.2rem 1rem 1.8rem;
  }

  .archive-grid {
    grid-template-columns: 1fr;
  }
}
</style>
