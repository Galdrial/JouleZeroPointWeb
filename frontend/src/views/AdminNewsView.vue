<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import api from "../utils/api";
import { useNotificationStore } from "../stores/notificationStore";
import {
  getNewsCategoryLabel,
  isStoryCategory,
  normalizeNewsCategory,
  type NewsCategory,
} from "../utils/newsCategory";

/**
 * NewsItem Data Structure
 * Comprehensive model for news entries within the administrative matrix.
 */
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

/**
 * FormData Structure
 * Template for creating or modifying news artifacts.
 */
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

// --- Authentication & Access Control ---
const adminKey = ref(sessionStorage.getItem("adminKey") || "");
const keyInput = ref("");
const authError = ref("");
const isAuthenticated = computed(() => !!adminKey.value);

/**
 * Initiate Administrative Session
 * Persists the clearing key to session storage for matrix access.
 */
function login() {
  if (!keyInput.value.trim()) return;
  adminKey.value = keyInput.value.trim();
  sessionStorage.setItem("adminKey", adminKey.value);
  authError.value = "";
  loadNews();
}

/**
 * Terminate Administrative Session
 * Purges access keys and flushes the local news registry.
 */
function logout() {
  adminKey.value = "";
  sessionStorage.removeItem("adminKey");
  newsList.value = [];
}

// --- Data Orchestration ---
const newsList = ref<NewsItem[]>([]);
const isLoading = ref(false);
const notifications = useNotificationStore();

/**
 * Data Retrieval Protocol: Fetch Administrative News Registry
 * Synchronizes the dashboard with all news entries (published and drafts).
 */
async function loadNews() {
  isLoading.value = true;
  try {
    const res = await api.get("/news/admin/all");
    newsList.value = res.data.map((item: NewsItem) => ({
      ...item,
      category: normalizeNewsCategory(item.category),
    }));
  } catch (e: any) {
    if (e?.response?.status === 401) {
      notifications.error("Chiave amministrativa non valida.");
      adminKey.value = "";
      sessionStorage.removeItem("adminKey");
    }
  } finally {
    isLoading.value = false;
  }
}

// --- Editorial Form Orchestration ---

/**
 * Form Blueprint Initialization
 * Generates an empty schema for new news entries.
 */
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

/**
 * Validation Logic: Asset URI Integrity
 * Ensures image paths conform to local or remote protocol standards.
 */
const isImageUrlValid = computed(() => {
  const value = form.imageUrl.trim();
  if (!value) return true;

  const isLocalPath =
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    value.startsWith("news/");

  if (isLocalPath) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
});

const canSubmitForm = computed(() => isImageUrlValid.value);

// --- Observers for State Hygiene ---
watch(
  () => form.imageUrl,
  () => {
    imagePreviewError.value = false;
  },
);

watch(
  () => form.isFeatured,
  (isFeatured) => {
    if (!isFeatured) {
      form.featuredOrder = null;
    }
  },
);

/**
 * UI Support: Handle asset hydration failure
 */
function onImagePreviewError() {
  imagePreviewError.value = true;
}

/**
 * Change Listener: Buffer selected image file
 */
function onImageFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  selectedImageFile.value = target.files?.[0] || null;
}

/**
 * Asset Persistence Protocol: Upload Image to Matrix
 * Bridges to the Multer-powered backend endpoint for image storage.
 */
