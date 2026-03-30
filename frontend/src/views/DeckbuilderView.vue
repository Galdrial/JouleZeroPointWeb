<script setup lang="ts">
import axios from "axios";
import { computed, onMounted, ref, watch } from "vue";
import {
  DECKBUILDER_TYPE_OPTIONS,
  EVENT_TYPES,
  FRAGMENT_TYPES,
  TYPE_COLOR_GRADIENTS,
  TYPE_GLOWS,
} from "../constants/cardTypes";

interface Card {
  id: number;
  name: string;
  type: string;
  rarity: string;
  cost_et: number | null;
  pep: number | null;
  rp: number | null;
  effect: string;
  role: string | null;
  image_url: string;
}

interface DeckCard {
  card: Card;
  count: number;
}

interface SavedDeck {
  id?: string | number;
  name: string;
  cards: { cardId: number; count: number }[];
  costruttoreId: number | null;
  creator?: string;
  isPublic?: boolean;
}

const username = ref(localStorage.getItem("username") || "");

// UI State
const viewMode = ref<"dashboard" | "editor">("dashboard");
const loading = ref(true);
const isSaving = ref(false);
const isCostruttoreDropdownOpen = ref(false);
const isEditorCostruttoreDropdownOpen = ref(false);
const isTypeDropdownOpen = ref(false);
const isPublic = ref(false);
const editingDeckId = ref<string | number | null>(null);
const originalDeckName = ref("Nuovo Mazzo");
const isExporting = ref(false);
const exportFormat = ref<"pdf" | "tts">("pdf");

// Delete State
const deckToDelete = ref<string | number | null>(null);
const showDeleteConfirm = ref(false);

// Preview & Modal State
const selectedCard = ref<Card | null>(null);
const showStatsModal = ref(false);

// Alert State
const alertMessage = ref("");
const showAlert = ref(false);

const showTerminalAlert = (msg: string) => {
  alertMessage.value = msg;
  showAlert.value = true;
};

// Editor State
const allCards = ref<Card[]>([]);
const currentDeck = ref<DeckCard[]>([]);
const selectedCostruttore = ref<Card | null>(null);
const deckName = ref("Nuovo Mazzo");
const editorSearchQuery = ref("");
const editorSelectedType = ref("");

const typeOptions = DECKBUILDER_TYPE_OPTIONS;

// Dashboard State
const decks = ref<SavedDeck[]>([]);
const totalDecks = ref(0);
const searchDashboard = ref("");
const filterCostruttore = ref<number | "">("");
const currentPage = ref(1);
const limit = 12;

// Computed for Editor
const filteredLibrary = computed(() => {
  return allCards.value.filter((c) => {
    if (c.type === "Costruttore") return false;
    const nameMatch = c.name
      .toLowerCase()
      .includes(editorSearchQuery.value.toLowerCase());
    const typeMatch =
      !editorSelectedType.value || c.type === editorSelectedType.value;
    return nameMatch && typeMatch;
  });
});

const costruttori = computed(() =>
  allCards.value.filter((c) => c.type === "Costruttore"),
);
const totalCards = computed(() =>
  currentDeck.value.reduce((sum, item) => sum + item.count, 0),
);
const totalFrammenti = computed(() => {
  return currentDeck.value.reduce((sum, item) => {
    const isFrammento = FRAGMENT_TYPES.includes(
      item.card.type as (typeof FRAGMENT_TYPES)[number],
    );
    return isFrammento ? sum + item.count : sum;
  }, 0);
});
const totalEvents = computed(() => {
  return currentDeck.value.reduce((sum, item) => {
    const isEvent = EVENT_TYPES.includes(
      item.card.type as (typeof EVENT_TYPES)[number],
    );
    return isEvent ? sum + item.count : sum;
  }, 0);
});

const costCurve = computed(() => {
  const curve: Record<string, number> = {};
  currentDeck.value.forEach((item) => {
    const cost = item.card.cost_et !== null ? String(item.card.cost_et) : "—";
    curve[cost] = (curve[cost] || 0) + item.count;
  });
  return curve;
});

const averagePep = computed(() => {
  const cardsWithPep = currentDeck.value.filter(
    (item) => item.card.pep !== null,
  );
  if (cardsWithPep.length === 0) return 0;
  const totalPep = cardsWithPep.reduce(
    (sum, item) => sum + (item.card.pep || 0) * item.count,
    0,
  );
  const totalCount = cardsWithPep.reduce((sum, item) => sum + item.count, 0);
  return (totalPep / totalCount).toFixed(2);
});

const averageRp = computed(() => {
  const cardsWithRp = currentDeck.value.filter((item) => item.card.rp !== null);
  if (cardsWithRp.length === 0) return 0;
  const totalRp = cardsWithRp.reduce(
    (sum, item) => sum + (item.card.rp || 0) * item.count,
    0,
  );
  const totalCount = cardsWithRp.reduce((sum, item) => sum + item.count, 0);
  return (totalRp / totalCount).toFixed(2);
});

const typeDistribution = computed(() => {
  const distribution: Record<string, number> = {};
  currentDeck.value.forEach((item) => {
    distribution[item.card.type] =
      (distribution[item.card.type] || 0) + item.count;
  });
  return distribution;
});

const getTypeColor = (type: string): string => {
  return TYPE_COLOR_GRADIENTS[type] || "linear-gradient(90deg, #fff, #ccc)";
};

const getTypeGlow = (type: string): string => {
  return TYPE_GLOWS[type] || "none";
};

const getLimit = (rarity: string) => {
  if (rarity === "Critica") return 1;
  if (rarity === "Instabile") return 2;
  return 3;
};

// Funzioni Editor
const addToDeck = (card: Card) => {
  if (totalCards.value >= 40) return;
  const limit = getLimit(card.rarity);
  const existing = currentDeck.value.find((item) => item.card.id === card.id);
  if (existing) {
    if (existing.count < limit) existing.count++;
  } else {
    currentDeck.value.push({ card, count: 1 });
  }
};

const removeFromDeck = (card: Card) => {
  const index = currentDeck.value.findIndex((item) => item.card.id === card.id);
  if (index !== -1) {
    if (currentDeck.value[index].count > 1) {
      currentDeck.value[index].count--;
    } else {
      currentDeck.value.splice(index, 1);
    }
  }
};

