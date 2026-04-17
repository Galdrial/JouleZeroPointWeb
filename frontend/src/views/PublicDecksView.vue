<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import { useAuthStore } from "../stores/auth";
import { useCardStore, type Card } from "../stores/cardStore";
import { useDeckStore, type PublicDeck } from "../stores/deckStore";
import { useNotificationStore } from "../stores/notificationStore";
import api from "../utils/api";
import { jsPDF } from "jspdf";
import JSZip from "jszip";


const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};


/**
 * CardRef Interface
 * Represents a reference to a card with its quantity within a deck.
 */
interface CardRef {
  cardId: number;
  count: number;
}

// Global Orchestration: Stores & Identity
const authStore = useAuthStore();
const username = computed(() => authStore.username);
const cardStore = useCardStore();
const deckStore = useDeckStore();
const notifications = useNotificationStore();

// State Reactive Refs: Derived from Pinia
const { cards: allCards } = storeToRefs(cardStore);
const { publicDecks: decks, loading } = storeToRefs(deckStore);

// Pagination & Registry Metadata
const totalDecks = ref(0);
const currentPage = ref(1);
const limit = 12;

// Search & Filter state
const searchQuery = ref("");
const filterCostruttore = ref<number | "">("");
const sortBy = ref<"recent" | "top" | "imports">("recent");

// UI Interactive State
const selectedDeck = ref<PublicDeck | null>(null);
const isCostruttoreDropdownOpen = ref(false);
const exportingId = ref<string | number | null>(null);
const exportingFormat = ref<"pdf" | "tts" | null>(null);
const isSortDropdownOpen = ref(false);

/**
 * Registry Lookup: Extract Constructor cards from the global manifest.
 */
const costruttori = computed(() =>
  (allCards.value as Card[]).filter((c) => c.type === "Costruttore"),
);

// Sorting Config for Discovery
const sortOptions = [
  { value: "recent", label: "Recent" },
  { value: "top", label: "Top Rated" },
  { value: "imports", label: "Most Imported" },
] as const;

/**
 * Label Resolution: Resolve friendly names for dropdown triggers.
 */
const selectedCostruttoreLabel = computed(() => {
  if (filterCostruttore.value === "") return "Constructor";
  return (
    costruttori.value
      .find((costruttore) => costruttore.id === filterCostruttore.value)
      ?.name.split(",")[0] || "Constructor"
  );
});

const selectedSortLabel = computed(
  () => sortOptions.find((option) => option.value === sortBy.value)?.label,
);

const totalPages = computed(() => Math.ceil(totalDecks.value / limit));

/**
 * Custom Directive: Detect clicks outside the target element.
 * Used for dropdown closing protocols.
 */
