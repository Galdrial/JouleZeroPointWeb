<script setup lang="ts">
import {
  getNewsCategoryLabel,
  isStoryCategory,
  type NewsCategory,
} from "../../utils/newsCategory";
import { resolveNewsImage } from "../../utils/imageResolver";

type NewsItem = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  imageUrl: string;
  sourceUrl: string;
  publishedAt: string;
  isPublished: boolean;
  isFeatured: boolean;
  featuredOrder: number | null;
};

const props = defineProps<{
  newsList: NewsItem[];
  isLoading: boolean;
  showForm: boolean;
  confirmDeleteSlug: string;
}>();

const emit = defineEmits<{
  (e: "open-create"): void;
  (e: "open-edit", item: NewsItem): void;
  (e: "toggle-published", item: NewsItem): void;
  (e: "delete-news", slug: string): void;
  (e: "cancel-delete"): void;
}>();

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <section class="admin-section">
    <div class="admin-section-header">
      <h2>
        News <span class="admin-count">({{ props.newsList.length }})</span>
      </h2>
      <button
        v-if="!props.showForm"
        class="admin-btn btn-primary"
        @click="emit('open-create')"
      >
        + Nuova news
      </button>
    </div>

    <p v-if="props.isLoading" class="admin-muted">Caricamento…</p>

    <div v-else-if="props.newsList.length === 0" class="admin-muted">
      Nessuna news presente.
    </div>

    <div v-else class="news-list">
      <div
        v-for="item in props.newsList"
        :key="item.id"
        class="news-row"
        :class="{ 'news-row--draft': !item.isPublished }"
      >
        <div class="news-row-main">
          <div class="news-row-info">
            <span class="news-row-title">{{ item.title }}</span>
            <span class="news-row-meta">
              {{ formatDate(item.publishedAt) }} &nbsp;·&nbsp;
              <code>/news/{{ item.slug }}</code>
            </span>
            <span v-if="item.imageUrl" class="news-row-meta">
              immagine:
              <a
                :href="resolveNewsImage(item.imageUrl)"
                target="_blank"
                rel="noopener noreferrer"
              >link</a>
            </span>
          </div>
          <div class="news-row-actions">
            <span
              class="news-badge"
              :class="item.isPublished ? 'badge-pub' : 'badge-draft'"
            >
              {{ item.isPublished ? "Pubblicata" : "Bozza" }}
            </span>
            <span
              class="news-badge"
              :class="isStoryCategory(item.category) ? 'badge-storia' : 'badge-news'"
            >
              {{ getNewsCategoryLabel(item.category || "news") }}
            </span>
            <span v-if="item.isFeatured" class="news-badge badge-featured">
              Evidenza
              <template v-if="item.featuredOrder">#{{ item.featuredOrder }}</template>
            </span>
            <button
              class="admin-btn btn-ghost btn-sm"
              @click="emit('toggle-published', item)"
            >
              {{ item.isPublished ? "Nascondi" : "Pubblica" }}
            </button>
            <button
              class="admin-btn btn-ghost btn-sm"
              @click="emit('open-edit', item)"
            >
              Modifica
            </button>

            <template v-if="props.confirmDeleteSlug === item.slug">
              <span class="delete-confirm-text">Sicuro?</span>
              <button
                class="admin-btn btn-danger btn-sm"
                @click="emit('delete-news', item.slug)"
              >
                Sì, elimina
              </button>
              <button
                class="admin-btn btn-ghost btn-sm"
                @click="emit('cancel-delete')"
              >
                No
              </button>
            </template>
            <button
              v-else
              class="admin-btn btn-danger btn-sm"
              @click="emit('delete-news', item.slug)"
            >
              Elimina
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