const saveDeck = () => {
  if (totalCards.value !== 40) {
    showTerminalAlert("IL MAZZO DEVE CONTENERE ESATTAMENTE 40 CARTE.");
    return;
  }
  if (!selectedCostruttore.value) {
    showTerminalAlert("SELEZIONA UN COSTRUTTORE PER SINCRONIZZARE IL MAZZO.");
    return;
  }

  if (editingDeckId.value) {
    const normalizedCurrentName = deckName.value.trim().toLowerCase();
    const normalizedOriginalName = originalDeckName.value.trim().toLowerCase();
    const hasRenamedDeck =
      normalizedCurrentName.length > 0 &&
      normalizedCurrentName !== normalizedOriginalName;

    executeSave(!hasRenamedDeck);
    return;
  }

  executeSave(false);
};

const executeSave = async (overwrite: boolean) => {
  isSaving.value = true;
  try {
    const payload: SavedDeck = {
      ...(overwrite && editingDeckId.value ? { id: editingDeckId.value } : {}),
      name: deckName.value,
      costruttoreId: selectedCostruttore.value!.id,
      cards: currentDeck.value.map((item) => ({
        cardId: item.card.id,
        count: item.count,
      })),
      creator: username.value,
      isPublic: isPublic.value,
    };
    const token = localStorage.getItem("token");
    await axios.post("/api/v1/decks", payload, {
      headers: { "Authorization": token ? `Bearer ${token}` : "" }
    });
    viewMode.value = "dashboard";
    loadDecks();
  } catch (e: any) {
    showTerminalAlert(
      e?.response?.data?.error ||
        "ERRORE DURANTE LA SINCRONIZZAZIONE DELLA LINEA TEMPORALE.",
    );
  } finally {
    isSaving.value = false;
  }
};

const handleExport = async (deckId: string | number, format: "pdf" | "tts") => {
  const token = localStorage.getItem("token");
  const url = `/api/v1/decks/${deckId}/export?format=${format}`;
  
  isExporting.value = true;
  exportFormat.value = format;

  try {
    const response = await axios({
      url: url,
      method: 'GET',
      responseType: 'blob',
      headers: {
        "Authorization": token ? `Bearer ${token}` : ""
      }
    });

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    const extension = format === 'pdf' ? 'pdf' : 'jpg';
    link.setAttribute('download', `Joule_Export_${deckId}.${extension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (e) {
    showTerminalAlert("ERRORE DURANTE L'ESPORTAZIONE DEI DATI DALLA MATRICE.");
  } finally {
    isExporting.value = false;
  }
};

// Funzioni Dashboard
const loadDecks = async () => {
  loading.value = true;
  try {
    const res = await axios.get("/api/v1/decks", {
      params: {
        q: searchDashboard.value,
        costruttoreId: filterCostruttore.value,
        page: currentPage.value,
        limit: limit,
      },
      headers: {
        "x-user": username.value,
        "Authorization": localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : ""
      },
    });
    decks.value = res.data.decks;
    totalDecks.value = res.data.total;
  } finally {
    loading.value = false;
  }
};

const selectDashboardCostruttore = (id: number | "") => {
  filterCostruttore.value = id;
  isCostruttoreDropdownOpen.value = false;
};

// Direttiva click-outside
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

const confirmDelete = (id: string | number) => {
  deckToDelete.value = id;
  showDeleteConfirm.value = true;
};

const executeDelete = async () => {
  if (deckToDelete.value) {
    const token = localStorage.getItem("token");
    await axios.delete(`/api/v1/decks/${deckToDelete.value}`, {
      headers: { "Authorization": token ? `Bearer ${token}` : "" }
    });
    deckToDelete.value = null;
    showDeleteConfirm.value = false;
    loadDecks();
  }
};

const editDeck = (deck: SavedDeck) => {
  deckName.value = deck.name;
  originalDeckName.value = deck.name;
  editingDeckId.value = deck.id || null;
  isPublic.value = deck.isPublic || false;
  selectedCostruttore.value =
    allCards.value.find((c) => String(c.id) === String(deck.costruttoreId)) || null;
  currentDeck.value = deck.cards
    .map((dc) => {
      const card = allCards.value.find((c) => String(c.id) === String(dc.cardId));
      return card ? { card, count: dc.count } : null;
    })
    .filter(Boolean) as DeckCard[];
  viewMode.value = "editor";
};

const createNewDeck = () => {
  deckName.value = "Nuovo Mazzo";
  originalDeckName.value = "Nuovo Mazzo";
  editingDeckId.value = null;
  isPublic.value = false;
  selectedCostruttore.value = null;
  currentDeck.value = [];
  viewMode.value = "editor";
};

const totalPages = computed(() => Math.ceil(totalDecks.value / limit));

// Utils
const handleImgError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = "none";
};

const getCostruttoreName = (id: number | string | null) => {
  return allCards.value.find((c) => String(c.id) === String(id))?.name || "Sconosciuto";
};

const getCostruttoreImg = (id: number | string | null) => {
  return allCards.value.find((c) => String(c.id) === String(id))?.image_url || "";
};

// Watchers per Dashboard
watch([searchDashboard, filterCostruttore], () => {
  currentPage.value = 1;
  loadDecks();
});

watch(currentPage, loadDecks);

onMounted(async () => {
  const [cardsRes] = await Promise.all([axios.get("/api/v1/cards")]);
  allCards.value = cardsRes.data;

  const editId = new URLSearchParams(window.location.search).get("edit");
  if (editId) {
    try {
      loading.value = true;
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/v1/decks/${editId}`, {
        headers: { "Authorization": token ? `Bearer ${token}` : "" }
      });
      editDeck(res.data);
    } catch (e) {
      console.error("Errore caricamento mazzo edit:", e);
      await loadDecks();
    }
  } else {
    await loadDecks();
  }
  loading.value = false;
});
</script>