const vClickOutside = {
  mounted(el: any, binding: any) {
    el.clickOutsideEvent = (event: any) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.body.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted(el: any) {
    document.body.removeEventListener("click", el.clickOutsideEvent);
  },
};

/**
 * Registry Resolution: Map Constructor ID to Nominal identity.
 */
const getCostruttoreName = (id: number | string | null) => {
  if (!id) return "Unknown";
  return (
    costruttori.value.find((c) => String(c.id) === String(id))?.name ||
    "Unknown"
  );
};

/**
 * Registry Resolution: Map Constructor ID to Asset URL.
 */
const getCostruttoreImg = (id: number | string | null) => {
  if (!id) return "";
  return (
    costruttori.value.find((c) => String(c.id) === String(id))?.image_url || ""
  );
};

/**
 * Deck Synthesis: Hydrate card references with full manifest data for preview.
 */
const previewCards = computed(() => {
  if (!selectedDeck.value) return [];
  return selectedDeck.value.cards
    .map((item: CardRef) => {
      const card = (allCards.value as Card[]).find(
        (c: Card) => String(c.id) === String(item.cardId),
      );
      return {
        cardId: item.cardId,
        count: item.count,
        name: card?.name || `Fragment #${item.cardId}`,
        type: card?.type || "Unknown",
      };
    })
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
});

/**
 * Discovery Protocol: Fetch Public Deck Registry
 * Transmits filter parameters and pagination markers to the API.
 */
const loadPublicDecks = async () => {
  const result = await deckStore.fetchPublicDecks({
    q: searchQuery.value,
    costruttoreId: filterCostruttore.value,
    sort: sortBy.value,
    page: currentPage.value,
    limit,
  });

  if (result) {
    totalDecks.value = result.total;
  }
};

/**
 * Engagement Protocol: Register Matrix Vote
 * Upvotes or downvotes a deck, synchronizing with the user's identity.
 */
const voteDeck = async (deck: PublicDeck) => {
  if (!username.value) {
    notifications.warn("Effettuare l'accesso per votare i mazzi.");
    return;
  }

  try {
    const response = await api.post(`/decks/${deck.id}/vote`);
    deck.votesCount = response.data.votesCount;
    deck.userVoted = response.data.userVoted;
    notifications.success(
      deck.userVoted ? "Voto registrato nella Matrice!" : "Voto rimosso.",
    );
  } catch (e: any) {
    // Managed via global notification infrastructure
  }
};

/**
 * Synchronization Protocol: Import Deck Artifact
 * Clones a public deck into the user's private repository.
 */
const importDeck = async (deck: PublicDeck) => {
  if (!username.value) {
    notifications.warn("Effettuare l'accesso per importare i mazzi.");
    return;
  }

  // Prevent recursive self-imports
  if (
    (deck.creator || "").trim().toLowerCase() ===
    username.value.trim().toLowerCase()
  ) {
    notifications.info(
      "Rilevata ricorsione: Non puoi importare i tuoi stessi mazzi.",
    );
    return;
  }

  try {
    const response = await api.post(`/decks/${deck.id}/import`);
    deck.importsCount += 1;
    const importedDeckName =
      response?.data?.importedDeck?.name || "Imported Deck";
    notifications.success(`Importazione riuscita: ${importedDeckName}`);
  } catch (e: any) {
    // Managed via global notification infrastructure
  }
};

/**
 * External Bridge: Trigger Asset Export (PDF/TTS)
 * Generates a file download sequence for the requested format.
 */
const handleExport = async (deckId: string | number, format: "pdf" | "tts") => {
  if (exportingId.value) return;
  exportingId.value = deckId;
  exportingFormat.value = format;
  notifications.info(
    `Inizializzazione protocollo ${format.toUpperCase()} locale... attendere.`
  );

  try {
    const deckInfo = decks.value.find((d: any) => 
      String(d.id || d._id) === String(deckId)
    );
    if (!deckInfo) throw new Error("Mazzo non trovato in cache.");
    
    const costruttoreCard = (allCards.value as Card[]).find((c) => String(c.id) === String(deckInfo.costruttoreId));
    
    if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setTextColor(254, 220, 104);
      doc.setFontSize(22);
      doc.text("JOULE: ZERO POINT - REGISTRO COSTRUTTORE", 105, 20, { align: "center" });

      doc.setFontSize(14);
      doc.setTextColor(255, 0, 60);
      doc.text(`NOME DISPOSITIVO: ${deckInfo.name.toUpperCase()}`, 105, 30, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(`COSTRUTTORE: ${costruttoreCard?.name || "Sconosciuto"}`, 20, 50);
      
      let y = 60;
      doc.setFont("helvetica", "normal");
      
      deckInfo.cards.forEach(dc => {
         const card = (allCards.value as Card[]).find(c => String(c.id) === String(dc.cardId));
         if (card) {
            const pep = card.pep !== null ? card.pep : 0;
            const rp = card.rp !== null ? card.rp : 0;
            doc.text(`${dc.count}x  ${card.name} (${card.type}) - PEP:${pep} RP:${rp}`, 20, y);
            y += 8;
            if (y > 280) {
              doc.addPage();
              y = 20;
            }
         }
      });
      
      doc.save(`Joule_PDF_Kit_${deckId}.pdf`);
    } else if (format === "tts") {
      const canvas = document.createElement("canvas");
      canvas.width = 4096;
      canvas.height = 4096;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Impossibile inizializzare rendering hardware locale.");
      
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, 4096, 4096);
      
      const cols = 10;
      const rows = 7;
      const slotW = 4096 / cols;
      const slotH = 4096 / rows;
      
      const imageSources: string[] = [];
      deckInfo.cards.forEach(dc => {
         const card = (allCards.value as Card[]).find(c => String(c.id) === String(dc.cardId));
         if (card && card.image_url) {
            for(let i = 0; i < dc.count; i++) imageSources.push(card.image_url);
         }
      });
      if (costruttoreCard?.image_url) {
         imageSources.push(costruttoreCard.image_url);
      }
      
      for (let i = 0; i < imageSources.length && i < cols * rows; i++) {
         try {
           const img = await loadImage(imageSources[i]);
           const col = i % cols;
           const row = Math.floor(i / cols);
           ctx.drawImage(img, col * slotW, row * slotH, slotW, slotH);
         } catch (e) {
           console.error("Failed to load asset:", imageSources[i]);
         }
      }
      
      const blob = await new Promise<Blob>((resolve, reject) => {
         canvas.toBlob((b) => b ? resolve(b) : reject(), "image/jpeg", 0.92);
      });
      
      const zip = new JSZip();
      zip.file("Fronte_Mazzo.jpg", blob);
      
      try {
        const backBlob = await fetch("/Retro_Ufficiale.png").then(r => r.blob());
        zip.file("Retro_Ufficiale.png", backBlob);
      } catch (e) {
        console.error("Retro missing");
      }
      
      zip.file("Leggimi_TTS.txt", `1. CARICAMENTO: Objects > Components > Cards > Custom Deck.
2. FACCIATE (Front): Seleziona 'Fronte_Mazzo.jpg'.
3. RETRO (Back): Seleziona 'Retro_Ufficiale.png'.
4. MATRICE: Height 7, Width 10.
5. NUMERO UNITA': 41.`);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(zipBlob);
      link.download = `Joule_TTS_Kit_${deckId}.zip`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    }
    
    notifications.success(
      `Sincronizzazione ${format.toUpperCase()} completata con successo!`
    );
  } catch (e: any) {
    console.error(e);
    notifications.error("IMPOSSIBILE SINCRONIZZARE I DATI DI ESPORTAZIONE.");
  } finally {
    exportingId.value = null;
    exportingFormat.value = null;
  }
};

