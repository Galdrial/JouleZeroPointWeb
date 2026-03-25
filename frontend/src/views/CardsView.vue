<script setup lang="ts">
import axios from "axios";
import { computed, onMounted, ref, watch } from "vue";

const cards = ref<any[]>([]);
const loading = ref(true);
const error = ref("");

// Filtri Reattivi
const searchQuery = ref("");
const selectedType = ref("");
const filterEt = ref(10);
const filterPep = ref(10);
const filterRp = ref(10);

// Stato Modal
const selectedCard = ref<any | null>(null);

// Stato Filtri
const showFilters = ref(false);
const isTypeDropdownOpen = ref(false);

// Paginazione
const currentPage = ref(1);
const itemsPerPage = 20;
const types = [
  { value: "", label: "Tutti", color: "transparent" },
  { value: "Solido", label: "Solido", color: "#007bff" },
  { value: "Liquido", label: "Liquido", color: "#28a745" },
  { value: "Gas", label: "Gas", color: "#fd7e14" },
  { value: "Plasma", label: "Plasma", color: "#dc3545" },
  { value: "Materia Oscura", label: "Materia Oscura", color: "#bf00ff" }, // Neon Purple
  { value: "Evento", label: "Evento", color: "#cd7f32" },
  { value: "Anomalia", label: "Anomalia", color: "#e0e0e0" }, // Lighter Silver
  { value: "Costruttore", label: "Costruttore", color: "#ffd700" },
];

const selectType = (type: string) => {
  selectedType.value = type;
  isTypeDropdownOpen.value = false;
};

// Stato Ordinamento
const sortBy = ref("id");
const isSortDropdownOpen = ref(false);
const sortOptions = [
  { value: "id", label: "Default (ID)" },
  { value: "name", label: "Nome (A-Z)" },
  { value: "cost_et", label: "Costo (ET)" },
  { value: "pep", label: "Potenza (PEP)" },
  { value: "rp", label: "Resistenza (RP)" },
];

const selectSort = (val: string) => {
  sortBy.value = val;
  isSortDropdownOpen.value = false;
};

// Blocca/Sblocca Scroll quando il modal è aperto
watch(selectedCard, (val) => {
  if (val) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
});

const handleImgError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.style.display = "none";
  target.parentElement?.classList.add("missing-image");
};

const filteredCards = computed(() => {
  return cards.value
    .filter((card) => {
      const nameMatch = card.name
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase());
      const typeMatch = !selectedType.value || card.type === selectedType.value;

      // Tutti filtri MASSIMI per coerenza visiva (barre a destra = mostrano tutto)
      // Se il filtro è attivo (< 10), mostriamo solo le carte che HANNO il valore e rientrano nel limite
      const etMatch =
        filterEt.value >= 10 ||
        (card.cost_et !== null && card.cost_et <= filterEt.value);
      const pepMatch =
        filterPep.value >= 10 ||
        (card.pep !== null && card.pep <= filterPep.value);
      const rpMatch =
        filterRp.value >= 10 || (card.rp !== null && card.rp <= filterRp.value);

      return nameMatch && typeMatch && etMatch && pepMatch && rpMatch;
    })
    .sort((a, b) => {
      if (sortBy.value === "id") return 0; // Mantieni ordine originale
      if (sortBy.value === "name") return a.name.localeCompare(b.name);
      if (sortBy.value === "pep" || sortBy.value === "rp") {
        const valA = a[sortBy.value] ?? -1;
        const valB = b[sortBy.value] ?? -1;
        return (valB as number) - (valA as number); // Decrescente per Potenza e Resistenza
      }

      // Ordinamento numerico crescente per gli altri (es: ET)
      const valA = a[sortBy.value] ?? 999;
      const valB = b[sortBy.value] ?? 999;
      return (valA as number) - (valB as number);
    });
});

const totalPages = computed(() =>
  Math.ceil(filteredCards.value.length / itemsPerPage),
);

const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredCards.value.slice(start, start + itemsPerPage);
});

// Reset pagina quando cambiano i filtri
watch(
  [searchQuery, selectedType, filterEt, filterPep, filterRp, sortBy],
  () => {
    currentPage.value = 1;
  },
);

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(async () => {
  try {
    const response = await axios.get("/api/cards");
    cards.value = response.data;
  } catch (e) {
    error.value =
      "Errore critico di sincronizzazione col Nucleo (Backend Node.js offline).";
    console.error(e);
  } finally {
    loading.value = false;
  }
});

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
</script>