<template>
  <div class="deck-view fade-in">
    <!-- DASHBOARD MODE -->
    <div v-if="viewMode === 'dashboard'" class="dashboard-container">
      <h1 class="main-title">I MIEI MAZZI</h1>

      <div class="top-actions">
        <button @click="createNewDeck" class="cyber-btn btn-primary huge">
          NUOVO MAZZO
        </button>
      </div>

      <div class="search-container">
        <div class="search-box">
          <input
            v-model="searchDashboard"
            placeholder="Cerca mazzo..."
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
            {{
              costruttori
                .find((c) => c.id === filterCostruttore)
                ?.name.split(",")[0] || "Costruttore"
            }}
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
                @click.stop="selectDashboardCostruttore('')"
              >
                <span
                  class="dot"
                  style="background: transparent; opacity: 0"
                ></span>
                Tutti
              </div>
              <div
                v-for="c in costruttori"
                :key="c.id"
                class="dropdown-item"
                :class="{ active: filterCostruttore === c.id }"
                @click.stop="selectDashboardCostruttore(c.id)"
              >
                <span
                  class="dot"
                  style="background: #ffd700; box-shadow: 0 0 5px #ffd700"
                ></span>
                {{ c.name.split(",")[0] }}
              </div>
            </div>
          </Transition>
        </div>

        <div class="stats-box">
          <span class="count-tag">Mazzi Rilevati {{ totalDecks }}</span>
        </div>
      </div>

      <div v-if="loading" class="dashboard-loading">
        <div class="loader"></div>
      </div>

      <div v-else class="decks-grid">
        <div
          v-for="d in decks"
          :key="d.id"
          class="deck-card glass-panel"
          @click="editDeck(d)"
        >
          <!-- TOP ROW: Name and Delete -->
          <div class="deck-top-row">
            <div class="deck-title-row">
              <h3>{{ d.name }}</h3>
            </div>
            <button
              class="small-delete cyber-btn btn-danger mini"
              @click.stop="confirmDelete(d.id!)"
              title="Elimina Mazzo"
            >
              <span class="trash-icon">×</span>
            </button>
          </div>

          <!-- ACTIONS ROW: PDF and TTS above image -->
          <div class="deck-actions-row">
            <button @click.stop="handleExport(d.id!, 'pdf')" class="cyber-export-btn pdf" title="Scarica PDF Decklist">PDF</button>
            <button @click.stop="handleExport(d.id!, 'tts')" class="cyber-export-btn tts" title="Esporta per Tabletop Simulator">TTS</button>
          </div>

          <!-- HERO IMAGE: Wide like Database -->
          <div class="deck-hero-container">
            <img
              :src="getCostruttoreImg(d.costruttoreId)"
              class="deck-hero-img"
              @error="handleImgError"
            />
          </div>

          <!-- CAPTION: Costruttore name below image -->
          <div class="deck-hero-caption">
            <span class="caption-name">{{
              getCostruttoreName(d.costruttoreId)
            }}</span>
          </div>
          <!-- FOOTER ROW: Privacy and Sincronizza -->
          <div class="deck-footer-row">
            <span
              class="deck-privacy"
              :class="d.isPublic ? 'public' : 'private'"
            >
              {{ d.isPublic ? "PUBBLICO" : "PRIVATO" }}
            </span>
            <div class="edit-hint">SINCRONIZZA ➔</div>
          </div>
        </div>
        <div v-if="decks.length === 0" class="empty-dashboard">
          <p>Nessun mazzo trovato nella matrice.</p>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button
          :disabled="currentPage === 1"
          @click="currentPage--"
          class="page-btn"
        >
          PREV
        </button>
        <span class="page-info"
          >LINEA {{ currentPage }} / {{ totalPages }}</span
        >
        <button
          :disabled="currentPage === totalPages"
          @click="currentPage++"
          class="page-btn"
        >
          NEXT
        </button>
      </div>
    </div>

    <!-- EDITOR MODE -->
    <div v-else class="builder-layout">
      <div class="side-panel left-side">
        <div class="glass-panel library-panel">
          <div class="library-header">
            <h3 class="uppercase-title">ARCHIVIO FRAMMENTI</h3>
            <button
              @click="viewMode = 'dashboard'"
              class="cyber-btn btn-primary small-btn"
            >
              DASHBOARD
            </button>
          </div>
          <div class="filters">
            <input
              v-model="editorSearchQuery"
              placeholder="Cerca..."
              class="glass-input small"
            />
            <div
              class="custom-dropdown"
              v-click-outside="() => (isTypeDropdownOpen = false)"
            >
              <div
                class="dropdown-trigger small"
                @click.stop="isTypeDropdownOpen = !isTypeDropdownOpen"
              >
                {{ editorSelectedType || "Tutti i tipi" }}
                <span class="arrow" :class="{ open: isTypeDropdownOpen }"
                  >▼</span
                >
              </div>
              <Transition name="slide-up">
                <div
                  v-if="isTypeDropdownOpen"
                  class="dropdown-menu glass-panel"
                >
                  <div
                    v-for="t in typeOptions"
                    :key="t.value"
                    class="dropdown-item"
                    :class="{ active: editorSelectedType === t.value }"
                    @click.stop="
                      editorSelectedType = t.value;
                      isTypeDropdownOpen = false;
                    "
                  >
                    <span
                      class="dot"
                      :style="{
                        backgroundColor: t.color,
                        opacity: t.value ? 1 : 0,
                      }"
                    ></span>
                    {{ t.label }}
                  </div>
                </div>
              </Transition>
            </div>
          </div>
          <div class="library-grid-container">
            <div class="cards-grid">
              <div
                v-for="card in filteredLibrary"
                :key="card.id"
                class="glass-panel card-item"
                @click="selectedCard = card"
              >
                <div class="card-header stacked">
                  <h3>{{ card.name }}</h3>
                </div>
                <div class="card-image-container">
                  <img
                    :src="card.image_url"
                    :alt="card.name"
                    class="card-img"
                    @error="handleImgError"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="side-panel right-side">
        <div class="glass-panel current-deck-panel">
          <div class="deck-config">
            <input
              v-model="deckName"
              class="deck-name-input"
              placeholder="Nome Mazzo..."
            />
            <div class="costruttore-area">
              <label>COSTRUTTORE</label>
              <div
                class="custom-dropdown"
                v-click-outside="
                  () => (isEditorCostruttoreDropdownOpen = false)
                "
              >
                <div
                  class="dropdown-trigger"
                  @click.stop="
                    isEditorCostruttoreDropdownOpen =
                      !isEditorCostruttoreDropdownOpen
                  "
                >
                  {{
                    selectedCostruttore?.name.split(",")[0] ||
                    "SCEGLI COSTRUTTORE"
                  }}
                  <span
                    class="arrow"
                    :class="{ open: isEditorCostruttoreDropdownOpen }"
                    >▼</span
                  >
                </div>
                <Transition name="slide-up">
                  <div
                    v-if="isEditorCostruttoreDropdownOpen"
                    class="dropdown-menu glass-panel"
                  >
                    <div
                      v-for="c in costruttori"
                      :key="c.id"
                      class="dropdown-item"
                      :class="{ active: selectedCostruttore?.id === c.id }"
                      @click.stop="
                        selectedCostruttore = c;
                        isEditorCostruttoreDropdownOpen = false;
                      "
                    >
                      <span
                        class="dot"
                        style="background: #ffd700; box-shadow: 0 0 5px #ffd700"
                      ></span>
                      {{ c.name.split(",")[0] }}
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
            <div class="privacy-area">
              <label class="checkbox-container">
                <input type="checkbox" v-model="isPublic" />
                <span class="checkmark"></span>
                Sincronia Pubblica (Condividi Mazzo)
              </label>
            </div>
          </div>

          <div class="deck-stats-bar">
            <div class="stats-bar-top">
              <div
                class="stat"
                :class="{
                  warning: totalCards !== 40,
                  success: totalCards === 40,
                }"
              >
                CARTE: <span>{{ totalCards }}</span
                >/40
              </div>
              <button
                @click="showStatsModal = true"
                class="cyber-btn btn-primary stats-trigger-btn"
                title="Analisi Statistica"
              >
                <span class="stats-icon">▁▃▅</span>
              </button>
            </div>
            <div class="composition-hints">
              <div class="hint">Frammenti: {{ totalFrammenti }}</div>
              <div class="hint">Eventi/Anomalie: {{ totalEvents }}</div>
            </div>
          </div>

          <div class="current-deck-list">
            <div
              v-for="item in currentDeck"
              :key="item.card.id"
              class="deck-row"
            >
              <span class="count">{{ item.count }}x</span>
              <span class="name">{{ item.card.name }}</span>
              <div class="row-actions">
                <button
                  class="cyber-btn btn-danger extra-small red-bg"
                  @click="removeFromDeck(item.card)"
                >
                  -
                </button>
                <button
                  class="cyber-btn btn-primary extra-small cyan-bg"
                  @click="addToDeck(item.card)"
                >
                  +
                </button>
              </div>
            </div>
            <div v-if="currentDeck.length === 0" class="empty-deck">
              Seleziona le carte dall'archivio a sinistra.
            </div>
          </div>

          <div class="editor-actions">
            <button
              @click="saveDeck"
              class="cyber-btn btn-primary full-width"
              :disabled="isSaving"
            >
              {{ isSaving ? "SINCRONIZZAZIONE..." : "SALVA LINEA TEMPORALE" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CARD PREVIEW (LIKE DATABASE WITH CONTROLS) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="selectedCard"
          class="modal-overlay"
          @click.self="selectedCard = null"
        >
          <div class="modal-content glass-panel">
            <button class="close-btn" @click="selectedCard = null">
              &times;
            </button>
            <div class="modal-body">
              <div class="modal-info">
                <h2>{{ selectedCard.name }}</h2>
                <div class="badge-row">
                  <span
                    class="badge"
                    :class="
                      (selectedCard.type || '').split(' ')[0].toLowerCase()
                    "
                    >{{ selectedCard.type }}</span
                  >
                  <span class="rarity-badge">{{ selectedCard.rarity }}</span>
                </div>
                <p class="modal-effect">{{ selectedCard.effect }}</p>
                <div class="modal-stats">
                  <div class="stat-box">
                    <strong>ET</strong
                    ><span>{{ selectedCard.cost_et ?? "-" }}</span>
                  </div>
                  <div class="stat-box">
                    <strong>PEP</strong
                    ><span>{{ selectedCard.pep ?? "-" }}</span>
                  </div>
                  <div class="stat-box">
                    <strong>RP</strong><span>{{ selectedCard.rp ?? "-" }}</span>
                  </div>
                </div>

                <div class="modal-controls-wrapper">
                  <p v-if="selectedCard.role" class="modal-role">
                    Ruolo: {{ selectedCard.role }}
                  </p>

                  <!-- RAPID CONTROLS -->
                  <div class="viewer-controls">
                    <button
                      class="cyber-btn btn-danger small red-bg"
                      @click="removeFromDeck(selectedCard)"
                    >
                      -
                    </button>
                    <span class="current-count">{{
                      currentDeck.find((d) => d.card.id === selectedCard?.id)
                        ?.count || 0
                    }}</span>
                    <button
                      class="cyber-btn btn-primary small cyan-bg"
                      @click="addToDeck(selectedCard)"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- STATS MODAL -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showStatsModal"
          class="modal-overlay"
          @click.self="showStatsModal = false"
        >
          <div class="modal-content glass-panel">
            <button class="close-btn" @click="showStatsModal = false">
              &times;
            </button>
            <div class="modal-header-stats">
              <h2>ANALISI STATISTICA MAZZO</h2>
            </div>
            <div class="stats-modal-body">
              <!-- CURVA DI COSTO -->
              <div class="stats-section">
                <h3>CURVA DI COSTO (ET)</h3>
                <div class="cost-chart">
                  <div
                    v-for="(count, cost) in costCurve"
                    :key="cost"
                    class="cost-bar"
                  >
                    <div class="cost-label">
                      {{ cost }}
                    </div>
                    <div
                      class="cost-bar-fill"
                      :style="{ width: (count / totalCards) * 100 + '%' }"
                    >
                      <span class="cost-count">{{ count }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- STATISTICHE MEDIE -->
              <div class="stats-section">
                <h3>STATISTICHE MEDIE</h3>
                <div class="avg-stats-grid">
                  <div class="avg-stat">
                    <span class="stat-label">PEP MEDIO</span>
                    <span class="stat-value">{{ averagePep }}</span>
                  </div>
                  <div class="avg-stat">
                    <span class="stat-label">RP MEDIO</span>
                    <span class="stat-value">{{ averageRp }}</span>
                  </div>
                </div>
              </div>

              <!-- DISTRIBUZIONE PER TIPO -->
              <div class="stats-section">
                <h3>DISTRIBUZIONE PER TIPO</h3>
                <div class="type-distribution">
                  <div
                    v-for="(count, type) in typeDistribution"
                    :key="type"
                    class="type-row"
                  >
                    <span class="type-name">{{ type }}</span>
                    <div class="type-bar">
                      <div
                        class="type-bar-fill"
                        :style="{
                          width: (count / totalCards) * 100 + '%',
                          background: getTypeColor(type),
                          boxShadow: getTypeGlow(type),
                        }"
                      >
                        <span class="type-count">{{ count }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <!-- TERMINAL ALERT OVERLAY -->
    <Transition name="fade">
      <div v-if="showAlert" class="alert-overlay" @click="showAlert = false">
        <div class="alert-box glass-panel" @click.stop>
          <div class="alert-header">
            <span class="alert-icon">⚠️</span>
            NOTIFICA TERMINALE
          </div>
          <div class="alert-content">
            {{ alertMessage }}
          </div>
          <div class="alert-actions">
            <button
              class="cyber-btn btn-primary small-btn"
              @click="showAlert = false"
            >
              RICEVUTO
            </button>
          </div>
        </div>
      </div>
    </Transition>
    
    <!-- EXPORT LOADER OVERLAY (CYBER EXTRACTION) -->
    <Transition name="matrix-fade">
      <div v-if="isExporting" class="export-overlay">
        <div class="matrix-background"></div>
        <div class="extraction-container">
          <div class="glitch-title" data-text="ESTRAZIONE DATI">ESTRAZIONE DATI</div>
          <div class="processing-core">
            <div class="core-ring"></div>
            <div class="core-ring"></div>
            <div class="core-ring"></div>
            <div class="core-pulse"></div>
            <div class="scanning-line"></div>
          </div>
          <div class="extraction-status">
            <span class="status-indicator">●</span>
            <span class="status-text">Sincronizzazione Frammenti: {{ exportFormat.toUpperCase() }}...</span>
          </div>
          <div class="matrix-code">
            01010110 01001111 01001001 01000100 00100000 01011010 01000101 01010010 01001111 00100000 01010000 01001111 01001001 01001110 01010100
          </div>
        </div>
      </div>
    </Transition>

    <!-- DELETE CONFIRM OVERLAY -->
    <Transition name="fade">
      <div
        v-if="showDeleteConfirm"
        class="alert-overlay"
        @click="showDeleteConfirm = false"
      >
        <div class="alert-box glass-panel" @click.stop>
          <div class="alert-header">PROTOCOLLO DI ELIMINAZIONE</div>
          <div class="alert-content" style="margin-bottom: 2rem">
            Sei sicuro di voler distruggere definitivamente questa linea
            temporale dalla matrice?
          </div>
          <div class="alert-actions split-actions">
            <button
              class="cyber-btn btn-danger small-btn"
              @click="executeDelete"
              :disabled="loading"
            >
              CONFERMA ELIMINAZIONE
            </button>
            <button
              class="cyber-btn btn-secondary small-btn"
              @click="showDeleteConfirm = false"
            >
              ANNULLA
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@import "../assets/card-badge-types.css";
@import "../assets/card-modal-shared.css";

.deck-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 120px);
}

.main-title {
  text-align: center;
  font-size: 3.5rem;
  font-family: var(--font-display);
  letter-spacing: 0.5rem;
  background: linear-gradient(135deg, #fff 0%, var(--accent-cyan) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0;
  text-shadow: 0 0 30px rgba(0, 240, 255, 0.3);
}

/* Dashboard */
.dashboard-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.top-actions {
  width: 100%;
  display: flex;
  justify-content: center;
}

.btn-primary.huge {
  padding: 1.2rem 3rem;
  font-size: 1.2rem;
  letter-spacing: 0.15rem;
  box-shadow: 0 0 30px rgba(212, 175, 55, 0.22);
}

/* Search */
.search-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
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

/* Dropdown */
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

.dropdown-trigger.small {
  padding: 0 0.8rem;
  height: 38px;
  font-size: 0.8rem;
}

.dropdown-trigger:hover {
  border-color: var(--accent-cyan);
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
  z-index: 999;
  background: rgba(10, 15, 25, 0.98);
  backdrop-filter: blur(15px);
  border: 1px solid var(--accent-cyan);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8);
}

.dropdown-item {
  padding: 1rem 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
  color: #fff;
  font-size: 0.9rem;
  text-align: left;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}

.dropdown-item.active {
  background: rgba(212, 175, 55, 0.12);
  color: var(--accent-cyan);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.stats-box {
  display: flex;
  align-items: center;
}

.count-tag {
  background: rgba(212, 175, 55, 0.12);
  border: 1px solid var(--accent-cyan);
  padding: 0 1.2rem;
  height: 50px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: var(--font-display);
  color: var(--accent-cyan);
  white-space: nowrap;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.decks-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.deck-card {
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  background: rgba(255, 255, 255, 0.02);
}

.deck-card:hover {
  transform: translateY(-8px);
  border-color: var(--accent-cyan);
  box-shadow: 0 15px 40px rgba(212, 175, 55, 0.18);
  background: rgba(255, 255, 255, 0.05);
}

.deck-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  min-height: 66px;
}

.deck-title-row {
  min-height: 66px;
  padding-right: 0.6rem;
}

.deck-title-row h3 {
  font-family: var(--font-display);
  font-size: 1.45rem;
  line-height: 1.25;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--accent-cyan);
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.deck-hero-container {
  width: 100%;
  height: 280px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}

.deck-hero-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.5s ease;
}

.deck-card:hover .deck-hero-img {
  transform: scale(1.1);
}

.deck-hero-caption {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0 0.5rem;
  min-height: 2.8rem;
}

.caption-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 2px;
  font-weight: 800;
}