/**
 * UI Perspective: Open granular deck preview modal.
 */
const openPreview = (deck: PublicDeck) => {
  selectedDeck.value = deck;
};

// Perspective Observers: Trigger reload on filter mutation.
watch([searchQuery, filterCostruttore, sortBy], () => {
  currentPage.value = 1;
  loadPublicDecks();
});

watch(currentPage, loadPublicDecks);

onMounted(async () => {
  // Initialization Sequence: Fetch global manifest and current registry sector.
  await Promise.all([cardStore.fetchCards(), loadPublicDecks()]);
});
</script>

<template>
  <div class="public-decks-view fade-in">
    <h1 class="main-title">MAZZI PUBBLICI</h1>

    <div class="search-container">
      <div class="search-box">
        <input
          v-model="searchQuery"
          placeholder="Cerca per nome o creatore..."
          class="glass-input search-input"
        />
      </div>

      <div
        class="custom-dropdown"
        v-click-outside="() => (isCostruttoreDropdownOpen = false)"
      >
        <div
          class="dropdown-trigger"
          @click.stop="isCostruttoreDropdownOpen = !isCostruttoreDropdownOpen"
        >
          {{ selectedCostruttoreLabel }}
          <span class="arrow" :class="{ open: isCostruttoreDropdownOpen }"
            >▼</span
          >
        </div>
        <Transition name="slide-up">
          <div
            v-if="isCostruttoreDropdownOpen"
            class="dropdown-menu glass-panel"
          >
            <div
              class="dropdown-item"
              :class="{ active: filterCostruttore === '' }"
              @click.stop="filterCostruttore = ''"
            >
              <span class="dot dot--hidden"></span>
              Tutti
            </div>
            <div
              v-for="c in costruttori"
              :key="c.id"
              class="dropdown-item"
              :class="{ active: filterCostruttore === c.id }"
              @click.stop="filterCostruttore = c.id"
            >
              <span class="dot dot--gold"></span>
              {{ c.name.split(",")[0] }}
            </div>
          </div>
        </Transition>
      </div>

      <div
        class="custom-dropdown"
        v-click-outside="() => (isSortDropdownOpen = false)"
      >
        <div
          class="dropdown-trigger"
          @click.stop="isSortDropdownOpen = !isSortDropdownOpen"
        >
          {{ selectedSortLabel }}
          <span class="arrow" :class="{ open: isSortDropdownOpen }">▼</span>
        </div>
        <Transition name="slide-up">
          <div v-if="isSortDropdownOpen" class="dropdown-menu glass-panel">
            <div
              v-for="opt in sortOptions"
              :key="opt.value"
              class="dropdown-item"
              :class="{ active: sortBy === opt.value }"
              @click.stop="sortBy = opt.value"
            >
              {{ opt.label }}
            </div>
          </div>
        </Transition>
      </div>

      <div class="stats-box">
        <span class="count-tag">Mazzi Rilevati {{ totalDecks }}</span>
      </div>
    </div>

    <!-- Notifications are managed globally -->

    <div v-if="loading" class="dashboard-loading">
      <div class="loader"></div>
    </div>

    <div v-else class="decks-grid">
      <div v-for="d in decks" :key="d.id" class="deck-card glass-panel">
        <div class="deck-top-row">
          <div class="deck-title-row">
            <h3>{{ d.name }}</h3>
            <span class="deck-creator">@{{ d.creator }}</span>
          </div>
        </div>

        <div class="deck-hero-container">
          <img
            :src="getCostruttoreImg(d.costruttoreId)"
            :alt="getCostruttoreName(d.costruttoreId)"
            class="deck-hero-img"
          />
        </div>

        <div class="deck-hero-caption">
          <span class="caption-name">{{
            getCostruttoreName(d.costruttoreId)
          }}</span>
        </div>

        <div class="deck-footer-row">
          <div class="stat-chip">
            <span class="stat-key">VOTI</span>
            <span class="stat-val">{{ d.votesCount }}</span>
          </div>
          <div class="stat-chip">
            <span class="stat-key">IMPORT</span>
            <span class="stat-val">{{ d.importsCount }}</span>
          </div>
        </div>

        <div class="deck-export-actions">
          <button
            @click.stop="handleExport(d.id!, 'pdf')"
            class="cyber-export-btn pdf"
            :disabled="!!exportingId"
            title="Scarica PDF Decklist"
          >
            {{
              exportingId === d.id && exportingFormat === "pdf"
                ? "GENERAZIONE..."
                : "PDF"
            }}
          </button>
          <button
            @click.stop="handleExport(d.id!, 'tts')"
            class="cyber-export-btn tts"
            :disabled="!!exportingId"
            title="Esporta per Tabletop Simulator"
          >
            {{
              exportingId === d.id && exportingFormat === "tts"
                ? "GENERAZIONE..."
                : "TTS"
            }}
          </button>
        </div>

        <div class="deck-actions">
          <button
            class="cyber-btn btn-secondary small preview-btn"
            @click="openPreview(d)"
          >
            Visualizza
          </button>
          <button
            class="cyber-btn btn-secondary small"
            :class="{ voted: d.userVoted }"
            @click="voteDeck(d)"
          >
            {{ d.userVoted ? "Votato" : "Vota" }}
          </button>
          <button
            class="cyber-btn btn-primary small"
            :disabled="
              (d.creator || '').trim().toLowerCase() ===
              username.trim().toLowerCase()
            "
            :title="
              (d.creator || '').trim().toLowerCase() ===
              username.trim().toLowerCase()
                ? 'Non puoi importare un tuo mazzo.'
                : ''
            "
            @click="importDeck(d)"
          >
            Importa
          </button>
        </div>
      </div>

      <div v-if="decks.length === 0" class="empty-dashboard glass-panel">
        Nessun mazzo pubblico trovato.
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="selectedDeck"
          class="modal-overlay"
          @click.self="selectedDeck = null"
        >
          <div class="modal-content glass-panel">
            <button class="close-btn" @click="selectedDeck = null">
              &times;
            </button>
            <h2 class="modal-title">{{ selectedDeck.name }}</h2>
            <div class="modal-subtitle">
              <span>@{{ selectedDeck.creator }}</span>
              <span>{{ getCostruttoreName(selectedDeck.costruttoreId) }}</span>
            </div>

            <div class="preview-list">
              <div
                v-for="item in previewCards"
                :key="item.cardId"
                class="preview-row"
              >
                <span class="preview-count">{{ item.count }}x</span>
                <span class="preview-name">{{ item.name }}</span>
                <span class="preview-type">{{ item.type }}</span>
              </div>
            </div>

            <div class="modal-export-group">
              <button
                @click="handleExport(selectedDeck.id!, 'pdf')"
                class="cyber-export-btn pdf"
                :disabled="!!exportingId"
              >
                {{
                  exportingId === selectedDeck.id && exportingFormat === "pdf"
                    ? "GENERAZIONE..."
                    : "PDF DECKLIST"
                }}
              </button>
              <button
                @click="handleExport(selectedDeck.id!, 'tts')"
                class="cyber-export-btn tts"
                :disabled="!!exportingId"
              >
                {{
                  exportingId === selectedDeck.id && exportingFormat === "tts"
                    ? "GENERAZIONE..."
                    : "TTS EXPORT"
                }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div v-if="totalPages > 1" class="pagination">
      <button
        :disabled="currentPage === 1"
        class="page-btn"
        @click="currentPage--"
      >
        PREV
      </button>
      <span class="page-info">PAG {{ currentPage }} / {{ totalPages }}</span>
      <button
        :disabled="currentPage === totalPages"
        class="page-btn"
        @click="currentPage++"
      >
        NEXT
      </button>
    </div>
  </div>

  <!-- Notifications are managed globally -->
</template>

<style scoped>
.public-decks-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  padding-bottom: 4rem;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
}

