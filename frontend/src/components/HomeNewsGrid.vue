<script setup lang="ts">
import { resolveNewsImage } from "../utils/imageResolver";
import {
  getNewsCategoryLabel,
  isStoryCategory,
  type NewsCategory,
} from "../utils/newsCategory";

type NewsPreview = {
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

interface Props {
  news: NewsPreview[];
}

defineProps<Props>();

const formatNewsDate = (value: string) =>
  new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
</script>

<template>
  <section class="news-section">
    <div class="news-section-header">
      <h3>ULTIME NEWS</h3>
      <RouterLink to="/news" class="news-header-link">
        <span>Vai all'archivio completo</span>
        <svg viewBox="0 0 16 16" class="news-header-link-icon" aria-hidden="true">
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
    </div>

    <div v-if="news.length" class="news-grid">
      <article
        v-for="item in news"
        :key="item.id"
        class="glass-panel news-card"
        :class="{ 'news-card--featured': item.isFeatured }"
      >
        <div class="news-badges-row">
          <div
            class="news-category-badge"
            :class="
              isStoryCategory(item.category)
                ? 'news-category-badge--lore'
                : 'news-category-badge--news'
            "
          >
            {{ getNewsCategoryLabel(item.category, { uppercase: true }) }}
          </div>
          <div v-if="item.isFeatured" class="news-badge">IN EVIDENZA</div>
        </div>
        <img
          v-if="item.imageUrl"
          :src="resolveNewsImage(item.imageUrl)"
          :alt="item.title"
          width="800"
          height="450"
          class="news-cover"
          loading="lazy"
          decoding="async"
        />
        <p class="news-date">{{ formatNewsDate(item.publishedAt) }}</p>
        <h4>{{ item.title }}</h4>
        <p class="news-summary">{{ item.summary }}</p>
        <div class="news-actions">
          <RouterLink :to="`/news/${item.slug}`" class="link-text">
            <span>Leggi la news completa</span>
            <svg viewBox="0 0 16 16" class="link-icon" aria-hidden="true">
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
            v-if="item.sourceUrl"
            :href="item.sourceUrl"
            class="news-source-link"
            target="_blank"
            rel="noopener noreferrer"
          >Fonte esterna</a>
        </div>
      </article>
    </div>

    <div v-else class="glass-panel news-empty">
      Nessuna news disponibile al momento.
    </div>
  </section>
</template>

<style scoped>
.news-section {
  margin-top: 2.6rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  transform: translateZ(0);
  contain: paint;
}

.news-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.news-section-header h3 {
  margin: 0;
  font-family: var(--font-display);
  letter-spacing: 2px;
  color: var(--accent-gold);
  font-size: 1rem;
}

.news-header-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.news-header-link-icon {
  width: 0.9rem;
  height: 0.9rem;
  flex: 0 0 auto;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: clamp(0.85rem, 2vw, 1rem);
  max-width: 100%;
}

@media (min-width: 900px) {
  .news-grid { grid-template-columns: repeat(3, 1fr); }
}

.news-card {
  padding: 1.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.news-card--featured {
  border-color: rgba(255, 205, 120, 0.24);
  box-shadow: 0 0 0 1px rgba(255, 205, 120, 0.14) inset;
}

.news-badge {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #ffd892;
  background: rgba(255, 190, 92, 0.12);
  border: 1px solid rgba(255, 205, 120, 0.2);
  border-radius: 999px;
  padding: 0.18rem 0.5rem;
}

.news-badges-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.news-category-badge {
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.85px;
  border-radius: 999px;
  padding: 0.18rem 0.52rem;
}

.news-category-badge--news {
  color: var(--accent-gold);
  background: rgba(254, 220, 104, 0.12);
  border: 1px solid rgba(254, 220, 104, 0.26);
}

.news-category-badge--lore {
  color: #00ff96;
  background: rgba(0, 255, 150, 0.12);
  border: 1px solid rgba(0, 255, 150, 0.26);
}

.news-cover {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.news-date {
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.6px;
  color: rgba(226, 232, 240, 0.72);
}

.news-card h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-light);
  line-height: 1.4;
}

.news-summary {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.6;
  font-size: 0.92rem;
}

.news-actions {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.news-source-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.8rem;
}

.news-empty {
  padding: 1.2rem 1.4rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.link-text {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--accent-gold);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
  margin-top: auto;
}

.link-icon {
  width: 0.9rem;
  height: 0.9rem;
  flex: 0 0 auto;
}
</style>
