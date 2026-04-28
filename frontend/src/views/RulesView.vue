<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useHead } from "@unhead/vue";
import { useNotificationStore } from "../stores/notificationStore";
import {
  getPublicRulebook,
  type PublicRulebook,
} from "../services/rulebookService";

const rulebook = ref<PublicRulebook | null>(null);
const isLoading = ref(true);
const isDownloading = ref(false);
const loadError = ref("");
const notifications = useNotificationStore();

const pageTitle = computed(
  () => rulebook.value?.seo.pageTitle || "Regolamento Ufficiale - Joule: Zero Point",
);
const pageDescription = computed(
  () =>
    rulebook.value?.seo.description ||
    "Consulta il regolamento ufficiale di Joule: Zero Point.",
);
const ogTitle = computed(
  () => rulebook.value?.seo.ogTitle || "Joule: Zero Point - Regolamento",
);
const ogDescription = computed(
  () =>
    rulebook.value?.seo.ogDescription ||
    "Direttive operative complete di Joule: Zero Point.",
);

useHead(() => ({
  title: pageTitle.value,
  meta: [
    {
      name: "description",
      content: pageDescription.value,
    },
    {
      property: "og:title",
      content: ogTitle.value,
    },
    {
      property: "og:description",
      content: ogDescription.value,
    },
  ],
}));

const handleDownload = async () => {
  if (isDownloading.value || !rulebook.value) return;

  isDownloading.value = true;
  notifications.info("Sincronizzazione in corso: accesso al sorgente ufficiale...");

  try {
    const { href, fileName } = rulebook.value.introduction.download;
    const link = document.createElement("a");
    link.href = href;
    link.setAttribute("download", fileName);
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifications.success("Acquisizione completata: sorgente ufficiale disponibile.");
  } catch (error) {
    console.error("Errore durante il download del regolamento:", error);
    notifications.error("ERRORE: impossibile recuperare il regolamento ufficiale.");
  } finally {
    isDownloading.value = false;
  }
};

onMounted(async () => {
  try {
    rulebook.value = await getPublicRulebook();
  } catch (error) {
    console.error("Errore durante il caricamento del regolamento:", error);
    loadError.value =
      "Il regolamento ufficiale non è raggiungibile dal backend in questo momento.";
    notifications.error("ERRORE: regolamento non sincronizzato.");
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="rules-view fade-in centered">
    <h1 class="glitch-text" data-text="REGOLAMENTO">REGOLAMENTO</h1>

    <section v-if="isLoading" class="glass-panel status-panel">
      <p class="status-title">&gt;_ SINCRONIZZAZIONE DEL RULEBOOK IN CORSO</p>
      <p class="status-copy">
        Il Terminale sta acquisendo la versione ufficiale del regolamento 6.0.
      </p>
    </section>

    <section v-else-if="loadError" class="glass-panel status-panel error-panel">
      <p class="status-title">&gt;_ DISALLINEAMENTO DI RETE</p>
      <p class="status-copy">{{ loadError }}</p>
    </section>

    <template v-else-if="rulebook">
      <section class="glass-panel intro-panel">
        <div class="intro-flex">
          <div class="intro-text">
            <p class="version-chip">v{{ rulebook.version }}</p>
            <h2>&gt;_ {{ rulebook.introduction.eyebrow }}</h2>
            <p class="copyright-notice">{{ rulebook.legalNotice }}</p>
            <p class="intro-copy">{{ rulebook.introduction.description }}</p>
          </div>
          <div class="intro-actions">
            <button
              class="cyber-btn btn-primary"
              :disabled="isDownloading"
              @click="handleDownload"
            >
              {{
                isDownloading
                  ? "SINCRONIZZAZIONE..."
                  : rulebook.introduction.download.label
              }}
            </button>
            <p class="download-note">
              Formato sorgente: {{ rulebook.introduction.download.format.toUpperCase() }}
            </p>
          </div>
        </div>
      </section>

      <div class="rules-grid">
        <article
          v-for="section in rulebook.sections"
          :key="section.id"
          class="glass-panel text-content wide-panel"
        >
          <h3 class="section-title">{{ section.title }}</h3>

          <div
            v-for="(block, blockIndex) in section.blocks"
            :key="`${section.id}-${blockIndex}`"
            class="rule-block"
          >
            <h4 v-if="block.title" class="block-title">{{ block.title }}</h4>
            <p v-if="block.body" class="rule-paragraph">{{ block.body }}</p>
            <ul v-if="block.items?.length" class="rule-list">
              <li v-for="item in block.items" :key="item">{{ item }}</li>
            </ul>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<style scoped>
.centered {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2.5rem);
  text-align: left;
}

.glitch-text {
  margin-bottom: 3rem !important;
  text-align: center;
  font-size: clamp(2.2rem, 5vw, 3.8rem);
  font-family: var(--font-display);
  letter-spacing: clamp(0.18rem, 1vw, 0.5rem);
  background: linear-gradient(135deg, #fff 0%, var(--accent-gold) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
}

.intro-panel,
.status-panel {
  margin-bottom: 2rem;
}

.intro-flex {
  display: flex;
  gap: 2rem;
  justify-content: space-between;
  align-items: flex-start;
}

.intro-text {
  flex: 1;
}

.intro-actions {
  display: grid;
  gap: 0.85rem;
  min-width: min(100%, 18rem);
  justify-items: start;
}

.version-chip {
  display: inline-flex;
  margin: 0 0 0.85rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid rgba(212, 175, 55, 0.35);
  border-radius: 999px;
  color: var(--accent-gold);
  font-size: 0.78rem;
  letter-spacing: 0.18rem;
  text-transform: uppercase;
  background: rgba(212, 175, 55, 0.08);
}

.copyright-notice {
  color: rgba(226, 232, 240, 0.78);
  font-size: 0.95rem;
}

.intro-copy,
.status-copy {
  margin: 0;
  color: rgba(226, 232, 240, 0.9);
  line-height: 1.75;
}

.status-title {
  margin: 0 0 0.65rem;
  color: var(--accent-gold);
  font-family: var(--font-display);
  letter-spacing: 0.08rem;
}

.error-panel {
  border-color: rgba(255, 76, 76, 0.3);
}

.download-note {
  margin: 0;
  color: rgba(226, 232, 240, 0.7);
  font-size: 0.85rem;
  letter-spacing: 0.08rem;
}

.rules-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.wide-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.text-content {
  padding: clamp(1.3rem, 2.5vw, 1.85rem);
}

.section-title {
  margin: 0;
  color: var(--accent-gold);
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.04rem;
}

.rule-block {
  display: grid;
  gap: 0.65rem;
}

.block-title {
  margin: 0;
  color: #f5f7ff;
  font-size: 1rem;
  font-weight: 700;
}

.rule-paragraph {
  margin: 0;
  color: rgba(226, 232, 240, 0.9);
  line-height: 1.8;
}

.rule-list {
  margin: 0;
  padding-left: 1.2rem;
  color: rgba(226, 232, 240, 0.9);
  line-height: 1.75;
  display: grid;
  gap: 0.55rem;
}

.rule-list li::marker {
  color: var(--accent-gold);
}

@media (max-width: 860px) {
  .intro-flex {
    flex-direction: column;
  }

  .intro-actions {
    width: 100%;
  }

  .intro-actions .cyber-btn {
    width: 100%;
  }
}
</style>