<template>
  <div class="cards-view fade-in">
    <h1 class="glitch-text" data-text="DATABASE">DATABASE</h1>

    <!-- Barra di Ricerca Centrale -->
    <div class="search-container">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Es: Nucleo di Basalto"
          class="glass-input search-input"
          @keyup.enter="showFilters = false"
        />
      </div>
      <button
        class="cyber-btn btn-primary toggle-filters-btn"
        @click="showFilters = !showFilters"
      >
        {{ showFilters ? "CHIUDI FILTRI" : "FILTRI AVANZATI" }}
      </button>
    </div>

    <!-- Pannello Filtri Avanzati (Toggle) -->
    <Transition name="fade-slide">
      <div v-if="showFilters" class="glass-panel filter-panel">
        <div class="filter-group">
          <label>Tipo</label>
          <div
            class="custom-dropdown"
            v-click-outside="() => (isTypeDropdownOpen = false)"
          >
            <div
              class="dropdown-trigger"
              @click.stop="isTypeDropdownOpen = !isTypeDropdownOpen"
            >
              <span
                class="dot"
                :style="{
                  backgroundColor:
                    types.find((t) => t.value === selectedType)?.color ||
                    'transparent',
                  opacity: selectedType ? 1 : 0,
                }"
              ></span>
              {{
                types.find((t) => t.value === selectedType)?.label || "Tutti"
              }}
              <span class="arrow" :class="{ open: isTypeDropdownOpen }">▼</span>
            </div>
            <Transition name="slide-up">
              <div v-if="isTypeDropdownOpen" class="dropdown-menu glass-panel">
                <div
                  v-for="t in types"
                  :key="t.value"
                  class="dropdown-item"
                  :class="{ active: selectedType === t.value }"
                  @click.stop="selectType(t.value)"
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

        <div class="filter-group">
          <label>Ordina Per</label>
          <div
            class="custom-dropdown"
            v-click-outside="() => (isSortDropdownOpen = false)"
          >
            <div
              class="dropdown-trigger"
              @click.stop="isSortDropdownOpen = !isSortDropdownOpen"
            >
              {{ sortOptions.find((o) => o.value === sortBy)?.label }}
              <span class="arrow" :class="{ open: isSortDropdownOpen }">▼</span>
            </div>
            <Transition name="slide-up">
              <div v-if="isSortDropdownOpen" class="dropdown-menu glass-panel">
                <div
                  v-for="o in sortOptions"
                  :key="o.value"
                  class="dropdown-item"
                  :class="{ active: sortBy === o.value }"
                  @click.stop="selectSort(o.value)"
                >
                  {{ o.label }}
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <div class="filter-group">
          <label>Max ET: {{ filterEt >= 10 ? "∞" : filterEt }}</label>
          <input
            v-model.number="filterEt"
            type="range"
            min="0"
            max="10"
            step="1"
            class="glass-range"
          />
        </div>

        <div class="filter-group">
          <label>Max PEP: {{ filterPep >= 10 ? "10+" : filterPep }}</label>
          <input
            v-model.number="filterPep"
            type="range"
            min="0"
            max="10"
            step="1"
            class="glass-range"
          />
        </div>

        <div class="filter-group">
          <label>Max RP: {{ filterRp >= 10 ? "10+" : filterRp }}</label>
          <input
            v-model.number="filterRp"
            type="range"
            min="0"
            max="10"
            step="1"
            class="glass-range"
          />
        </div>

        <div class="filter-group">
          <button
            @click="
              searchQuery = '';
              selectedType = '';
              filterEt = 10;
              filterPep = 10;
              filterRp = 10;
              sortBy = 'id';
            "
            class="cyber-btn btn-danger small"
          >
            RESET
          </button>
        </div>
      </div>
    </Transition>

    <div v-if="loading" class="glass-panel main-panel text-center">
      <h3>Sincronizzazione in corso...</h3>
      <div class="loader"></div>
    </div>

    <div v-else-if="error" class="glass-panel auth-panel text-center">
      <h3 class="text-red">ERRORE IT</h3>
      <p>{{ error }}</p>
    </div>

    <div v-else class="cards-grid">
      <div
        v-for="card in paginatedCards"
        :key="card.id"
        class="glass-panel card-item"
        @click="selectedCard = card"
      >
        <div class="card-header stacked">
          <h3>{{ card.name }}</h3>
          <span class="badge" :class="card.type?.toLowerCase()"
            >{{ card.type }} | {{ card.status }}</span
          >
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

    <!-- Controlli Paginazione -->
    <div v-if="totalPages > 1" class="pagination-controls fade-in">
      <button
        class="cyber-btn btn-primary pag-btn"
        :disabled="currentPage === 1"
        @click="
          currentPage--;
          scrollToTop();
        "
      >
        ← PREV
      </button>

      <div class="page-info">
        <span>PAGINA</span>
        <span class="current-page">{{ currentPage }}</span>
        <span>DI {{ totalPages }}</span>
      </div>

      <button
        class="cyber-btn btn-primary pag-btn"
        :disabled="currentPage === totalPages"
        @click="
          currentPage++;
          scrollToTop();
        "
      >
        NEXT →
      </button>
    </div>

    <!-- Modal Ingrandimento via Teleport per evitare problemi di posizionamento -->
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
              <div class="modal-image-container">
                <img
                  :src="selectedCard.image_url"
                  :alt="selectedCard.name"
                  @error="handleImgError"
                />
              </div>
              <div class="modal-info">
                <h2>{{ selectedCard.name }}</h2>
                <div class="badge-row">
                  <span
                    class="badge"
                    :class="selectedCard.type?.toLowerCase()"
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
                <p v-if="selectedCard.role" class="modal-role">
                  Ruolo: {{ selectedCard.role }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.glitch-text {
  margin-bottom: 3.5rem !important;
}
.cards-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  text-align: center; /* Centra Titolo e Sottotitolo */
  padding: 2rem;
  padding-bottom: 4rem;
  min-height: calc(100vh - 120px);
}
.cards-view h1 {
  font-size: 3.5rem;
  font-family: var(--font-display);
  letter-spacing: 0.5rem;
  background: linear-gradient(135deg, #fff 0%, var(--accent-cyan) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 3.5rem;
  text-shadow: 0 0 30px rgba(0, 240, 255, 0.3);
}
.subtitle {
  margin-bottom: 2rem;
}
.text-center {
  text-align: center;
}
.text-red {
  color: var(--accent-magenta);
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto 3rem auto; /* Centrato, reset margine superiore gestito da container */
}
@media (max-width: 1200px) {
  .cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 900px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}
.card-item {
  padding: 1rem;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.card-item:hover {
  transform: translateY(-8px);
  border-color: var(--accent-cyan);
  box-shadow: 0 10px 30px rgba(0, 240, 255, 0.15);
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
  gap: 1rem; /* Uguale al gap della .card-item per simmetria */
}
.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-main);
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
}