async function uploadImageFile() {
  if (!selectedImageFile.value) {
    notifications.warn("Seleziona prima un file immagine.");
    return;
  }

  const data = new FormData();
  data.append("image", selectedImageFile.value);

  isUploadingImage.value = true;
  try {
    const response = await api.post("/news/admin/upload-image", data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    form.imageUrl = response.data.imageUrl;
    notifications.success("Immagine caricata. URL sincronizzato.");
    selectedImageFile.value = null;
  } catch (e: any) {
    // Managed via global notification infrastructure
  } finally {
    isUploadingImage.value = false;
  }
}

/**
 * Editorial Sequence: Open Creation Perspective
 */
function openCreate() {
  Object.assign(form, emptyForm());
  isEditing.value = false;
  editingSlug.value = "";
  formError.value = "";
  imagePreviewError.value = false;
  selectedImageFile.value = null;
  showForm.value = true;
}

/**
 * Editorial Sequence: Open Modification Perspective
 * Populates the form with existing news artifact data.
 */
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

/**
 * UI State Hygiene: Close editorial perspective
 */
function closeForm() {
  showForm.value = false;
  formError.value = "";
  imagePreviewError.value = false;
  selectedImageFile.value = null;
}

/**
 * Execution Protocol: Persist Editorial Changes
 * Transmits the news artifact payload to the central repository.
 */
async function submitForm() {
  formError.value = "";

  // Structural Validation
  if (!form.slug || !form.title || !form.summary || !form.content) {
    formError.value = "Slug, titolo, sommario e contenuto sono obbligatori.";
    return;
  }

  if (!isImageUrlValid.value) {
    formError.value =
      "URL immagine non valido. Usa /news/... o un link completo http(s).";
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
  } catch (e: any) {
    // Managed via global notification infrastructure
  }
}

// --- Operational Sequences: Lifecycle & Decommissioning ---

/**
 * Toggle Visibility Status
 */
async function togglePublished(item: NewsItem) {
  try {
    await api.put(`/news/${item.slug}`, { isPublished: !item.isPublished });
    notifications.success(`Visibilità aggiornata: ${item.isPublished ? "Nascosto" : "Pubblicato"}`);
    await loadNews();
  } catch {
    // Managed via global notification infrastructure
  }
}

const confirmDeleteSlug = ref("");

/**
 * Decommission Protocol: Delete News Artifact
 * Requires dual-phase confirmation to prevent accidental loss of lore data.
 */
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

/**
 * Decommission Hygiene: Cancel deletion intent
 */
function cancelDelete() {
  confirmDeleteSlug.value = "";
}

/**
 * Utility: Standard Date Serialization
 */
function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

onMounted(() => {
  if (isAuthenticated.value) loadNews();
});
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <span class="admin-logo">JOULE — PANNELLO NEWS</span>
      <div v-if="isAuthenticated" class="admin-header-right">
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

    <!-- LOGIN -->
    <div v-if="!isAuthenticated" class="admin-login-wrap">
      <div class="admin-login-box">
        <h2>Accesso Admin</h2>
        <p class="admin-muted">
          Inserisci la chiave admin configurata in <code>.env</code>
        </p>
        <form class="admin-login-form" @submit.prevent="login">
          <input
            v-model="keyInput"
            type="password"
            placeholder="ADMIN_KEY"
            class="admin-input"
            autocomplete="current-password"
          />
          <button type="submit" class="admin-btn btn-primary">Accedi</button>
        </form>
        <p v-if="authError" class="admin-error">{{ authError }}</p>
      </div>
    </div>

    <!-- PANNELLO -->
    <main v-else class="admin-main">
      <!-- FORM -->
      <section v-if="showForm" class="admin-section admin-form-section">
        <div class="admin-section-header">
          <h2>{{ isEditing ? "Modifica news" : "Nuova news" }}</h2>
          <button class="admin-btn btn-ghost" @click="closeForm">
            Annulla
          </button>
        </div>

        <div class="admin-form">
          <div class="form-row">
            <label>Slug (URL)</label>
            <input
              v-model="form.slug"
              :disabled="isEditing"
              type="text"
              class="admin-input"
              placeholder="es. aggiornamento-maggio"
            />
            <span class="form-hint"
              >Solo lettere minuscole, numeri e trattini</span
            >
          </div>

          <div class="form-row">
            <label>Titolo</label>
            <input v-model="form.title" type="text" class="admin-input" />
          </div>

          <div class="form-row">
            <label
              >Sommario <span class="form-hint">(visibile in home)</span></label
            >
            <textarea v-model="form.summary" class="admin-textarea" rows="2" />
          </div>

          <div class="form-row">
            <label
              >Contenuto
              <span class="form-hint"
                >(paragrafi separati da riga vuota)</span
              ></label
            >
            <textarea v-model="form.content" class="admin-textarea" rows="8" />
          </div>

          <div class="form-row">
            <label>Categoria</label>
            <select v-model="form.category" class="admin-input">
              <option value="news">News</option>
              <option value="storia">Storia</option>
            </select>
          </div>

          <div class="form-row">
            <label>URL immagine (opzionale)</label>
            <input
              v-model="form.imageUrl"
              type="url"
              class="admin-input"
              placeholder="/news/cover.jpg oppure https://.../cover.jpg"
            />
            <div class="upload-row">
              <input
                type="file"
                accept="image/*"
                class="admin-input upload-input"
                @change="onImageFileChange"
              />
              <button
                type="button"
                class="admin-btn btn-ghost"
                :disabled="isUploadingImage"
                @click="uploadImageFile"
              >
                {{ isUploadingImage ? "Caricamento..." : "Carica immagine" }}
              </button>
            </div>
            <span
              v-if="form.imageUrl && !isImageUrlValid"
              class="form-error-inline"
            >
              URL non valido. Inserisci `/news/...` oppure un link completo
              `http(s)://...`.
            </span>
            <div
              v-if="form.imageUrl && isImageUrlValid && !imagePreviewError"
              class="image-preview-wrap"
            >
              <img
                :src="form.imageUrl"
                alt="Anteprima immagine news"
                class="image-preview"
                @error="onImagePreviewError"
              />
            </div>
            <span
              v-if="form.imageUrl && imagePreviewError"
              class="form-error-inline"
            >
              Impossibile caricare l'immagine da questo URL.
            </span>
          </div>

          <div class="form-row-inline">
            <div class="form-row">
              <label>Link fonte (opzionale)</label>
              <input
                v-model="form.sourceUrl"
                type="url"
                class="admin-input"
                placeholder="https://..."
              />
            </div>
            <div class="form-row">
              <label>Data pubblicazione</label>
              <input
                v-model="form.publishedAt"
                type="datetime-local"
                class="admin-input"
              />
            </div>
          </div>

          <label class="form-toggle">
            <input v-model="form.isPublished" type="checkbox" />
            <span>Pubblicata</span>
          </label>

          <div class="form-row-inline form-row-inline--compact">
            <label class="form-toggle">
              <input v-model="form.isFeatured" type="checkbox" />
              <span>Metti in evidenza</span>
            </label>

            <div class="form-row">
              <label>Ordine evidenza</label>
              <input
                v-model.number="form.featuredOrder"
                :disabled="!form.isFeatured"
                type="number"
                min="1"
                class="admin-input"
                placeholder="1 = massima priorità"
              />
            </div>
          </div>

          <div class="form-actions">
            <p v-if="formError" class="admin-error">{{ formError }}</p>
            <button
              class="admin-btn btn-primary"
              :disabled="!canSubmitForm"
              @click="submitForm"
            >
              {{ isEditing ? "Salva modifiche" : "Crea news" }}
            </button>
          </div>
        </div>
      </section>

      <!-- LIST -->
      <section class="admin-section">
        <div class="admin-section-header">
          <h2>
            News <span class="admin-count">({{ newsList.length }})</span>
          </h2>
          <button
            v-if="!showForm"
            class="admin-btn btn-primary"
            @click="openCreate"
          >
            + Nuova news
          </button>
        </div>

        <p v-if="isLoading" class="admin-muted">Caricamento…</p>

        <div v-else-if="newsList.length === 0" class="admin-muted">
          Nessuna news presente.
        </div>

        <div v-else class="news-list">
          <div
            v-for="item in newsList"
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
                    :href="item.imageUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    >link</a
                  >
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
                  :class="
                    isStoryCategory(item.category)
                      ? 'badge-storia'
                      : 'badge-news'
                  "
                >
                  {{ getNewsCategoryLabel(item.category || "news") }}
                </span>
                <span v-if="item.isFeatured" class="news-badge badge-featured">
                  Evidenza
                  <template v-if="item.featuredOrder"
                    >#{{ item.featuredOrder }}</template
                  >
                </span>
                <button
                  class="admin-btn btn-ghost btn-sm"
                  @click="togglePublished(item)"
                >
                  {{ item.isPublished ? "Nascondi" : "Pubblica" }}
                </button>
                <button
                  class="admin-btn btn-ghost btn-sm"
                  @click="openEdit(item)"
                >
                  Modifica
                </button>

                <template v-if="confirmDeleteSlug === item.slug">
                  <span class="delete-confirm-text">Sicuro?</span>
                  <button
                    class="admin-btn btn-danger btn-sm"
                    @click="deleteNews(item.slug)"
                  >
                    Sì, elimina
                  </button>
                  <button
                    class="admin-btn btn-ghost btn-sm"
                    @click="cancelDelete"
                  >
                    No
                  </button>
                </template>
                <button
                  v-else
                  class="admin-btn btn-danger btn-sm"
                  @click="deleteNews(item.slug)"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
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

/* LOGIN */
.admin-login-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
}

.admin-login-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2.5rem 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-login-box h2 {
  margin: 0;
  font-family: var(--font-display, monospace);
  color: var(--accent-gold, #fedc68);
  letter-spacing: 2px;
  font-size: 1rem;
}

.admin-login-form {
  display: flex;
  gap: 0.6rem;
}

/* SECTIONS */
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

/* FORM */
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

.form-success-inline {
  font-size: 0.76rem;
  color: #4ade80;
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

/* NEWS LIST */
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

/* INPUTS */
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

/* BUTTONS */
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

.btn-primary:hover {
  background: #33ecff;
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted, #94a3b8);
  border-color: rgba(255, 255, 255, 0.15);
}

.btn-ghost:hover {
  border-color: rgba(255, 255, 255, 0.35);
  color: var(--text-light, #e2e8f0);
}

.btn-danger {
  background: transparent;
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.35);
}

.btn-danger:hover {
  background: rgba(248, 113, 113, 0.12);
}

.btn-sm {
  padding: 0.3rem 0.65rem;
  font-size: 0.78rem;
}

/* MISC */
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