.caption-name {
  font-size: 0.95rem;
  color: #fff;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.4;
  min-height: 2.8rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.deck-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.1rem;
  padding-top: 0.4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.deck-privacy {
  height: 32px;
  display: flex;
  align-items: center;
  font-size: 0.65rem;
  letter-spacing: 1px;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
}
.deck-privacy.public {
  background: rgba(212, 175, 55, 0.12);
  color: var(--accent-cyan);
  border: 1px solid var(--accent-cyan);
}
.deck-privacy.private {
  background: rgba(255, 159, 28, 0.14);
  color: var(--accent-magenta);
  border: 1px solid var(--accent-magenta);
}

.deck-costruttore-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.deck-costruttore-thumb {
  width: 40px;
  height: 40px;
  border-radius: 5px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #1a1a1a;
}

.small-delete.cyber-btn.mini {
  width: 36px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 1.2rem;
  font-weight: 900;
  border-radius: 0;
  background: var(--accent-magenta);
  border: 1px solid var(--accent-magenta);
  color: #fff;
  transition: all 0.3s;
  cursor: pointer;
}

.small-delete.cyber-btn.mini:hover {
  background: #ff1f55;
  color: #fff;
  box-shadow: 0 0 10px currentColor;
  transform: scale(1.1);
}

.trash-icon {
  font-size: 1.4rem;
  line-height: 1;
  margin-top: -2px;
}

.deck-costruttore {
  font-size: 0.7rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  color: var(--text-muted);
}

.deck-body h3 {
  font-size: 1.5rem;
  margin: 0.5rem 0;
  color: #fff;
}

.deck-meta {
  font-size: 0.85rem;
  color: var(--accent-cyan);
}

.deck-footer {
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1rem;
  text-align: right;
}

.edit-hint {
  font-size: 0.75rem;
  letter-spacing: 1px;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.deck-card:hover .edit-hint {
  opacity: 1;
  color: var(--accent-cyan);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
}

.page-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--accent-cyan);
  color: var(--accent-cyan);
  padding: 0.8rem 1.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: var(--accent-cyan);
  color: #000;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Editor */
.builder-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.5rem;
  height: calc(100vh - 180px);
  min-height: 700px;
}