.main-title {
  text-align: center;
  font-size: 3.5rem;
  font-family: var(--font-display);
  letter-spacing: 0.5rem;
  background: linear-gradient(135deg, #fff 0%, var(--accent-gold) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 3.5rem;
  text-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
}

.search-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  margin: 0 auto 1rem;
  width: 100%;
  max-width: 1000px;
}

.search-box {
  flex-grow: 1;
}

.search-input {
  padding-left: 1.5rem !important;
  font-size: 1.1rem;
  height: 50px;
  width: 100%;
  margin-bottom: 0 !important;
}

.custom-dropdown {
  position: relative;
  min-width: 220px;
}

.dropdown-trigger {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: var(--text-main);
  padding: 0 1.2rem;
  height: 50px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-family: var(--font-body);
  transition: all 0.3s ease;
  user-select: none;
  white-space: nowrap;
}

.dropdown-trigger:hover {
  border-color: var(--accent-gold);
}

.dropdown-trigger .arrow {
  margin-left: auto;
  font-size: 0.7rem;
  transition: transform 0.3s;
  color: #fff;
}

.dropdown-trigger .arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  z-index: 10;
  background: rgba(10, 15, 25, 0.98);
  border: 1px solid var(--accent-gold);
  border-radius: 10px;
  overflow: hidden;
}

