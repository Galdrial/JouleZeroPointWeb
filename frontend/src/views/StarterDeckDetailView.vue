<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../utils/api';
import { STARTER_DECKS } from '../constants/starterDecks';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notificationStore';
import { useCardStore } from '../stores/cardStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cardStore = useCardStore();
const notifications = useNotificationStore();

const deck = computed(() => {
  return STARTER_DECKS.find(d => d.id === route.params.id);
});

const isImporting = ref(false);

const getCardName = (id: string) => {
  const card = cardStore.cards.find(c => String(c.id) === String(id));
  return card ? card.name : `Frammento #${id}`;
};

const handleImport = async () => {
  if (!authStore.isLoggedIn) {
    notifications.info('Effettua il login per importare questo mazzo nella tua collezione.');
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }

  if (!deck.value) return;

  isImporting.value = true;
  try {
    notifications.info(`Inizializzazione protocollo di importazione per ${deck.value.name}...`);
    
    // Map IDs to the format expected by the backend
    const deckPayload = {
      name: `Starter: ${deck.value.name}`,
      costruttoreId: deck.value.costruttoreId,
      cards: deck.value.cards.map(c => ({
        cardId: c.id,
        count: c.count
      })),
      isPublic: false
    };

    await api.post('/decks', deckPayload);
    
    notifications.success(`Mazzo "${deck.value.name}" sincronizzato con successo nella tua collezione!`);
    router.push({ name: 'deckbuilder' });
    
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || "Errore durante l'interfacciamento con la Matrice Joule.";
    notifications.error(errorMsg);
  } finally {
    isImporting.value = false;
  }
};

onMounted(async () => {
  if (!deck.value) {
    router.push({ name: 'not-found' });
    return;
  }
  
  if (cardStore.cards.length === 0) {
    await cardStore.fetchCards();
  }
});
</script>

<template>
  <div v-if="deck" class="deck-detail-view" :style="{ '--deck-color': deck.color, '--deck-glow': deck.glow }">
    <!-- Hero Section -->
    <div class="deck-hero">
      <div class="hero-image-container">
        <img 
          v-if="deck" 
          :src="deck.imageUrl" 
          :alt="deck.name" 
          class="hero-image" 
          :style="{ objectPosition: deck.objectPosition || 'center bottom' }"
        />
        <div class="hero-overlay"></div>
      </div>
      
      <div class="hero-content">
        <div class="content-inner">
          <RouterLink to="/" class="back-link">
            <svg viewBox="0 0 24 24" class="back-icon"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
            TORNA ALLA HOME
          </RouterLink>
          
          <span class="deck-style-tag">{{ deck.style }}</span>
          <h1 class="deck-title">{{ deck.name }}</h1>
          
          <div class="deck-meta">
            <div class="meta-item">
              <span class="label">Difficoltà</span>
              <div class="difficulty-display">
                <span class="value">{{ deck.difficultyLabel }}</span>
                <div class="difficulty-bars">
                  <div v-for="i in 5" :key="i" class="diff-bar" :class="{ active: i <= deck.difficulty }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div class="deck-body">
      <div class="body-grid">
        <div class="main-info">
          <section class="info-section">
            <h3>DESCRIZIONE TATTICA</h3>
            <p class="long-desc">{{ deck.longDesc }}</p>
          </section>

          <section class="info-section cards-section">
            <div class="section-header">
              <h3>COMPOSIZIONE MAZZO</h3>
              <span class="card-count">40 CARTE</span>
            </div>
            <div class="deck-preview-grid">
              <div v-for="item in deck.cards" :key="item.id" class="card-preview-item glass-panel">
                <span class="card-id">{{ getCardName(item.id) }}</span>
                <span class="card-qty">x{{ item.count }}</span>
              </div>
            </div>
          </section>
        </div>

        <aside class="actions-sidebar">
          <div class="glass-panel actions-card">
            <h4>SINCRONIZZAZIONE</h4>
            <p>Importa questo mazzo nella tua collezione per iniziare a giocare o per usarlo come base nel Deckbuilder.</p>
            
            <button 
              @click="handleImport" 
              class="cyber-btn btn-primary import-btn"
              :disabled="isImporting"
            >
              <span v-if="!isImporting">IMPORTA MAZZO</span>
              <span v-else class="importing-text">IMPORTAZIONE IN CORSO...</span>
            </button>
            
            <p v-if="!authStore.isLoggedIn" class="auth-hint">
              Richiede l'accesso.
            </p>
          </div>

          <div class="glass-panel stats-card">
            <h4>FOCUS STRATEGICO</h4>
            <div class="stat-bars">
              <div class="stat-bar-item">
                <div class="bar-header"><span>Offensiva</span><span>{{ deck.stats.attacco * 10 }}%</span></div>
                <div class="bar-bg"><div class="bar-fill" :style="{ width: (deck.stats.attacco * 10) + '%', background: deck.color }"></div></div>
              </div>
              <div class="stat-bar-item">
                <div class="bar-header"><span>Difesa</span><span>{{ deck.stats.difesa * 10 }}%</span></div>
                <div class="bar-bg"><div class="bar-fill" :style="{ width: (deck.stats.difesa * 10) + '%', background: deck.color }"></div></div>
              </div>
              <div class="stat-bar-item">
                <div class="bar-header"><span>Velocità</span><span>{{ deck.stats.velocita * 10 }}%</span></div>
                <div class="bar-bg"><div class="bar-fill" :style="{ width: (deck.stats.velocita * 10) + '%', background: deck.color }"></div></div>
              </div>
              <div class="stat-bar-item">
                <div class="bar-header"><span>Controllo</span><span>{{ deck.stats.controllo * 10 }}%</span></div>
                <div class="bar-bg"><div class="bar-fill" :style="{ width: (deck.stats.controllo * 10) + '%', background: deck.color }"></div></div>
              </div>
              <div class="stat-bar-item">
                <div class="bar-header"><span>Interferenza</span><span>{{ deck.stats.interferenza * 10 }}%</span></div>
                <div class="bar-bg"><div class="bar-fill" :style="{ width: (deck.stats.interferenza * 10) + '%', background: deck.color }"></div></div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.deck-detail-view {
  min-height: 100vh;
  background: #020617;
  color: #fff;
  padding-bottom: 4rem;
}