.side-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.library-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.uppercase-title {
  font-family: var(--font-display);
  letter-spacing: 2px;
  font-size: 1.2rem;
  margin: 0;
}

.small-btn {
  padding: 0.5rem 1.2rem;
  font-size: 0.8rem;
  height: auto;
}

.filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.library-grid-container {
  flex: 1;
  overflow-y: auto;
  padding-top: 0.6rem;
  padding-right: 0.8rem;
  margin-bottom: 0.5rem;
}

.library-grid-container::-webkit-scrollbar {
  width: 6px;
}
.library-grid-container::-webkit-scrollbar-button {
  height: 0;
  width: 0;
}
.library-grid-container::-webkit-scrollbar-track {
  background: rgba(212, 175, 55, 0.08);
  border-radius: 10px;
}
.library-grid-container::-webkit-scrollbar-thumb {
  background: var(--accent-cyan);
  border-radius: 10px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
  padding: 30px;
  transform-origin: center;
}

.card-item {
  padding: 1rem;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  cursor: pointer;
  background: rgba(10, 15, 25, 0.6);
}

.card-item:hover {
  transform: translateY(-8px);
  border-color: var(--accent-cyan);
  box-shadow: 0 10px 30px rgba(212, 175, 55, 0.18);
  position: relative;
  z-index: 10;
  transform-origin: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header.stacked {
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.card-header h3 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-main);
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
  text-align: center;
  line-height: 1.25;
}

