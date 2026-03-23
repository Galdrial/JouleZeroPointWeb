<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const cards = ref<any[]>([]);
const loading = ref(true);
const error = ref('');

// Filtri Reattivi
const searchQuery = ref('');
const selectedType = ref('');
const filterEt = ref(10);
const filterPep = ref(10);
const filterRp = ref(10);

const handleImgError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
  target.parentElement?.classList.add('missing-image');
};

const filteredCards = computed(() => {
  return cards.value.filter(card => {
    const nameMatch = card.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const typeMatch = !selectedType.value || card.type === selectedType.value;
    
    // Tutti filtri MASSIMI per coerenza visiva (barre a destra = mostrano tutto)
    // Se il filtro è attivo (< 10), mostriamo solo le carte che HANNO il valore e rientrano nel limite
    const etMatch = filterEt.value >= 10 || (card.cost_et !== null && card.cost_et <= filterEt.value);
    const pepMatch = filterPep.value >= 10 || (card.pep !== null && card.pep <= filterPep.value);
    const rpMatch = filterRp.value >= 10 || (card.rp !== null && card.rp <= filterRp.value);
    
    return nameMatch && typeMatch && etMatch && pepMatch && rpMatch;
  });
});

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/cards');
    cards.value = response.data;
  } catch (e) {
    error.value = 'Errore critico di sincronizzazione col Nucleo (Backend Node.js offline).';
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="cards-view fade-in">
    <h2>Matrice Frammenti (Live)</h2>
    <p class="subtitle">Sincronizzato in tempo reale con le direttive Google Sheets.</p>
    
    <!-- Pannello Filtri -->
    <div class="glass-panel filter-panel">
      <div class="filter-group">
        <label>Ricerca Nome</label>
        <input v-model="searchQuery" type="text" placeholder="Es: Nucleo..." class="glass-input small" />
      </div>
      
      <div class="filter-group">
        <label>Tipo</label>
        <select v-model="selectedType" class="glass-select">
          <option value="">Tutti</option>
          <option value="Solido">Solido</option>
          <option value="Liquido">Liquido</option>
          <option value="Gas">Gas</option>
          <option value="Plasma">Plasma</option>
          <option value="Materia Oscura">Materia Oscura</option>
          <option value="Evento">Evento</option>
          <option value="Anomalia">Anomalia</option>
          <option value="Costruttore">Costruttore</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Max ET: {{ filterEt >= 10 ? '∞' : filterEt }}</label>
        <input v-model.number="filterEt" type="range" min="0" max="10" step="1" class="glass-range" />
      </div>

      <div class="filter-group">
        <label>Max PEP: {{ filterPep >= 10 ? '10+' : filterPep }}</label>
        <input v-model.number="filterPep" type="range" min="0" max="10" step="1" class="glass-range" />
      </div>

      <div class="filter-group">
        <label>Max RP: {{ filterRp >= 10 ? '10+' : filterRp }}</label>
        <input v-model.number="filterRp" type="range" min="0" max="10" step="1" class="glass-range" />
      </div>

      <div class="filter-group">
        <button @click="searchQuery = ''; selectedType = ''; filterEt = 10; filterPep = 10; filterRp = 10;" class="btn-clear">RESET</button>
      </div>
    </div>
    
    <div v-if="loading" class="glass-panel main-panel text-center">
      <h3>Sincronizzazione in corso...</h3>
      <div class="loader"></div>
    </div>
    
    <div v-else-if="error" class="glass-panel auth-panel text-center">
      <h3 class="text-red">ERRORE IT</h3>
      <p>{{ error }}</p>
    </div>

    <div v-else class="cards-grid">
      <div v-for="card in filteredCards" :key="card.id" class="glass-panel card-item">
        <div class="card-header">
          <h3>{{ card.name }}</h3>
          <span class="badge" :class="card.type?.toLowerCase()">{{ card.type }} <!-- {{ card.status }} --></span>
        </div>
        <div class="card-stats">
          <p title="Energia Temporale"><strong>ET:</strong> {{ card.cost_et !== null ? card.cost_et : '-' }}</p>
          <p title="Potenziale Energetico Presente"><strong>PEP:</strong> {{ card.pep !== null ? card.pep : '-' }}</p>
          <p title="Resistenza Passata"><strong>RP:</strong> {{ card.rp !== null ? card.rp : '-' }}</p>
        </div>
        <div class="card-effect">
          <p><em>{{ card.effect }}</em></p>
        </div>
        <div v-if="card.role" class="card-role">
          Ruolo: {{ card.role }}
        </div>
        <div class="card-image-container">
          <img :src="card.image_url" :alt="card.name" class="card-img" @error="handleImgError" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-center {
  text-align: center;
}
.text-red {
  color: var(--accent-magenta);
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
}
.card-item {
  padding: 1.5rem;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  flex-direction: column;
}
.card-item:hover {
  transform: translateY(-8px);
  border-color: var(--accent-cyan);
  box-shadow: 0 10px 30px rgba(0, 240, 255, 0.15);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 1rem;
}
.card-header h3 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--text-main);
  text-shadow: 0 0 5px rgba(255,255,255,0.2);
}

/* Filtri Styles */
.filter-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  background: rgba(0, 0, 0, 0.4);
  align-items: flex-end;
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
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.glass-input.small {
  padding: 0.5rem;
  margin-bottom: 0;
}
.glass-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: var(--text-main);
  padding: 0.5rem;
  border-radius: 4px;
  font-family: var(--font-body);
  outline: none;
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
.btn-clear {
  background: transparent;
  border: 1px solid var(--accent-magenta);
  color: var(--accent-magenta);
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 0.8rem;
  transition: all 0.3s ease;
}
.btn-clear:hover {
  background: var(--accent-magenta);
  color: white;
}

.badge {
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  background: rgba(255,255,255,0.1);
  color: var(--text-main);
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: 1px;
}
.badge.solido { background: rgba(100, 100, 100, 0.5); border-bottom: 2px solid #a0a0a0; }
.badge.liquido { background: rgba(0, 100, 255, 0.3); border-bottom: 2px solid #00a2ff; color: #80cfff; }
.badge.gas { background: rgba(0, 255, 100, 0.3); border-bottom: 2px solid #00ff88; color: #80ffc0; }
.badge.plasma { background: rgba(255, 0, 60, 0.3); border-bottom: 2px solid var(--accent-magenta); color: #ff80a0; }
.badge.materia { background: rgba(138, 43, 226, 0.3); border-bottom: 2px solid #8a2be2; color: #d0a0ff; }
.badge.evento, .badge.anomalia, .badge.costruttore { background: rgba(255, 200, 0, 0.2); color: #ffcc00; }

.card-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.card-stats p {
  background: rgba(0,0,0,0.3);
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
  border-top: 1px solid rgba(255,255,255,0.05);
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
  border: 1px dashed rgba(255,255,255,0.05);
}
.card-img {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
}
.missing-image::after {
  content: 'Nessuna Scansione Immagine';
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
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
