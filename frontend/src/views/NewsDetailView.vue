<script setup lang="ts">
import axios from "axios";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";

type NewsDetail = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  sourceUrl: string;
  publishedAt: string;
  isFeatured: boolean;
  featuredOrder: number | null;
};

const route = useRoute();
const news = ref<NewsDetail | null>(null);
const isLoading = ref(true);
const errorMessage = ref("");

const formatNewsDate = (value: string) =>
  new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const paragraphs = computed(() =>
  (news.value?.content || "")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean),
);

onMounted(async () => {
  const slug = String(route.params.slug || "");

  if (!slug) {
    errorMessage.value = "News non valida.";
    isLoading.value = false;
    return;
  }

  try {
    const response = await axios.get(`/api/news/${slug}`);
    news.value = response.data;
  } catch (_error) {
    errorMessage.value = "La news richiesta non è disponibile.";
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="news-detail-page fade-in">
    <article v-if="news && !isLoading" class="glass-panel news-detail-card">
      <p class="news-meta">{{ formatNewsDate(news.publishedAt) }}</p>
      <div v-if="news.isFeatured" class="news-badge">NEWS IN EVIDENZA</div>
      <h1>{{ news.title }}</h1>
      <p class="news-summary">{{ news.summary }}</p>
      <img
        v-if="news.imageUrl"
        :src="news.imageUrl"
        :alt="news.title"
        class="news-image"
      />

      <div class="news-content">
        <p v-for="(paragraph, index) in paragraphs" :key="index">
          {{ paragraph }}
        </p>
      </div>

      <div class="news-detail-actions">
        <div class="news-detail-links">
          <RouterLink to="/" class="link-text">← Torna alla Home</RouterLink>
          <RouterLink to="/news" class="news-archive-link"
            >Archivio news</RouterLink
          >
        </div>
        <a
          v-if="news.sourceUrl"
          :href="news.sourceUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="news-source-link"
        >
          Vai alla fonte esterna
        </a>
      </div>
    </article>

    <div v-else-if="isLoading" class="glass-panel news-state">
      Caricamento news in corso...
    </div>

    <div v-else class="glass-panel news-state">
      <p>{{ errorMessage || "News non trovata." }}</p>
      <RouterLink to="/" class="link-text">← Torna alla Home</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.news-detail-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 1.8rem 2rem 2.2rem;
}

.news-detail-card {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.news-meta {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(226, 232, 240, 0.72);
  letter-spacing: 0.6px;
}

.news-detail-card h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 2.8vw, 2.1rem);
  line-height: 1.2;
  color: var(--text-light);
}

.news-summary {
  margin: 0;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.65;
  border-left: 2px solid var(--accent-cyan);
  padding-left: 0.85rem;
}

.news-badge {
  align-self: flex-start;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #ffd892;
  background: rgba(255, 190, 92, 0.12);
  border: 1px solid rgba(255, 205, 120, 0.2);
  border-radius: 999px;
  padding: 0.18rem 0.55rem;
}

.news-image {
  width: 100%;
  max-height: 430px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.news-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.news-content p {
  margin: 0;
  line-height: 1.75;
  color: var(--text-light);
}

.news-detail-actions {
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.news-detail-links {
  display: flex;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.news-archive-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.85rem;
}

.news-source-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.85rem;
}

.news-state {
  padding: 1.3rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .news-detail-page {
    padding: 1.2rem 1rem 1.8rem;
  }

  .news-detail-card {
    padding: 1.2rem;
  }
}
</style>