.dropdown-item {
  padding: 0.85rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dropdown-item:hover,
.dropdown-item.active {
  background: rgba(212, 175, 55, 0.12);
  color: var(--accent-gold);
}

.stats-box {
  display: flex;
  align-items: center;
}

.count-tag {
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid var(--accent-gold);
  padding: 0 1.2rem;
  height: 50px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: var(--font-display);
  color: var(--accent-gold);
  white-space: nowrap;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.dot--hidden {
  background: transparent;
  opacity: 0;
}

.dot--gold {
  background: #ffd700;
  box-shadow: 0 0 5px #ffd700;
}

.decks-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-items: stretch;
  gap: 1.2rem;
  margin-top: 0.2rem;
}

.deck-card {
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.deck-card:hover {
  transform: translateY(-8px);
  border-color: var(--accent-gold);
  box-shadow: 0 15px 40px rgba(212, 175, 55, 0.18);
  background: rgba(255, 255, 255, 0.05);
}

.deck-top-row {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
}

.deck-title-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-height: 66px;
}

.deck-title-row h3 {
  margin: 0;
  color: var(--accent-gold);
  font-family: var(--font-display);
  font-size: 1.3rem;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.deck-creator {
  font-size: 0.78rem;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.deck-hero-container {
  width: 100%;
  height: 260px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.deck-hero-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.45s ease;
}

.deck-card:hover .deck-hero-img {
  transform: scale(1.08);
}

.deck-hero-caption {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.caption-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent-gold);
}

.deck-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.stat-chip {
  background: rgba(255, 255, 255, 0.05);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  display: flex;
  gap: 0.5rem;
  font-size: 0.7rem;
}

.stat-key {
  color: var(--text-muted);
}
.stat-val {
  color: var(--accent-gold);
  font-weight: bold;
}

.deck-export-actions {
  display: flex;
  gap: 0.5rem;
}

.deck-export-actions .cyber-export-btn {
  flex: 1;
  font-size: 0.7rem;
  padding: 0.3rem;
}

.deck-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.deck-actions .cyber-btn {
  flex: 1 1 auto;
  min-width: 80px;
  padding: 0.5rem 0.8rem;
  font-size: 0.75rem;
  letter-spacing: 1px;
  text-align: center;
}

.voted {
  background: var(--accent-gold) !important;
  color: #000 !important;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  padding: 2.5rem;
  position: relative;
  overflow-y: auto;
}

.modal-title {
  color: var(--accent-gold);
  font-family: var(--font-display);
  margin-bottom: 0.5rem;
}

.modal-subtitle {
  display: flex;
  gap: 1.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 2rem;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.preview-row {
  display: flex;
  gap: 1.5rem;
  padding: 0.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.preview-count {
  color: var(--accent-gold);
  font-weight: bold;
}
.preview-name {
  flex: 1;
}
.preview-type {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.modal-export-group {
  display: flex;
  gap: 1rem;
}

.modal-export-group .cyber-export-btn {
  padding: 0.8rem;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  font-size: 2rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
}

.page-btn {
  background: transparent;
  border: 1px solid var(--accent-gold);
  color: var(--accent-gold);
  padding: 0.6rem 1.5rem;
  cursor: pointer;
  font-family: var(--font-display);
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: var(--accent-gold);
  color: #000;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
