<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import api from "../utils/api";
import { useNotificationStore } from "../stores/notificationStore";
import { useAuthStore } from "../stores/auth";
import { normalizeNewsCategory, type NewsCategory } from "../utils/newsCategory";
import AdminNewsForm from "../components/admin/AdminNewsForm.vue";
import AdminNewsList from "../components/admin/AdminNewsList.vue";

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

type FormData = {
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: "news" | "storia";
  imageUrl: string;
  sourceUrl: string;
  publishedAt: string;
  isPublished: boolean;
  isFeatured: boolean;
  featuredOrder: number | null;
};

const notifications = useNotificationStore();
const authStore = useAuthStore();

// --- Data ---
const newsList = ref<NewsItem[]>([]);
const isLoading = ref(false);

async function loadNews() {
  isLoading.value = true;
  try {
    const res = await api.get("/news/admin/all");
    newsList.value = res.data.map((item: NewsItem) => ({
      ...item,
      category: normalizeNewsCategory(item.category),
    }));
  } finally {
    isLoading.value = false;
  }
}

// --- Form ---
const emptyForm = (): FormData => ({
  slug: "",
  title: "",
  summary: "",
  content: "",
  category: "news",
  imageUrl: "",
  sourceUrl: "",
  publishedAt: new Date().toISOString().slice(0, 16),
  isPublished: true,
  isFeatured: false,
  featuredOrder: null,
});

const showForm = ref(false);
const isEditing = ref(false);
const editingSlug = ref("");
const form = reactive<FormData>(emptyForm());
const formError = ref("");
const imagePreviewError = ref(false);
const selectedImageFile = ref<File | null>(null);
const isUploadingImage = ref(false);

const isImageUrlValid = computed(() => {
  const value = form.imageUrl.trim();
  if (!value) return true;
  const isLocalPath =
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    value.startsWith("news/");
  if (isLocalPath) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
});

const canSubmitForm = computed(() => isImageUrlValid.value);

watch(() => form.imageUrl, () => { imagePreviewError.value = false; });
watch(() => form.isFeatured, (isFeatured) => {
  if (!isFeatured) form.featuredOrder = null;
});

function openCreate() {
  Object.assign(form, emptyForm());
  isEditing.value = false;
  editingSlug.value = "";
  formError.value = "";
  imagePreviewError.value = false;
  selectedImageFile.value = null;
  showForm.value = true;
}

function openEdit(item: NewsItem) {
  Object.assign(form, {
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    content: item.content,
    category: normalizeNewsCategory(item.category),
    imageUrl: item.imageUrl,
    sourceUrl: item.sourceUrl,
    publishedAt: item.publishedAt.slice(0, 16),
    isPublished: item.isPublished,
    isFeatured: item.isFeatured,
    featuredOrder: item.featuredOrder,
  });
  isEditing.value = true;
  editingSlug.value = item.slug;
  formError.value = "";
  imagePreviewError.value = false;
  selectedImageFile.value = null;
  showForm.value = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeForm() {
  showForm.value = false;
  formError.value = "";
  imagePreviewError.value = false;
  selectedImageFile.value = null;
}

async function submitForm() {
  formError.value = "";
  if (!form.slug || !form.title || !form.summary || !form.content) {
    formError.value = "Slug, titolo, sommario e contenuto sono obbligatori.";
    return;
  }
  if (!isImageUrlValid.value) {
    formError.value = "URL immagine non valido. Usa /news/... o un link completo http(s).";
    return;
  }
  const payload = {
    ...form,
    publishedAt: new Date(form.publishedAt).toISOString(),
    featuredOrder:
      form.isFeatured && form.featuredOrder !== null
        ? Number(form.featuredOrder)
        : null,
  };
  try {
    if (isEditing.value) {
      await api.put(`/news/${editingSlug.value}`, payload);
      notifications.success("News aggiornata nella Matrice.");
    } else {
      await api.post("/news", payload);
      notifications.success("News creata con successo.");
      closeForm();
    }
    await loadNews();
  } catch {
    // Managed via global notification infrastructure
  }
}

function onImageFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  selectedImageFile.value = target.files?.[0] || null;
}

