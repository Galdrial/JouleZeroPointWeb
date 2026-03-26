<script setup lang="ts">
import axios from "axios";
import { onMounted, ref } from "vue";
import heroImg from "../assets/hero.png";

const fragmentCount = ref(120); // Default placeholder
const tabletopGuideUrl = "#";
const discordInviteUrl = "#";

const particleStyles = Array.from({ length: 64 }, () => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  "--size": `${(1.4 + Math.random() * 2.8).toFixed(2)}px`,
  "--alpha": (0.35 + Math.random() * 0.5).toFixed(2),
  "--duration": `${(5.5 + Math.random() * 8).toFixed(2)}s`,
  "--delay": `${(-Math.random() * 13).toFixed(2)}s`,
  "--flicker-duration": `${(0.9 + Math.random() * 1.8).toFixed(2)}s`,
  "--flicker-delay": `${(-Math.random() * 2.5).toFixed(2)}s`,
  "--dx-start": `${(-28 + Math.random() * 56).toFixed(1)}px`,
  "--dy-start": `${(-22 + Math.random() * 44).toFixed(1)}px`,
  "--dx-end": `${(-40 + Math.random() * 80).toFixed(1)}px`,
  "--dy-end": `${(-34 + Math.random() * 68).toFixed(1)}px`,
}));

onMounted(async () => {
  try {
    const response = await axios.get("http://localhost:3000/api/cards");
    fragmentCount.value = response.data.length;
  } catch (err) {
    console.error("Errore sincronizzazione frammenti:", err);
  }
});
</script>

<template>
  <div class="home-view fade-in">
    <section class="hero-section">
      <div class="hero-image-stage">
        <img :src="heroImg" alt="Joule Zero Point Hero" class="hero-bg-image" />
        <div class="hero-particles" aria-hidden="true">
          <span
            v-for="(style, index) in particleStyles"
            :key="index"
            class="hero-particle"
            :style="style"
          ></span>
        </div>
        <div class="hero-content">
          <h1 class="hero-headline">
            In Joule non combatti solo l'avversario. Combatti l'entropia stessa.
          </h1>
          <h2 class="hero-subtitle">
            Il primo simulatore di conflitti temporali. Un Living Card Game
            competitivo basato sulla termodinamica.
          </h2>
          <div class="hero-actions">
            <a
              :href="tabletopGuideUrl"
              class="cyber-btn btn-primary hero-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              ACCEDI AL PUNTO ZERO
            </a>
            <a
              :href="discordInviteUrl"
              class="cyber-btn btn-secondary hero-btn hero-btn-community"
              target="_blank"
              rel="noopener noreferrer"
            >
              UNISCITI ALLA COMMUNITY
            </a>
          </div>
          <div class="hero-meta">
            <span class="hero-status"
              >⚡ BETA APERTA SU TABLETOP + DISCORD</span
            >
          </div>
        </div>
      </div>
    </section>

    <div class="dashboard-grid">
      <!-- Lore Section -->
      <div class="glass-panel info-card">
        <h3>LORE: IL PUNTO ZERO</h3>
        <p>
          In un futuro dove la realtà è stata frammentata da un collasso
          temporale, i Costruttori utilizzano i Frammenti di Joule per
          stabilizzare l'esistenza. Ogni carta è un ricordo, ogni mazzo una
          linea temporale.
        </p>
        <RouterLink to="/cards" class="link-text"
          >Scopri la Matrice →</RouterLink
        >
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
        <p>
          Assembla i tuoi Frammenti per forgiare la tua strategia. Ricorda: 40
          carte, 3 copie per frammento stabile.
        </p>
        <RouterLink to="/deckbuilder" class="cyber-btn btn-primary mini-btn"
          >DECKBUILDER</RouterLink
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
}

