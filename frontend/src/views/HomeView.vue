<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useHead } from "@unhead/vue";
import api from "../utils/api";
import { type NewsCategory } from "../utils/newsCategory";
import HeroSection from "../components/HeroSection.vue";
import HomeDashboard from "../components/HomeDashboard.vue";
import HomeNewsGrid from "../components/HomeNewsGrid.vue";
import StarterDeckGallery from "../components/StarterDeckGallery.vue";

useHead({
  title: "Joule: Zero Point - Il Gioco di Carte Sci-Fi Strategico",
  meta: [
    {
      name: "description",
      content:
        "Entra nel Punto Zero. Manipola il tempo e la materia in un mondo Sci-Fi e sfida la realtà in questo gioco di carte strategico unico.",
    },
    {
      property: "og:title",
      content: "Joule: Zero Point - Card Game Strategico",
    },
    {
      property: "og:description",
      content:
        "Domina il Passato, Presente e Futuro. Un'esperienza di gioco Sci-Fi strategica basata sulla termodinamica.",
    },
    {
      name: "twitter:title",
      content: "Joule: Zero Point - Il Tempo è la tua Arma",
    },
  ],
});

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

const authStore = useAuthStore();
const fragmentCount = ref(120);
const isAuthenticated = computed(() => authStore.isLoggedIn);
const latestNews = ref<NewsPreview[]>([]);

// Staged rendering: defer non-critical sections to prioritize LCP/FCP
const isDashboardVisible = ref(false);
const isNewsVisible = ref(false);
const isDecksVisible = ref(false);

onMounted(async () => {
  // Defer API calls to avoid blocking initial paint
  setTimeout(async () => {
    try {
      const response = await api.get("/cards");
      fragmentCount.value = response.data.length;
    } catch { /* non-critical: fragment count falls back to default */ }

    try {
      const response = await api.get("/news", { params: { limit: 6 } });
      latestNews.value = response.data;
    } catch { /* non-critical: news grid stays empty */ }
  }, 800);

  const isMobile = window.innerWidth < 768;

  if (!isMobile) {
    isDashboardVisible.value = true;
    isNewsVisible.value = true;
    isDecksVisible.value = true;
  } else {
    setTimeout(() => { isDashboardVisible.value = true; }, 150);
    setTimeout(() => { isNewsVisible.value = true; }, 400);
    setTimeout(() => { isDecksVisible.value = true; }, 700);
  }
});
</script>

<template>
  <div class="home-view">
    <HeroSection />

    <div v-if="!isDashboardVisible" class="dashboard-placeholder"></div>
    <HomeDashboard
      v-if="isDashboardVisible"
      :fragment-count="fragmentCount"
      :is-authenticated="isAuthenticated"
      class="fade-in"
    />

    <div v-if="!isNewsVisible" class="news-placeholder"></div>
    <HomeNewsGrid
      v-if="isNewsVisible"
      :news="latestNews"
      class="fade-in"
    />

    <div v-if="!isDecksVisible" class="decks-placeholder"></div>
    <StarterDeckGallery v-if="isDecksVisible" class="fade-in" />
  </div>
</template>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(0.5rem, 3vw, 2rem) clamp(1.25rem, 3vw, 2rem);
}

/* Hydration placeholders — exact heights preserve CLS 0.00 */
.dashboard-placeholder { height: 750px; width: 100%; border-radius: 16px; margin-bottom: 2rem; }
.news-placeholder { height: 1600px; width: 100%; margin-top: 2.6rem; }
.decks-placeholder { height: 1800px; width: 100vw; margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw); }

@media (min-width: 768px) {
  .dashboard-placeholder { height: 260px; }
  .news-placeholder { height: 1000px; }
  .decks-placeholder { height: 850px; }
}
</style>
