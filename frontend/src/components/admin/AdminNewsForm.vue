<script setup lang="ts">
import { resolveNewsImage } from "../../utils/imageResolver";

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

const props = defineProps<{
  form: FormData;
  isEditing: boolean;
  canSubmitForm: boolean;
  isImageUrlValid: boolean;
  imagePreviewError: boolean;
  isUploadingImage: boolean;
  formError: string;
}>();

const emit = defineEmits<{
  (e: "submit"): void;
  (e: "cancel"): void;
  (e: "image-file-change", event: Event): void;
  (e: "upload-image"): void;
  (e: "image-preview-error"): void;
}>();
</script>

<template>
  <section class="admin-section admin-form-section">
    <div class="admin-section-header">
      <h2>{{ props.isEditing ? "Modifica news" : "Nuova news" }}</h2>
      <button class="admin-btn btn-ghost" @click="emit('cancel')">
        Annulla
      </button>
    </div>

    <div class="admin-form">
      <div class="form-row">
        <label>Slug (URL)</label>
        <input
          v-model="props.form.slug"
          :disabled="props.isEditing"
          type="text"
          class="admin-input"
          placeholder="es. aggiornamento-maggio"
        />
        <span class="form-hint">Solo lettere minuscole, numeri e trattini</span>
      </div>

      <div class="form-row">
        <label>Titolo</label>
        <input v-model="props.form.title" type="text" class="admin-input" />
      </div>

      <div class="form-row">
        <label>Sommario <span class="form-hint">(visibile in home)</span></label>
        <textarea v-model="props.form.summary" class="admin-textarea" rows="2" />
      </div>

      <div class="form-row">
        <label>
          Contenuto
          <span class="form-hint">(paragrafi separati da riga vuota)</span>
        </label>
        <textarea v-model="props.form.content" class="admin-textarea" rows="8" />
      </div>

      <div class="form-row">
        <label>Categoria</label>
        <select v-model="props.form.category" class="admin-input">
          <option value="news">News</option>
          <option value="storia">Storia</option>
        </select>
      </div>

      <div class="form-row">
        <label>URL immagine (opzionale)</label>
        <input
          v-model="props.form.imageUrl"
          type="text"
          class="admin-input"
          placeholder="/news/cover.jpg oppure https://.../cover.jpg"
        />
        <div class="upload-row">
          <input
            type="file"
            accept="image/*"
            class="admin-input upload-input"
            @change="emit('image-file-change', $event)"
          />
          <button
            type="button"
            class="admin-btn btn-ghost"
            :disabled="props.isUploadingImage"
            @click="emit('upload-image')"
          >
            {{ props.isUploadingImage ? "Caricamento..." : "Carica immagine" }}
          </button>
        </div>
        <span
          v-if="props.form.imageUrl && !props.isImageUrlValid"
          class="form-error-inline"
        >
          URL non valido. Inserisci `/news/...` oppure un link completo `http(s)://...`.
        </span>
        <div
          v-if="props.form.imageUrl && props.isImageUrlValid && !props.imagePreviewError"
          class="image-preview-wrap"
        >
          <img
            :src="resolveNewsImage(props.form.imageUrl)"
            alt="Anteprima immagine news"
            class="image-preview"
            @error="emit('image-preview-error')"
          />
        </div>
        <span
          v-if="props.form.imageUrl && props.imagePreviewError"
          class="form-error-inline"
        >
          Impossibile caricare l'immagine da questo URL.
        </span>
      </div>

      <div class="form-row-inline">
        <div class="form-row">
          <label>Link fonte (opzionale)</label>
          <input
            v-model="props.form.sourceUrl"
            type="url"
            class="admin-input"
            placeholder="https://..."
          />
        </div>
        <div class="form-row">
          <label>Data pubblicazione</label>
          <input
            v-model="props.form.publishedAt"
            type="datetime-local"
            class="admin-input"
          />
        </div>
      </div>

      <label class="form-toggle">
        <input v-model="props.form.isPublished" type="checkbox" />
        <span>Pubblicata</span>
      </label>

      <div class="form-row-inline form-row-inline--compact">
        <label class="form-toggle">
          <input v-model="props.form.isFeatured" type="checkbox" />
          <span>Metti in evidenza</span>
        </label>

        <div class="form-row">
          <label>Ordine evidenza</label>
          <input
            v-model.number="props.form.featuredOrder"
            :disabled="!props.form.isFeatured"
            type="number"
            min="1"
            class="admin-input"
            placeholder="1 = massima priorità"
          />
        </div>
      </div>

      <div class="form-actions">
        <p v-if="props.formError" class="admin-error">{{ props.formError }}</p>
        <button
          class="admin-btn btn-primary"
          :disabled="!props.canSubmitForm"
          @click="emit('submit')"
        >
          {{ props.isEditing ? "Salva modifiche" : "Crea news" }}
        </button>
      </div>
    </div>
  </section>
</template>