.card-img {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: contain;
  display: block;
  border-radius: 8px;
}

.modal-role {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.modal-body {
  grid-template-columns: 1fr;
}

.modal-info {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
}

.badge-row,
.modal-stats {
  justify-content: center;
  flex-wrap: wrap;
}

.modal-effect,
.modal-role {
  text-align: center;
}

.modal-controls-wrapper {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.viewer-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.current-count {
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--accent-cyan);
  min-width: 60px;
  text-align: center;
}

.cyber-btn.small {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: transparent;
  font-family: var(--font-display);
  transition: all 0.3s;
}

.cyber-btn.cyan {
  border: 1px solid var(--accent-cyan);
  color: var(--accent-cyan);
}
.cyber-btn.cyan:hover {
  background: var(--accent-cyan);
  color: #000;
  box-shadow: 0 0 15px var(--accent-cyan);
}

.cyber-btn.magenta {
  border: 1px solid var(--accent-magenta);
  color: var(--accent-magenta);
}
.cyber-btn.magenta:hover {
  background: var(--accent-magenta);
  color: #fff;
  box-shadow: 0 0 15px var(--accent-magenta);
}

.badge {
  font-size: 0.75rem;
  padding: 0.35rem 0.8rem;
  border-radius: 4px;
  font-family: var(--font-display);
  letter-spacing: 1px;
}
.badge.plasma {
  background: rgba(255, 159, 28, 0.2);
  border-bottom: 2px solid #ff9f1c;
  color: #ffd08a;
}

.card-effect h3 {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--accent-magenta);
  margin-bottom: 0.8rem;
}

.card-role {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
}

.costruttore-area {
  margin-top: 1rem;
}

.costruttore-area label {
  display: block;
  font-family: var(--font-display);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  color: var(--accent-cyan);
}

.privacy-area {
  margin-top: 1.5rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  font-size: 0.9rem;
  user-select: none;
}

.checkbox-container input {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid var(--accent-cyan);
  border-radius: 4px;
  position: relative;
}

.checkbox-container input:checked + .checkmark::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--accent-cyan);
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 0 0 5px var(--accent-cyan);
}

.stat.success {
  color: #00ff88;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.4);
}

.deck-name-input {
  background: none;
  border: none;
  border-bottom: 2px solid var(--accent-cyan);
  color: #fff;
  font-size: 1.5rem;
  font-family: var(--font-display);
  width: 100%;
  margin-bottom: 1rem;
}

.current-deck-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-actions {
  padding-top: 1rem;
}

