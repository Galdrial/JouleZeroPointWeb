<script setup lang="ts">
import { onMounted, ref } from "vue";

const TABLETOP_URL =
  "https://steamcommunity.com/sharedfiles/filedetails/?id=3673801132";
const DISCORD_URL = "https://discord.gg/kjFWC5Uj";

const particleStyles = ref<Record<string, string>[]>([]);

const generateParticles = () => {
  const count = window.innerWidth < 768 ? 18 : 150;
  particleStyles.value = Array.from({ length: count }, () => ({
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
};

onMounted(() => {
  const isMobile = window.innerWidth < 768;
  setTimeout(generateParticles, isMobile ? 1200 : 500);
});
</script>

<template>
  <section class="hero-section">
    <div class="hero-image-stage">
      <img
        src="/images/hero.webp"
        srcset="/images/hero-mobile.webp 800w, /images/hero.webp 1920w"
        sizes="(max-width: 768px) 100vw, 1920px"
        alt="Joule Zero Point Hero Image"
        width="1920"
        height="1080"
        class="hero-bg-image"
        fetchpriority="high"
        loading="eager"
        decoding="sync"
      />
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
            :href="TABLETOP_URL"
            class="cyber-btn btn-primary hero-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            GIOCA SU TABLETOP
          </a>
          <a
            :href="DISCORD_URL"
            class="cyber-btn btn-secondary hero-btn hero-btn-community"
            target="_blank"
            rel="noopener noreferrer"
          >
            ENTRA NELLA COMMUNITY
          </a>
        </div>
        <div class="hero-meta">
          <span class="hero-status"
            >⚡ BETA SU TABLETOP SIMULATOR + CANALE DISCORD DEDICATO</span
          >
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
  margin-bottom: clamp(2rem, 5vw, 3.6rem);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transform: translateZ(0);
  contain: paint;
}

.hero-image-stage {
  position: relative;
  width: 100vw;
  height: auto;
  text-align: center;
  overflow: hidden;
  isolation: isolate;
  background: #05070c;
}

.hero-bg-image {
  position: relative;
  z-index: 0;
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  object-position: center bottom;
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
    particle-flicker var(--flicker-duration) steps(3, end)
      var(--flicker-delay) infinite;
}

@media (max-width: 767px) {
  .hero-particle {
    animation: particle-phase var(--duration) ease-in-out var(--delay) infinite;
  }
}

.hero-content {
  position: absolute;
  top: clamp(1rem, 2.5vw, 2.5rem);
  bottom: clamp(1rem, 3vw, 2.2rem);
  left: clamp(1rem, 18vw, 420px);
  width: min(1000px, 62vw);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: clamp(0.75rem, 1.8vw, 1.8rem);
  text-align: left;
}

.hero-headline {
  margin: 0;
  max-width: 100%;
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2.8vw, 6rem);
  line-height: 1.1;
  color: #f7fbff;
  text-shadow: 0 8px 28px rgba(0, 0, 0, 0.7);
  transform: translateY(0);
}

.hero-subtitle {
  margin: 0;
  max-width: 680px;
  font-size: clamp(0.95rem, 1.3vw, 1.25rem);
  line-height: 1.45;
  color: rgba(226, 232, 240, 0.92);
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.hero-actions {
  display: flex;
  gap: clamp(0.75rem, 1.8vw, 0.9rem);
  justify-content: flex-start;
  flex-wrap: wrap;
  margin-top: 0.3rem;
}

.hero-btn {
  min-width: min(260px, 100%);
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
  margin-top: clamp(0.8rem, 2vw, 1.6rem);
}

.hero-status {
  font-family: var(--font-display);
  letter-spacing: 0.7px;
  font-size: clamp(0.7rem, 0.9vw, 0.9rem);
  color: rgba(255, 215, 130, 0.95);
  text-shadow: 0 0 12px rgba(255, 201, 115, 0.28);
}

@media (max-width: 1500px) {
  .hero-section {
    width: calc(100% + 2rem);
    margin-left: -1rem;
    margin-right: -1rem;
  }

  .hero-image-stage {
    width: 100%;
    height: clamp(420px, 68svh, 560px);
  }

  .hero-bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 18%;
  }

  .hero-content {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: clamp(0.95rem, 3vw, 1.2rem);
    padding: clamp(1rem, 3vw, 1.2rem) clamp(0.9rem, 3vw, 1rem)
      calc(clamp(1rem, 3vw, 1.2rem) + env(safe-area-inset-bottom));
    background: linear-gradient(
      180deg,
      rgba(4, 8, 14, 0) 0%,
      rgba(4, 8, 14, 0.64) 38%,
      rgba(4, 8, 14, 0.88) 100%
    );
    text-align: center;
  }

  .hero-headline {
    font-size: clamp(1.35rem, 5.2vw, 1.8rem) !important;
    line-height: 1.18;
    transform: translateY(-3.2rem);
    width: 100%;
  }

  .hero-subtitle {
    font-size: clamp(0.95rem, 3vw, 1.05rem);
    line-height: 1.35;
    margin: 0;
    transform: translateY(-3.2rem);
    width: 100%;
  }

  .hero-actions {
    width: 100%;
    flex-direction: column;
    align-items: center;
    gap: clamp(0.75rem, 2.5vw, 0.9rem);
    margin-top: 0;
    transform: translateY(-2.4rem);
  }

  .hero-meta {
    width: 100%;
    margin-top: 0;
    align-items: center;
    transform: translateY(-0.4rem);
  }

  .hero-status {
    letter-spacing: 0.35px;
    font-size: clamp(0.72rem, 2.2vw, 0.82rem);
    text-align: center;
    width: 100%;
    max-width: 100%;
  }

  .hero-btn {
    min-width: 0;
    width: min(100%, 320px);
  }
}

@media (max-width: 326px) {
  .hero-headline {
    font-size: 1.12rem !important;
    line-height: 1.16;
  }

  .hero-subtitle {
    font-size: 0.84rem;
    line-height: 1.28;
  }
}

@media (max-height: 500px) {
  .hero-content {
    top: clamp(25rem, 4vw, 2.5rem);
  }
  .hero-headline {
    font-size: clamp(1.2rem, 3.5vw, 1.6rem) !important;
  }
  .hero-subtitle {
    font-size: clamp(0.5rem, 2.5vw, 0.85rem);
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
  0%, 100% { filter: brightness(0.88); }
  35% { filter: brightness(1.28); }
  62% { filter: brightness(0.78); }
}
</style>