/* Hero Section */
.deck-hero {
  position: relative;
  width: 100%;
  height: 70vh;
  min-height: 500px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.hero-image-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.7) contrast(1.1);
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, 
    rgba(2, 6, 23, 0.2) 0%, 
    rgba(2, 6, 23, 0.6) 50%, 
    rgba(2, 6, 23, 1) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 1.5px;
  margin-bottom: 2rem;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: var(--deck-color);
}

.back-icon {
  width: 18px;
  height: 18px;
}

.deck-style-tag {
  display: block;
  font-family: var(--font-display);
  color: var(--deck-color);
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-bottom: 0.5rem;
}

.deck-title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  line-height: 1.1;
  margin-bottom: 2rem;
  text-transform: uppercase;
  letter-spacing: -1px;
}

.deck-meta {
  display: flex;
  gap: 3rem;
}

.meta-item .label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 2px;
  margin-bottom: 0.5rem;
}

.difficulty-display {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.difficulty-display .value {
  font-size: 1.2rem;
  font-family: var(--font-display);
}

.difficulty-bars {
  display: flex;
  gap: 6px;
}

.diff-bar {
  width: 20px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.diff-bar.active {
  background: var(--deck-color);
  box-shadow: 0 0 10px var(--deck-glow);
}

/* Body Section */
.deck-body {
  max-width: 1200px;
  margin: -2rem auto 0;
  padding: 0 2rem;
  position: relative;
  z-index: 20;
}

.body-grid {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 4rem;
}

.info-section {
  margin-bottom: 4rem;
}

.info-section h3 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 2px;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.long-desc {
  font-size: 1.15rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header h3 {
  border-bottom: none;
  margin-bottom: 0.5rem;
}

.card-count {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
}

.deck-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.card-preview-item {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 3px solid var(--deck-color);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-preview-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3), 0 0 10px var(--deck-glow);
}

.card-id {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: #fff;
}

.card-qty {
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--deck-color);
  font-weight: bold;
}

/* Sidebar */
.actions-sidebar {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.actions-card, .stats-card {
  padding: 2rem;
}

.actions-card h4, .stats-card h4 {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 2px;
  margin-bottom: 1rem;
  color: var(--deck-color);
}

.actions-card p {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.import-btn {
  width: 100%;
  padding: 1rem;
  margin-bottom: 1rem;
}

.auth-hint {
  font-size: 0.75rem;
  text-align: center;
  color: rgba(255, 77, 77, 0.8);
  margin-bottom: 0 !important;
}

.stat-bars {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stat-bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.bar-bg {
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 1s ease-out;
}

/* Responsive */
@media (max-width: 1024px) {
  .body-grid {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
}

@media (max-width: 768px) {
  .deck-hero {
    height: 60vh;
  }
  
  .hero-content {
    padding: 0 1rem 3rem;
  }
  
  .deck-body {
    padding: 0 1rem;
  }
}
</style>