.current-deck-list {
  flex: 0 1 auto;
  max-height: 42vh;
  overflow-y: auto;
  margin: 1rem 0;
  padding-right: 0.6rem;
}

.current-deck-list::-webkit-scrollbar {
  width: 6px;
}
.current-deck-list::-webkit-scrollbar-button {
  height: 0;
  width: 0;
}
.current-deck-list::-webkit-scrollbar-track {
  background: rgba(212, 175, 55, 0.08);
  border-radius: 10px;
}
.current-deck-list::-webkit-scrollbar-thumb {
  background: var(--accent-cyan);
  border-radius: 10px;
}

.deck-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.row-actions {
  display: flex;
  gap: 0.8rem;
  margin-left: auto;
}

.cyan-bg {
  background: var(--accent-cyan) !important;
  color: #000 !important;
}

.red-bg {
  background: var(--accent-magenta) !important;
  color: #fff !important;
}

.extra-small {
  width: 36px !important;
  height: 32px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 1.2rem !important;
  font-weight: 900 !important;
  border-radius: 0 !important;
}

.extra-small:hover {
  transform: scale(1.1);
  box-shadow: 0 0 10px currentColor;
}

.small-delete {
  opacity: 1;
  transition: 0.3s;
}

.deck-export-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
  margin-right: 1rem;
}

.export-mini-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-mini-btn:hover {
  background: var(--accent-cyan);
  border-color: var(--accent-cyan);
  transform: scale(1.1);
  box-shadow: 0 0 10px var(--accent-cyan);
}