/* Filtri Styles */
/* Search Bar Styles */
.search-container {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 1rem;
  max-width: 800px;
  margin: 1rem auto 4rem auto; /* Più respiro sotto al titolo */
}
.search-box {
  position: relative;
  flex-grow: 1;
}
.search-icon {
  display: none; /* Rimosso icona interna */
}
.search-input {
  padding-left: 1.5rem !important; /* Ridotto padding dato che non c'è icona */
  font-size: 1.1rem;
  height: 50px;
  width: 100%;
}
.toggle-filters-btn {
  height: 50px;
  padding: 0 1.5rem;
  white-space: nowrap;
}

/* Transitions per i filtri */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.filter-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1.5rem;
  margin: -4rem auto 4rem auto; /* Offset del margine search per stare attaccato */
  max-width: 1200px; /* Limite larghezza per coerenza con la griglia */
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  align-items: flex-end;
  border-radius: 12px;
  border: 1px solid rgba(0, 240, 255, 0.2);
  position: relative;
  z-index: 100;
  text-align: left; /* Mantieni contenuti dei filtri allineati a sinistra */
}

@media (max-width: 1024px) {
  .filter-group {
    min-width: calc(50% - 0.5rem); /* Due colonne su tablet */
  }
}
@media (max-width: 600px) {
  .search-container {
    flex-direction: column;
    padding: 0 1rem;
  }
  .toggle-filters-btn {
    width: 100%;
  }
  .filter-group {
    min-width: 100%; /* Una colonna su mobile */
  }
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 150px;
}
.filter-group label {
  font-family: var(--font-display);
  font-size: 0.75rem;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 600;
}
.glass-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: var(--glass-border);
  border-radius: 2px;
  outline: none;
}
.glass-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 15px;
  height: 15px;
  background: var(--accent-cyan);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px var(--accent-cyan);
}

.badge {
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-main);
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: 1px;
}
.badge.solido {
  background: rgba(0, 123, 255, 0.2);
  border-bottom: 2px solid #007bff;
  color: #80cfff;
}
.badge.liquido {
  background: rgba(40, 167, 69, 0.2);
  border-bottom: 2px solid #28a745;
  color: #80ffc0;
}
.badge.gas {
  background: rgba(253, 126, 20, 0.2);
  border-bottom: 2px solid #fd7e14;
  color: #ffc080;
}
.badge.plasma {
  background: rgba(220, 53, 69, 0.2);
  border-bottom: 2px solid #dc3545;
  color: #ff80a0;
}
.badge.materia {
  background: rgba(138, 43, 226, 0.3);
  border-bottom: 2px solid #8a2be2;
  color: #d0a0ff;
}
.badge.evento {
  background: rgba(205, 127, 50, 0.2);
  border-bottom: 2px solid #cd7f32;
  color: #dfaf80;
}
.badge.anomalia {
  background: rgba(192, 192, 192, 0.2);
  border-bottom: 2px solid #c0c0c0;
  color: #e0e0e0;
}
.badge.costruttore {
  background: rgba(255, 215, 0, 0.2);
  border-bottom: 2px solid #ffd700;
  color: #fff080;
}

