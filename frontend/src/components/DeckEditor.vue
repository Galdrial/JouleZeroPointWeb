<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  DECKBUILDER_TYPE_OPTIONS,
  EVENT_TYPES,
  FRAGMENT_TYPES,
} from "../constants/cardTypes";
import type { Card } from "../stores/cardStore";
import type { SavedDeck } from "../stores/deckStore";
import { useNotificationStore } from "../stores/notificationStore";
import { vClickOutside } from "../utils/directives";
import CardPreviewModal from "./CardPreviewModal.vue";
import DeckStatsModal from "./DeckStatsModal.vue";

interface DeckCard {
  card: Card;
  count: number;
}

interface Props {
  allCards: Card[];
  costruttori: Card[];
  initialDeck: SavedDeck | null;
  isSaving: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  save: [payload: SavedDeck];
  back: [];
}>();

const notifications = useNotificationStore();

const currentDeck = ref<DeckCard[]>([]);
const selectedCostruttore = ref<Card | null>(null);
const deckName = ref("Nuovo Mazzo");
const originalDeckName = ref("Nuovo Mazzo");
const editingDeckId = ref<string | number | null>(null);
const isPublic = ref(false);
const editorSearchQuery = ref("");
const editorSelectedType = ref("");
const isEditorCostruttoreDropdownOpen = ref(false);
const isTypeDropdownOpen = ref(false);
const selectedCard = ref<Card | null>(null);
const showStatsModal = ref(false);

const typeOptions = DECKBUILDER_TYPE_OPTIONS;

const filteredLibrary = computed(() =>
  props.allCards.filter((c) => {
    if (c.type === "Costruttore") return false;
    const nameMatch = c.name
      .toLowerCase()
      .includes(editorSearchQuery.value.toLowerCase());
    const typeMatch =
      !editorSelectedType.value || c.type === editorSelectedType.value;
    return nameMatch && typeMatch;
  }),
);

const totalCards = computed(() =>
  currentDeck.value.reduce((sum, item) => sum + item.count, 0),
);

const totalFrammenti = computed(() =>
  currentDeck.value.reduce((sum, item) => {
    const isFragmento = FRAGMENT_TYPES.includes(
      item.card.type as (typeof FRAGMENT_TYPES)[number],
    );
    return isFragmento ? sum + item.count : sum;
  }, 0),
);

const totalEvents = computed(() =>
  currentDeck.value.reduce((sum, item) => {
    const isEvent = EVENT_TYPES.includes(
      item.card.type as (typeof EVENT_TYPES)[number],
    );
    return isEvent ? sum + item.count : sum;
  }, 0),
);

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
  const cardsWithRp = currentDeck.value.filter(
    (item) => item.card.rp !== null,
  );
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

const selectedCardCount = computed(
  () =>
    currentDeck.value.find((d) => d.card.id === selectedCard.value?.id)
      ?.count ?? 0,
);

const getLimit = (rarity: string) => {
  if (rarity === "Critica") return 1;
  if (rarity === "Instabile") return 2;
  return 3;
};

const addToDeck = (card: Card) => {
  if (totalCards.value >= 40) return;
  const cardLimit = getLimit(card.rarity);
  const existing = currentDeck.value.find((item) => item.card.id === card.id);
  if (existing) {
    if (existing.count < cardLimit) existing.count++;
  } else {
    currentDeck.value.push({ card, count: 1 });
  }
};

const removeFromDeck = (card: Card) => {
  const index = currentDeck.value.findIndex(
    (item) => item.card.id === card.id,
  );
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
    notifications.error("IL MAZZO DEVE CONTENERE ESATTAMENTE 40 CARTE.");
    return;
  }
  if (!selectedCostruttore.value) {
    notifications.error(
      "SELEZIONA UN COSTRUTTORE PER SINCRONIZZARE IL MAZZO.",
    );
    return;
  }

  let includeId = false;
  if (editingDeckId.value) {
    const normalizedCurrentName = deckName.value.trim().toLowerCase();
    const normalizedOriginalName = originalDeckName.value.trim().toLowerCase();
    const hasRenamedDeck =
      normalizedCurrentName.length > 0 &&
      normalizedCurrentName !== normalizedOriginalName;
    includeId = !hasRenamedDeck;
  }

  const payload: SavedDeck = {
    ...(includeId && editingDeckId.value ? { id: editingDeckId.value } : {}),
    name: deckName.value,
    costruttoreId: selectedCostruttore.value.id,
    cards: currentDeck.value.map((item) => ({
      cardId: item.card.id,
      count: item.count,
    })),
    isPublic: isPublic.value,
  };

  emit("save", payload);
};