async function uploadImageFile() {
  if (!selectedImageFile.value) {
    notifications.warn("Seleziona prima un file immagine.");
    return;
  }
  const data = new FormData();
  data.append("image", selectedImageFile.value);
  isUploadingImage.value = true;
  try {
    const response = await api.post("/news/admin/upload-image", data);
    form.imageUrl = response.data.imageUrl;
    notifications.success("Immagine caricata. URL sincronizzato.");
    selectedImageFile.value = null;
  } finally {
    isUploadingImage.value = false;
  }
}

// --- List actions ---
async function togglePublished(item: NewsItem) {
  try {
    await api.put(`/news/${item.slug}`, { isPublished: !item.isPublished });
    notifications.success(
      `Visibilità aggiornata: ${item.isPublished ? "Nascosto" : "Pubblicato"}`
    );
    await loadNews();
  } catch {
    // Managed via global notification infrastructure
  }
}

const confirmDeleteSlug = ref("");

async function deleteNews(slug: string) {
  if (confirmDeleteSlug.value !== slug) {
    confirmDeleteSlug.value = slug;
    return;
  }
  confirmDeleteSlug.value = "";
  try {
    await api.delete(`/news/${slug}`);
    notifications.success("Voce di news decomposta dai database Atlas.");
    await loadNews();
  } catch {
    // Managed via global notification infrastructure
  }
}

function cancelDelete() {
  confirmDeleteSlug.value = "";
}

function logout() {
  authStore.logout();
  window.location.href = "/";
}

onMounted(loadNews);
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <span class="admin-logo">JOULE — PANNELLO NEWS</span>
      <div class="admin-header-right">
        <a href="/" class="admin-link">
          <svg viewBox="0 0 16 16" class="admin-link-icon" aria-hidden="true">
            <path
              d="M9.5 3.5L5 8l4.5 4.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>Torna al sito</span>
        </a>
        <button class="admin-btn btn-ghost" @click="logout">Esci</button>
      </div>
    </header>

    <main class="admin-main">
      <AdminNewsForm
        v-if="showForm"
        :form="form"
        :is-editing="isEditing"
        :can-submit-form="canSubmitForm"
        :is-image-url-valid="isImageUrlValid"
        :image-preview-error="imagePreviewError"
        :is-uploading-image="isUploadingImage"
        :form-error="formError"
        @update:form="Object.assign(form, $event)"
        @submit="submitForm"
        @cancel="closeForm"
        @image-file-change="onImageFileChange"
        @upload-image="uploadImageFile"
        @image-preview-error="imagePreviewError = true"
      />

      <AdminNewsList
        :news-list="newsList"
        :is-loading="isLoading"
        :show-form="showForm"
        :confirm-delete-slug="confirmDeleteSlug"
        @open-create="openCreate"
        @open-edit="openEdit"
        @toggle-published="togglePublished"
        @delete-news="deleteNews"
        @cancel-delete="cancelDelete"
      />
    </main>
  </div>
</template>