.export-group-vertical {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.btn-secondary {
  border-color: var(--accent-cyan) !important;
  color: var(--accent-cyan) !important;
  font-size: 0.8rem !important;
  background: rgba(0, 255, 255, 0.05) !important;
}

.btn-secondary:hover {
  background: var(--accent-cyan) !important;
  color: #000 !important;
}

.deck-stats-bar {
  background: rgba(0, 0, 0, 0.4);
  padding: 0.6rem 1rem;
  padding-right: calc(1rem + 6px);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.stats-bar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stats-trigger-btn {
  margin-left: auto;
  width: 36px !important;
  height: 32px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0;
}

.stats-icon {
  font-size: 1rem;
  letter-spacing: 1px;
  line-height: 1;
  font-family: monospace;
}

.stat {
  font-family: var(--font-display);
  font-size: 1.2rem;
}
.warning {
  color: var(--accent-magenta);
  text-shadow: 0 0 10px var(--accent-magenta);
}

/* Alert Modal Styles */
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.alert-box {
  width: 90%;
  max-width: 450px;
  padding: 2.5rem;
  border: 1px solid var(--accent-magenta);
  box-shadow: 0 0 30px rgba(255, 159, 28, 0.24);
  text-align: center;
}

.alert-header {
  font-family: var(--font-display);
  color: var(--accent-magenta);
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.alert-actions.split-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.btn-primary.danger {
  border-color: var(--accent-magenta);
  color: var(--accent-magenta);
}

.btn-primary.danger:hover:not(:disabled) {
  background: var(--accent-magenta);
  color: #fff;
  box-shadow: 0 0 20px rgba(255, 159, 28, 0.4);
}

.alert-content {
  color: #fff;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  font-family: var(--font-body);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Stats Modal Styles */
.modal-header-stats {
  text-align: center;
  margin-bottom: 2rem;
}

.modal-header-stats h2 {
  font-family: var(--font-display);
  font-size: 1.8rem;
  margin: 0;
  color: var(--text-main);
  background: linear-gradient(to right, #fff, var(--accent-cyan));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stats-modal-body {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 1rem;
}

.stats-modal-body::-webkit-scrollbar {
  width: 6px;
}
.stats-modal-body::-webkit-scrollbar-track {
  background: rgba(212, 175, 55, 0.08);
  border-radius: 10px;
}
.stats-modal-body::-webkit-scrollbar-thumb {
  background: var(--accent-cyan);
  border-radius: 10px;
}

.stats-section {
  border: 1px solid rgba(212, 175, 55, 0.22);
  padding: 1.5rem;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
}

.stats-section h3 {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--accent-cyan);
  margin: 0 0 1.5rem 0;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* Cost Chart */
.cost-chart {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.cost-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cost-label {
  font-family: var(--font-display);
  font-size: 0.9rem;
  min-width: 30px;
  text-align: right;
  color: var(--text-muted);
  font-weight: bold;
}

.cost-bar-fill {
  flex: 0 0 auto;
  background: linear-gradient(90deg, var(--accent-cyan), #00ff88);
  min-height: 28px;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.cost-count {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #000;
  font-weight: bold;
  font-size: 0.85rem;
  font-family: var(--font-display);
}

/* Average Stats Grid */
.avg-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.avg-stat {
  background: rgba(212, 175, 55, 0.1);
  padding: 1.2rem;
  border-radius: 8px;
  border: 1px solid rgba(212, 175, 55, 0.18);
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
}

.stat-value {
  display: block;
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--accent-cyan);
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
}

/* Type Distribution */
.type-distribution {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.type-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 1rem;
  align-items: center;
}

.type-name {
  font-size: 0.9rem;
  color: var(--text-main);
  font-weight: 600;
  text-transform: capitalize;
}

.type-bar {
  height: 24px;
  background: rgba(212, 175, 55, 0.12);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(212, 175, 55, 0.18);
  position: relative;
}

.type-bar-fill {
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
}

.type-count {
  color: #000;
  font-size: 0.75rem;
  font-weight: bold;
  font-family: var(--font-display);
}

@media (max-width: 1100px) {
  .builder-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
}

@media (max-width: 768px) {
  .modal-content {
    padding: 1.25rem 1rem;
  }

  .modal-body {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .modal-info h2 {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .deck-view {
    padding: 1rem 0.5rem;
  }

  .main-title {
    font-size: 2rem;
    letter-spacing: 0.12rem;
  }

  .dashboard-container {
    gap: 1rem;
  }

  .top-actions {
    justify-content: stretch;
  }

  .btn-primary.huge {
    width: 100%;
    padding: 0.95rem 1.2rem;
    font-size: 0.95rem;
  }

  .search-container {
    flex-direction: column;
    align-items: stretch;
  }

  .custom-dropdown {
    min-width: 100%;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .decks-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }

  .deck-card {
    padding: 1rem;
  }

  .deck-title-row h3 {
    font-size: 1.15rem;
  }

  .deck-hero-container {
    height: 220px;
  }

  .pagination {
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }

  .page-info {
    width: 100%;
    text-align: center;
    order: -1;
  }

  .builder-layout {
    gap: 1rem;
  }

  .right-side {
    order: -1;
  }

  .side-panel .glass-panel {
    padding: 1rem;
  }

  .library-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .library-header .small-btn {
    width: 100%;
    text-align: center;
  }

  .uppercase-title {
    font-size: 1rem;
    letter-spacing: 1px;
  }

  .cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
    padding: 0.75rem 0 0;
  }

  .card-item {
    padding: 0.75rem;
    gap: 0.65rem;
  }

  .card-header.stacked {
    gap: 0.55rem;
  }

  .card-header h3 {
    font-size: 0.8rem;
  }

  .deck-name-input {
    font-size: 1.15rem;
  }

  .checkbox-container {
    align-items: flex-start;
    line-height: 1.35;
  }

  .stats-bar-top {
    gap: 0.75rem;
  }

  .stat {
    font-size: 1rem;
  }

  .composition-hints {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }

  .current-deck-list {
    max-height: none;
    padding-right: 0;
  }

  .deck-row {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.65rem;
    padding: 0.7rem 0.35rem;
  }

  .deck-row .name {
    min-width: 0;
    font-size: 0.9rem;
    line-height: 1.3;
  }

  .row-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
    margin-left: 0;
    gap: 0.55rem;
  }

  .editor-actions .cyber-btn {
    width: 100%;
  }

  .alert-box {
    padding: 1.4rem 1rem;
  }

  .alert-actions.split-actions {
    flex-direction: column;
  }

  .alert-actions.split-actions .cyber-btn,
  .alert-actions .cyber-btn {
    width: 100%;
  }

  .stats-modal-body {
    gap: 1.4rem;
    padding-right: 0.2rem;
  }

  .avg-stats-grid {
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }

  .type-row {
    grid-template-columns: 90px 1fr;
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.75rem;
  }

  .modal-content {
    padding: 1rem 0.85rem;
  }

  .modal-info h2 {
    font-size: 1.3rem;
  }

  .viewer-controls {
    gap: 1rem;
  }

  .current-count {
    min-width: 44px;
    font-size: 1.55rem;
  }

  .decks-grid {
    grid-template-columns: 1fr;
  }

  .deck-hero-container {
    height: 200px;
  }

  .pagination {
    gap: 1rem;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .dropdown-item {
    padding: 0.85rem 0.9rem;
    gap: 0.7rem;
    font-size: 0.85rem;
  }

  .deck-row {
    grid-template-columns: 1fr;
  }

  .deck-row .count {
    font-size: 0.8rem;
  }

  .row-actions {
    justify-content: stretch;
  }

  .row-actions .extra-small {
    flex: 1 1 0;
    width: auto !important;
  }

  .type-row {
    grid-template-columns: 1fr;
  }

  .type-name {
    font-size: 0.82rem;
  }
}

.deck-actions-row {
  display: flex;
  gap: 1rem;
  padding: 0 1.25rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.cyber-export-btn {
  flex: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--accent-cyan);
  color: var(--accent-cyan);
  font-family: var(--font-display);
  font-size: 0.75rem;
  padding: 0.35rem 0.8rem;
  cursor: pointer;
  letter-spacing: 1px;
  transition: all 0.3s;
  text-align: center;
  border-radius: 4px;
  text-transform: uppercase;
}

.cyber-export-btn.pdf {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.cyber-export-btn.pdf:hover {
  background: var(--accent-cyan);
  color: #000;
  box-shadow: 0 0 15px var(--accent-cyan);
}

.cyber-export-btn.tts {
  border-color: var(--accent-magenta);
  color: var(--accent-magenta);
}

.cyber-export-btn.tts:hover {
  background: var(--accent-magenta);
  color: #fff;
  box-shadow: 0 0 15px var(--accent-magenta);
}

/* EXPORT OVERLAY ANIMATIONS */
.export-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #050a10;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.matrix-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(0, 243, 255, 0.05) 0%, transparent 70%);
  opacity: 0.5;
}

.extraction-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  width: 100%;
  max-width: 600px;
}

.glitch-title {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 8px;
  color: #fff;
  position: relative;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

.processing-core {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.core-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
}

.core-ring:nth-child(1) {
  width: 100%;
  height: 100%;
  border-top-color: var(--accent-cyan);
  animation: rotate 2s linear infinite;
  box-shadow: 0 0 20px var(--accent-cyan);
}

.core-ring:nth-child(2) {
  width: 75%;
  height: 75%;
  border-bottom-color: var(--accent-magenta);
  animation: rotate 1.5s linear infinite reverse;
}

.core-ring:nth-child(3) {
  width: 50%;
  height: 50%;
  border-left-color: var(--accent-cyan);
  animation: rotate 3s linear infinite;
}

.core-pulse {
  width: 30px;
  height: 30px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 50px #fff;
  animation: pulse 1s ease-in-out infinite alternate;
}

.scanning-line {
  position: absolute;
  width: 250px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
  box-shadow: 0 0 15px var(--accent-cyan);
  animation: scan 4s ease-in-out infinite;
}

.extraction-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: var(--font-display);
  letter-spacing: 2px;
}

.status-indicator {
  color: var(--accent-cyan);
  animation: blink 0.8s infinite;
}

.status-text {
  color: #fff;
  font-size: 1.1rem;
  text-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
}

.matrix-code {
  font-family: monospace;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.2);
  max-width: 400px;
  text-align: center;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  from { transform: scale(0.8); opacity: 0.5; }
  to { transform: scale(1.2); opacity: 1; }
}

@keyframes scan {
  0% { transform: translateY(-150px); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(150px); opacity: 0; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.matrix-fade-enter-active, .matrix-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.matrix-fade-enter-from, .matrix-fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0);
}
</style>