const handleImgError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = "none";
};

onMounted(() => {
  if (props.initialDeck) {
    const deck = props.initialDeck;
    deckName.value = deck.name;
    originalDeckName.value = deck.name;
    editingDeckId.value = deck.id || null;
    isPublic.value = deck.isPublic || false;
    selectedCostruttore.value =
      props.allCards.find(
        (c) => String(c.id) === String(deck.costruttoreId),
      ) || null;
    currentDeck.value = deck.cards
      .map((dc) => {
        const card = props.allCards.find(
          (c) => String(c.id) === String(dc.cardId),
        );
        return card ? { card, count: dc.count } : null;
      })
      .filter(Boolean) as DeckCard[];
  }
});
</script>

<template>
  <div class="builder-layout">
    <div class="side-panel left-side">
      <div class="glass-panel library-panel">
        <div class="library-header">
          <h3 class="uppercase-title">ARCHIVIO FRAMMENTI</h3>
          <button
            class="cyber-btn btn-primary small-btn"
            @click="emit('back')"
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
            v-click-outside="() => (isTypeDropdownOpen = false)"
            class="custom-dropdown"
          >
            <div
              class="dropdown-trigger small"
              @click.stop="isTypeDropdownOpen = !isTypeDropdownOpen"
            >
              {{ editorSelectedType || "Tutti i tipi" }}
              <span class="arrow" :class="{ open: isTypeDropdownOpen }">▼</span>
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
              v-click-outside="
                () => (isEditorCostruttoreDropdownOpen = false)
              "
              class="custom-dropdown"
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
                >▼</span>
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
              <input v-model="isPublic" type="checkbox" />
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
              CARTE: <span>{{ totalCards }}</span>/40
            </div>
            <button
              class="cyber-btn btn-primary stats-trigger-btn"
              title="Analisi Statistica"
              @click="showStatsModal = true"
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
            class="cyber-btn btn-primary full-width"
            :disabled="isSaving"
            @click="saveDeck"
          >
            {{ isSaving ? "SINCRONIZZAZIONE..." : "SALVA LINEA TEMPORALE" }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <CardPreviewModal
    :card="selectedCard"
    :current-count="selectedCardCount"
    @close="selectedCard = null"
    @add="addToDeck"
    @remove="removeFromDeck"
  />

  <DeckStatsModal
    :show="showStatsModal"
    :total-cards="totalCards"
    :cost-curve="costCurve"
    :average-pep="averagePep"
    :average-rp="averageRp"
    :type-distribution="typeDistribution"
    @close="showStatsModal = false"
  />
</template>

<style scoped>
/* ── Dropdown (duplicated from parent — scoped CSS cannot be inherited) ── */
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

.dropdown-trigger:hover { border-color: var(--accent-gold); }

.dropdown-trigger .arrow {
  margin-left: auto;
  font-size: 0.7rem;
  transition: transform 0.3s;
  color: #fff;
}

.dropdown-trigger .arrow.open { transform: rotate(180deg); }

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  z-index: 999;
  background: rgba(10, 15, 25, 0.98);
  backdrop-filter: blur(15px);
  border: 1px solid var(--accent-gold);
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

.dropdown-item:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-main); }
.dropdown-item.active { background: rgba(212, 175, 55, 0.12); color: var(--accent-gold); }

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.slide-up-enter-active,
.slide-up-leave-active { transition: all 0.3s ease-out; }
.slide-up-enter-from,
.slide-up-leave-to { opacity: 0; transform: translateY(10px); }