<style>
.admin-page {
  min-height: 100vh;
  background: var(--bg-dark, #0a0e1a);
  color: var(--text-light, #e2e8f0);
  font-family: var(--font-body, sans-serif);
  display: flex;
  flex-direction: column;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.admin-logo {
  font-family: var(--font-display, monospace);
  font-size: 0.9rem;
  letter-spacing: 3px;
  color: var(--accent-gold, #fedc68);
}

.admin-header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-muted, #94a3b8);
  text-decoration: none;
  font-size: 0.85rem;
}

.admin-link-icon {
  width: 0.85rem;
  height: 0.85rem;
  flex: 0 0 auto;
}

.admin-main {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.admin-section {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.admin-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-section-header h2 {
  margin: 0;
  font-family: var(--font-display, monospace);
  font-size: 0.95rem;
  letter-spacing: 2px;
  color: var(--accent-gold, #fedc68);
}

.admin-count {
  font-family: var(--font-body, sans-serif);
  color: var(--text-muted, #94a3b8);
  font-size: 0.85rem;
  letter-spacing: 0;
}

.admin-form-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 1.5rem;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.form-row label {
  font-size: 0.82rem;
  color: var(--text-muted, #94a3b8);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.form-hint {
  font-size: 0.76rem;
  color: rgba(148, 163, 184, 0.65);
  font-weight: 400;
}

.form-error-inline {
  font-size: 0.76rem;
  color: #f87171;
}

.upload-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.upload-input {
  flex: 1;
  min-width: 0;
}

.image-preview-wrap {
  margin-top: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
}

.image-preview {
  display: block;
  width: 100%;
  max-height: 260px;
  object-fit: cover;
}

.form-row-inline {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-row-inline--compact {
  align-items: end;
}

.form-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.88rem;
  color: var(--text-muted, #94a3b8);
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.news-row {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 6px;
  padding: 0.9rem 1rem;
  transition: border-color 0.2s;
}

.news-row:hover {
  border-color: rgba(0, 229, 255, 0.25);
}

.news-row--draft {
  opacity: 0.6;
  border-style: dashed;
}

.news-row-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.news-row-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.news-row-title {
  font-size: 0.95rem;
  color: var(--text-light, #e2e8f0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.news-row-meta {
  font-size: 0.78rem;
  color: var(--text-muted, #94a3b8);
}

.news-row-meta a {
  color: var(--accent-gold, #fedc68);
  text-decoration: none;
}

.news-row-meta code {
  background: rgba(0, 229, 255, 0.08);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.75rem;
  color: var(--accent-gold, #fedc68);
}

.news-row-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.news-badge {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 99px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.badge-pub {
  background: rgba(0, 229, 255, 0.12);
  color: var(--accent-gold, #fedc68);
  border: 1px solid rgba(0, 229, 255, 0.3);
}

.badge-draft {
  background: rgba(148, 163, 184, 0.1);
  color: var(--text-muted, #94a3b8);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.badge-featured {
  background: rgba(255, 190, 92, 0.12);
  color: #ffd892;
  border: 1px solid rgba(255, 205, 120, 0.25);
}

.badge-news {
  background: rgba(0, 229, 255, 0.12);
  color: var(--accent-gold, #fedc68);
  border: 1px solid rgba(0, 229, 255, 0.28);
}

.badge-storia {
  background: rgba(0, 255, 150, 0.12);
  color: #00ff96;
  border: 1px solid rgba(0, 255, 150, 0.28);
}

.delete-confirm-text {
  font-size: 0.8rem;
  color: #f87171;
}

.admin-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 5px;
  color: var(--text-light, #e2e8f0);
  padding: 0.55rem 0.75rem;
  font-size: 0.9rem;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.admin-input:focus {
  outline: none;
  border-color: var(--accent-gold, #fedc68);
}

.admin-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.admin-textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 5px;
  color: var(--text-light, #e2e8f0);
  padding: 0.55rem 0.75rem;
  font-size: 0.9rem;
  font-family: var(--font-body, sans-serif);
  resize: vertical;
  line-height: 1.6;
  box-sizing: border-box;
}

.admin-textarea:focus {
  outline: none;
  border-color: var(--accent-gold, #fedc68);
}

.admin-btn {
  padding: 0.5rem 1rem;
  border-radius: 5px;
  border: 1px solid transparent;
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.admin-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent-gold, #fedc68);
  color: #0a0e1a;
  font-weight: 700;
  border-color: var(--accent-gold, #fedc68);
}

.btn-primary:hover:not(:disabled) {
  background: #33ecff;
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted, #94a3b8);
  border-color: rgba(255, 255, 255, 0.15);
}

.btn-ghost:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.35);
  color: var(--text-light, #e2e8f0);
}

.btn-danger {
  background: transparent;
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.35);
}

.btn-danger:hover:not(:disabled) {
  background: rgba(248, 113, 113, 0.12);
}

.btn-sm {
  padding: 0.3rem 0.65rem;
  font-size: 0.78rem;
}

.admin-muted {
  color: var(--text-muted, #94a3b8);
  font-size: 0.88rem;
  margin: 0;
}

.admin-error {
  color: #f87171;
  font-size: 0.85rem;
  margin: 0;
}

.admin-success {
  color: #4ade80;
  font-size: 0.85rem;
  margin: 0;
}

@media (max-width: 600px) {
  .form-row-inline {
    grid-template-columns: 1fr;
  }

  .upload-row {
    flex-direction: column;
    align-items: stretch;
  }

  .news-row-main {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