.card-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.card-stats p {
  background: rgba(0, 0, 0, 0.3);
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  font-family: var(--font-display);
  color: var(--accent-cyan);
}
.card-stats strong {
  color: var(--text-muted);
  font-size: 0.8rem;
  margin-right: 4px;
}
.card-effect p {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #ccd6f6;
  flex-grow: 1;
}
.card-role {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 0.5rem;
  font-style: italic;
}

.card-image-container {
  margin-top: auto;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  border: 1px dashed rgba(255, 255, 255, 0.05);
}

/* Custom Dropdown Styles */
.custom-dropdown {
  position: relative;
  width: 100%;
  min-width: 180px; /* Misura fissa per stabilità layout */
}
.dropdown-trigger {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: var(--text-main);
  padding: 0.6rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-family: var(--font-body);
  transition: all 0.3s ease;
  user-select: none;
  white-space: nowrap; /* Impedisce il salto su due righe */
  overflow: hidden;
  text-overflow: ellipsis;
}
.dropdown-trigger:hover {
  border-color: var(--accent-cyan);
}
.dropdown-trigger .arrow {
  margin-left: auto;
  font-size: 0.7rem;
  transition: transform 0.3s;
  color: #fff; /* Aumentato contrasto freccia */
}
.dropdown-trigger .arrow.open {
  transform: rotate(180deg);
}
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%; /* Larghezza esatta del selettore */
  z-index: 999; /* Sotto il modal, sopra la griglia */
  background: rgba(10, 15, 25, 0.98); /* Meno trasparente per leggibilità */
  backdrop-filter: blur(15px);
  border: 1px solid var(--accent-cyan); /* Bordo ciano per separazione netta */
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8);
}
.dropdown-item {
  padding: 1rem 1.2rem; /* Più spazio per il tocco */
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
  color: #fff;
  font-size: 0.9rem;
}
.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}
.dropdown-item.active {
  background: rgba(0, 240, 255, 0.1);
  color: var(--accent-cyan);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.3); /* Bordo per visibilità su sfondo scuro */
  box-shadow: 0 0 5px currentColor;
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

.card-img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
}
.missing-image::after {
  content: "Nessuna Scansione Immagine";
  font-family: var(--font-display);
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.loader {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: var(--accent-cyan);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 9999; /* Alto valore per sovrastare tutto */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-enter-from .modal-content {
  transform: scale(0.9) translateY(20px);
}
.modal-content {
  max-width: 900px;
  width: 100%;
  background: rgba(10, 15, 25, 0.9);
  padding: 2rem;
  position: relative;
  border: 1px solid var(--accent-cyan);
  box-shadow: 0 0 50px rgba(0, 240, 255, 0.2);
}
.close-btn {
  position: absolute;
  top: 1rem;
  right: 1.5rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 2.5rem;
  cursor: pointer;
  transition: color 0.3s;
  line-height: 1;
}
.close-btn:hover {
  color: var(--accent-magenta);
}
.modal-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}
@media (max-width: 768px) {
  .modal-body {
    grid-template-columns: 1fr;
  }
}
.modal-image-container img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.modal-info h2 {
  font-family: var(--font-display);
  font-size: 2.2rem;
  margin-bottom: 1rem;
  color: var(--text-main);
  background: linear-gradient(to right, #fff, var(--accent-cyan));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.badge-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}
.rarity-badge {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  display: flex;
  align-items: center;
}
.modal-effect {
  font-size: 1.1rem;
  line-height: 1.7;
  color: #ccd6f6;
  margin-bottom: 2rem;
  font-style: italic;
}
.modal-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.stat-box {
  background: rgba(0, 240, 255, 0.05);
  padding: 0.8rem 1.2rem;
  border-radius: 10px;
  border: 1px solid rgba(0, 240, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}
.stat-box strong {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}
.stat-box span {
  font-family: var(--font-display);
  font-size: 1.4rem;
  color: var(--accent-cyan);
}
.modal-role {
  font-size: 0.9rem;
  color: var(--text-muted);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1rem;
}
/* Pagination Styles */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin: 4rem 0;
  padding: 1.5rem;
}
.page-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-family: var(--font-display);
  font-size: 0.9rem;
  letter-spacing: 1px;
}
.current-page {
  font-size: 1.4rem;
  color: #fff;
  text-shadow: 0 0 10px var(--accent-cyan);
  padding: 0 0.5rem;
}
</style>
