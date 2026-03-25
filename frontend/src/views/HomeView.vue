<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const fragmentCount = ref(120); // Default placeholder

onMounted(async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/cards');
    fragmentCount.value = response.data.length;
  } catch (err) {
    console.error('Errore sincronizzazione frammenti:', err);
  }
});
</script>

<template>
  <div class="home-view fade-in">
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="glitch-text" data-text="PUNTO ZERO">PUNTO ZERO</h1>
        <p class="hero-subtitle">Il limite dove la Materia incontra il Vuoto.</p>
        <div class="hero-actions">
          <RouterLink to="/cards" class="cyber-btn btn-primary">VISITA IL DATABASE</RouterLink>
        </div>
      </div>
    </section>

    <div class="dashboard-grid">
      <!-- Lore Section -->
      <div class="glass-panel info-card">
        <h3>LORE: IL PUNTO ZERO</h3>
        <p>In un futuro dove la realtà è stata frammentata da un collasso temporale, i Costruttori utilizzano i Frammenti di Joule per stabilizzare l'esistenza. Ogni carta è un ricordo, ogni mazzo una linea temporale.</p>
        <RouterLink to="/cards" class="link-text">Scopri la Matrice →</RouterLink>
      </div>

      <!-- Quick Stats / News -->
      <div class="glass-panel info-card">
        <h3>STATO MATRICE</h3>
        <div class="stats-list">
          <div class="stat-item">
            <span class="label">Frammenti Rilevati:</span>
            <span class="value">{{ fragmentCount }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Stabilità Sistema:</span>
            <span class="value cyan">88%</span>
          </div>
          <div class="stat-item">
            <span class="label">Anomalie Attive:</span>
            <span class="value magenta">4</span>
          </div>
        </div>
      </div>

      <!-- Deckbuilder Shortcut -->
      <div class="glass-panel info-card highlight">
        <h3>COSTRUZIONE MAZZI</h3>
        <p>Assembla i tuoi Frammenti per forgiare la tua strategia. Ricorda: 40 carte, 3 copie per frammento stabile.</p>
        <RouterLink to="/deckbuilder" class="cyber-btn btn-primary mini-btn">DECKBUILDER</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero-section {
  height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: radial-gradient(circle at center, rgba(0, 240, 255, 0.05) 0%, transparent 70%);
  margin-bottom: 3rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.hero-content h1 {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--text-muted);
  letter-spacing: 4px;
  margin-bottom: 3rem;
  text-transform: uppercase;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.info-card {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.3s ease;
}

.info-card:hover {
  border-color: var(--accent-cyan);
  background: rgba(255, 255, 255, 0.03);
  transform: translateY(-5px);
}

.info-card h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 2px;
  color: var(--accent-cyan);
  margin-bottom: 0.5rem;
}

.info-card p {
  line-height: 1.6;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 0.5rem;
}

.value.cyan { color: var(--accent-cyan); text-shadow: 0 0 10px var(--accent-cyan); }
.value.magenta { color: var(--accent-magenta); text-shadow: 0 0 10px var(--accent-magenta); }

.link-text {
  color: var(--accent-cyan);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
  margin-top: auto;
}

.mini-btn {
  margin-top: auto;
  align-self: flex-start;
  padding: 0.5rem 1.5rem;
  font-size: 0.8rem;
}

.highlight {
  border-top: 2px solid var(--accent-cyan);
}

@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 3.5rem;
  }
  .hero-actions {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