/* ── Editor Layout ── */
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

.library-grid-container::-webkit-scrollbar { width: 6px; }
.library-grid-container::-webkit-scrollbar-button { height: 0; width: 0; }
.library-grid-container::-webkit-scrollbar-track {
  background: rgba(212, 175, 55, 0.08);
  border-radius: 10px;
}
.library-grid-container::-webkit-scrollbar-thumb {
  background: var(--accent-gold);
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
  border-color: var(--accent-gold);
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

/* ── Right Panel: Deck Config ── */
.costruttore-area { margin-top: 1rem; }

.costruttore-area label {
  display: block;
  font-family: var(--font-display);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  color: var(--accent-gold);
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

.checkbox-container input { display: none; }

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid var(--accent-gold);
  border-radius: 4px;
  position: relative;
}

.checkbox-container input:checked + .checkmark::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--accent-gold);
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 0 0 5px var(--accent-gold);
}

.deck-name-input {
  background: none;
  border: none;
  border-bottom: 2px solid var(--accent-gold);
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

/* ── Stats Bar ── */
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

.stat.success {
  color: #00ff88;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.4);
}

.composition-hints {
  display: flex;
  gap: 1.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* ── Deck List ── */
.current-deck-list {
  flex: 0 1 auto;
  max-height: 42vh;
  overflow-y: auto;
  margin: 1rem 0;
  padding-right: 0.6rem;
}

.current-deck-list::-webkit-scrollbar { width: 6px; }
.current-deck-list::-webkit-scrollbar-button { height: 0; width: 0; }
.current-deck-list::-webkit-scrollbar-track {
  background: rgba(212, 175, 55, 0.08);
  border-radius: 10px;
}
.current-deck-list::-webkit-scrollbar-thumb {
  background: var(--accent-gold);
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

.empty-deck {
  color: var(--text-muted);
  text-align: center;
  padding: 2rem;
  font-style: italic;
}

/* ── Action Buttons ── */
.editor-actions { padding-top: 1rem; }

.full-width { width: 100%; }

.cyan-bg {
  background: var(--accent-gold) !important;
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

/* ── Responsive ── */
@media (max-width: 1100px) {
  .builder-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
}

@media (max-width: 768px) {
  .builder-layout { gap: 1rem; }

  .right-side { order: -1; }

  .side-panel .glass-panel { padding: 1rem; }

  .library-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .library-header .small-btn {
    width: 100%;
    text-align: center;
  }

  .uppercase-title { font-size: 1rem; letter-spacing: 1px; }

  .filters { grid-template-columns: 1fr; }

  .cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
    padding: 0.75rem 0 0;
  }

  .card-item { padding: 0.75rem; gap: 0.65rem; }

  .card-header.stacked { gap: 0.55rem; }

  .card-header h3 { font-size: 0.8rem; }

  .deck-name-input { font-size: 1.15rem; }

  .checkbox-container { align-items: flex-start; line-height: 1.35; }

  .stats-bar-top { gap: 0.75rem; }

  .stat { font-size: 1rem; }

  .composition-hints {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }

  .current-deck-list { max-height: none; padding-right: 0; }

  .deck-row {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.65rem;
    padding: 0.7rem 0.35rem;
  }

  .deck-row .name { min-width: 0; font-size: 0.9rem; line-height: 1.3; }

  .row-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
    margin-left: 0;
    gap: 0.55rem;
  }

  .editor-actions .cyber-btn { width: 100%; }

  .custom-dropdown { min-width: 100%; }
}

@media (max-width: 480px) {
  .cards-grid { grid-template-columns: 1fr; }

  .dropdown-item { padding: 0.85rem 0.9rem; gap: 0.7rem; font-size: 0.85rem; }

  .deck-row { grid-template-columns: 1fr; }

  .deck-row .count { font-size: 0.8rem; }

  .row-actions { justify-content: stretch; }

  .row-actions .extra-small { flex: 1 1 0; width: auto !important; }
}
</style>