.hero-section {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 3.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.hero-image-stage {
  position: relative;
  width: 100vw;
  text-align: center;
  overflow: hidden;
  isolation: isolate;
}

.hero-bg-image {
  position: relative;
  z-index: 0;
  display: block;
  width: 100%;
  height: auto;
}

.hero-particles {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.hero-particle {
  position: absolute;
  width: var(--size);
  aspect-ratio: 1;
  border-radius: 999px;
  background: radial-gradient(
    circle at 35% 35%,
    rgba(255, 245, 210, 0.95) 0%,
    rgba(255, 196, 103, 0.9) 42%,
    rgba(255, 160, 72, 0.12) 100%
  );
  box-shadow:
    0 0 calc(var(--size) * 4.8) rgba(255, 191, 92, 0.68),
    0 0 calc(var(--size) * 8) rgba(255, 169, 66, 0.26);
  opacity: 0;
  transform: translate3d(var(--dx-start), var(--dy-start), 0) scale(0.2);
  animation:
    particle-phase var(--duration) ease-in-out var(--delay) infinite,
    particle-flicker var(--flicker-duration) steps(3, end) var(--flicker-delay)
      infinite;
}

.hero-content {
  position: absolute;
  top: clamp(16px, 2.5vw, 40px);
  bottom: clamp(2px, 1vw, 18px);
  left: clamp(140px, 18vw, 420px);
  width: min(760px, 48vw);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: clamp(0.5rem, 1vw, 1rem);
  text-align: left;
}

.hero-logo {
  width: min(420px, 60vw);
  height: auto;
  filter: drop-shadow(0 0 20px rgba(0, 240, 255, 0.35));
}

.hero-headline {
  margin: 0;
  max-width: 900px;
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2.8vw, 3rem);
  line-height: 1.1;
  color: #f7fbff;
  text-shadow: 0 8px 28px rgba(0, 0, 0, 0.7);
  transform: translateY(0);
}

.hero-subtitle {
  margin: 0;
  max-width: 780px;
  font-size: clamp(0.9rem, 1.2vw, 1.15rem);
  line-height: 1.45;
  color: rgba(226, 232, 240, 0.92);
}

.hero-actions {
  display: flex;
  gap: 0.9rem;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-top: 0.3rem;
}

.hero-btn {
  min-width: 260px;
  text-align: center;
}

.hero-btn-community {
  color: #f7fbff;
  border-color: rgba(255, 235, 170, 0.95);
  background: rgba(12, 18, 32, 0.72);
  box-shadow:
    0 0 0 1px rgba(255, 235, 170, 0.28) inset,
    0 0 20px rgba(255, 205, 120, 0.28);
  text-shadow: 0 0 8px rgba(255, 235, 190, 0.4);
}

.hero-btn-community:hover {
  border-color: rgba(255, 245, 210, 1);
  background: rgba(16, 24, 42, 0.86);
  box-shadow:
    0 0 0 1px rgba(255, 245, 210, 0.44) inset,
    0 0 26px rgba(255, 214, 140, 0.42);
}

.hero-meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: 0.35rem;
}

.hero-status {
  font-family: var(--font-display);
  letter-spacing: 0.7px;
  font-size: clamp(0.7rem, 0.9vw, 0.9rem);
  color: rgba(255, 215, 130, 0.95);
  text-shadow: 0 0 12px rgba(255, 201, 115, 0.28);
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

.value.cyan {
  color: var(--accent-cyan);
  text-shadow: 0 0 10px var(--accent-cyan);
}
.value.magenta {
  color: var(--accent-magenta);
  text-shadow: 0 0 10px var(--accent-magenta);
}

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
  .hero-image-stage {
    width: 100vw;
  }

  .hero-content {
    top: clamp(10px, 3vw, 20px);
    bottom: clamp(12px, 3vw, 22px);
    left: clamp(12px, 4vw, 24px);
    width: calc(100% - clamp(24px, 8vw, 48px));
    justify-content: flex-start;
  }

  .hero-btn {
    min-width: 0;
    width: min(100%, 340px);
  }
}

@keyframes particle-phase {
  0% {
    opacity: 0;
    transform: translate3d(var(--dx-start), var(--dy-start), 0) scale(0.18);
  }
  20% {
    opacity: var(--alpha);
    transform: translate3d(
        calc(var(--dx-start) * 0.35),
        calc(var(--dy-start) * 0.35),
        0
      )
      scale(0.9);
  }
  70% {
    opacity: var(--alpha);
    transform: translate3d(
        calc(var(--dx-end) * 0.55),
        calc(var(--dy-end) * 0.55),
        0
      )
      scale(1.04);
  }
  100% {
    opacity: 0;
    transform: translate3d(var(--dx-end), var(--dy-end), 0) scale(0.22);
  }
}

@keyframes particle-flicker {
  0%,
  100% {
    filter: brightness(0.88);
  }
  35% {
    filter: brightness(1.28);
  }
  62% {
    filter: brightness(0.78);
  }
}
</style>
