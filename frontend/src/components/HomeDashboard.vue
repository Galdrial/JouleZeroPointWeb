<script setup lang="ts">
interface Props {
  fragmentCount: number;
  isAuthenticated: boolean;
}

defineProps<Props>();
</script>

<template>
  <div class="dashboard-grid">
    <div class="glass-panel info-card">
      <h3>STORIA: IL PUNTO ZERO</h3>
      <p>
        In un futuro dove la realtà è stata frammentata da un collasso
        temporale, i Costruttori utilizzano i Frammenti di Joule per
        stabilizzare l'esistenza. Ogni carta è un ricordo, ogni mazzo una
        linea temporale.
      </p>
      <RouterLink to="/cards" class="link-text">
        <span>Esplora la Matrice</span>
        <svg viewBox="0 0 16 16" class="link-icon" aria-hidden="true">
          <path
            d="M6.5 3.5L11 8l-4.5 4.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </RouterLink>
    </div>

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

    <div class="glass-panel info-card highlight">
      <template v-if="isAuthenticated">
        <h3>COSTRUZIONE MAZZI</h3>
        <p>
          Assembla i Frammenti per forgiare la tua strategia, condividi i tuoi
          mazzi con la community e ricorda: Il caos è un'arma. Usalo.
        </p>
        <RouterLink to="/deckbuilder" class="cyber-btn btn-primary mini-btn"
          >COSTRUISCI IL TUO MAZZO</RouterLink
        >
      </template>
      <template v-else>
        <h3>REGISTRATI AL PUNTO ZERO</h3>
        <p>
          Crea un account per salvare i tuoi mazzi e iniziare a costruire la
          tua strategia nel Punto Zero.
        </p>
        <RouterLink to="/login" class="cyber-btn btn-primary mini-btn"
          >REGISTRATI ORA</RouterLink
        >
      </template>
    </div>
  </div>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: clamp(1rem, 2.5vw, 2rem);
  transform: translateZ(0);
  contain: paint;
}

.info-card {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.3s ease;
}

.info-card:hover {
  border-color: var(--accent-gold);
  background: rgba(255, 255, 255, 0.03);
  transform: translateY(-5px);
}

.info-card h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 2px;
  color: var(--accent-gold);
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

.value.cyan {
  color: var(--accent-gold);
  text-shadow: 0 0 10px var(--accent-gold);
}

.value.magenta {
  color: var(--accent-magenta);
  text-shadow: 0 0 10px var(--accent-magenta);
}

.link-text {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--accent-gold);
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
  margin-top: auto;
}

.link-icon {
  width: 0.9rem;
  height: 0.9rem;
  flex: 0 0 auto;
}

.mini-btn {
  margin-top: auto;
  align-self: flex-start;
  padding: 0.5rem 1.5rem;
  font-size: 0.8rem;
}

.highlight {
  border-top: 2px solid var(--accent-gold);
}
</style>
