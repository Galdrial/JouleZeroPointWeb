<script setup lang="ts">
import { onMounted, ref } from "vue";
import { STARTER_DECKS } from "../constants/starterDecks";

const starterDecks = STARTER_DECKS;
const activeDeckIndex = ref(0);
const gridRef = ref<HTMLElement | null>(null);

const scrollToDeck = (index: number) => {
  if (!gridRef.value) return;
  const cards = gridRef.value.querySelectorAll(".starter-card");
  if (cards[index]) {
    cards[index].scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }
};

onMounted(() => {
  if (!gridRef.value) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(
            (entry.target as HTMLElement).dataset.index || "0",
          );
          activeDeckIndex.value = index;
        }
      });
    },
    { root: gridRef.value, threshold: 0.6 },
  );
  gridRef.value
    .querySelectorAll(".starter-card")
    .forEach((card) => observer.observe(card));
});
</script>

<template>
  <section class="starter-decks-viewport">
    <div class="starter-decks-bg-glow"></div>
    <div class="starter-decks-inner">
      <div class="starter-header">
        <h2>SCEGLI IL TUO PILASTRO</h2>
        <p>
          Tre mazzi competitivi pre-assemblati, senza carte in comune, per
          iniziare subito la tua scalata nel Punto Zero.
        </p>
      </div>

      <div ref="gridRef" class="starter-grid">
        <div
          v-for="(deck, index) in starterDecks"
          :key="deck.id"
          class="starter-card glass-panel"
          :class="{ 'is-active': activeDeckIndex === index }"
          :style="{ '--deck-color': deck.color, '--deck-glow': deck.glow }"
          :data-index="index"
        >
          <div class="card-accent"></div>

          <div class="deck-visual">
            <img
              :src="deck.imageUrl"
              :alt="deck.name"
              class="builder-img"
              loading="lazy"
              :style="{
                objectPosition: deck.objectPosition || 'center bottom',
              }"
            />
            <div class="visual-overlay"></div>
          </div>

          <div class="card-body">
            <span class="deck-style">{{ deck.style }}</span>
            <h4>{{ deck.name }}</h4>
            <p>{{ deck.desc }}</p>

            <div class="deck-difficulty">
              <span>Difficoltà: {{ deck.difficultyLabel }}</span>
              <div class="difficulty-bars">
                <div
                  v-for="i in 5"
                  :key="i"
                  class="diff-bar"
                  :class="{ active: i <= deck.difficulty }"
                ></div>
              </div>
            </div>

            <RouterLink
              :to="`/starter-decks/${deck.id}`"
              class="cyber-btn btn-outline-deck"
            >
              ESPLORA MAZZO
            </RouterLink>
          </div>
        </div>
      </div>

      <div v-if="starterDecks.length > 1" class="starter-nav-dots">
        <button
          v-for="(_, index) in starterDecks"
          :key="index"
          class="nav-dot"
          :class="{ active: activeDeckIndex === index }"
          :aria-label="`Vai al mazzo ${index + 1}`"
          @click="scrollToDeck(index)"
        ></button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── First .starter-card block (kept in original order for cascade) ── */
.starter-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(15, 23, 42, 0.6);
  height: 100%;
}

.deck-visual {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-bottom: 2px solid var(--deck-color);
}

.builder-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.starter-card:hover .builder-img { transform: scale(1.1); }

.visual-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(to top, rgba(15, 23, 42, 1) 0%, transparent 100%);
}

.card-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.deck-style {
  font-family: var(--font-display);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--deck-color);
  margin-bottom: 0.5rem;
}

.starter-card h4 {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: #fff;
  margin-bottom: 1rem;
  letter-spacing: 0.5px;
}

.starter-card p {
  font-size: 0.9rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.deck-difficulty {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.difficulty-bars {
  display: flex;
  gap: 4px;
}

.diff-bar {
  width: 12px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.diff-bar.active {
  background: var(--deck-color);
  box-shadow: 0 0 8px var(--deck-glow);
}

.btn-outline-deck {
  border: 1px solid var(--deck-color);
  color: #fff;
  background: transparent;
  padding: 0.75rem;
  font-size: 0.85rem;
  position: relative;
  z-index: 1;
}

.btn-outline-deck:hover {
  background: var(--deck-color);
  box-shadow: 0 0 15px var(--deck-glow);
  color: #000;
}

/* ── Section Layout ── */
.starter-decks-viewport {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  position: relative;
  padding: clamp(3rem, 6vw, 5rem) 0 6rem 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(15, 23, 42, 0.95) 0%,
    rgba(4, 8, 14, 1) 100%
  );
  border-top: 1px solid rgba(0, 242, 255, 0.1);
  border-bottom: 1px solid rgba(0, 242, 255, 0.1);
  box-shadow:
    inset 0 20px 40px rgba(0, 0, 0, 0.4),
    inset 0 -20px 40px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  margin-top: 1rem;
  transform: translateZ(0);
  contain: paint;
}

.starter-decks-bg-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 60%;
  background: radial-gradient(circle, rgba(0, 242, 255, 0.05) 0%, transparent 70%);
  filter: blur(80px);
  z-index: 0;
  pointer-events: none;
}

.starter-decks-inner {
  max-width: 1600px;
  width: 94%;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.starter-header {
  text-align: center;
  margin-bottom: 2rem;
}

.starter-header h2 {
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  color: #fff;
  margin: 0 0 1rem 0;
  letter-spacing: 1px;
}

.starter-header p {
  color: var(--text-muted);
  max-width: 600px;
  margin: 0 auto;
  font-size: 1.1rem;
}

.starter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(1rem, 2vw, 2rem);
}

@media (max-width: 900px) and (min-width: 769px) {
  .starter-grid { grid-template-columns: 1fr; max-width: 520px; margin: 0 auto; }
}

@media (max-width: 768px) {
  .starter-decks-inner { width: 100%; padding: 0; }

  .starter-header { padding: 0 1.5rem; }

  .starter-grid {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 1.2rem;
    padding: 0.5rem 9vw 2rem 9vw;
    -webkit-overflow-scrolling: touch;
    grid-template-columns: none;
    scrollbar-width: none;
  }

  .starter-grid::-webkit-scrollbar { display: none; }

  .starter-card {
    flex: 0 0 82vw;
    scroll-snap-align: center;
    scroll-snap-stop: always;
    max-width: 380px;
    opacity: 0.4;
    transform: scale(0.92);
    transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .starter-card.is-active {
    opacity: 1 !important;
    transform: scale(1) !important;
    border-color: var(--deck-color) !important;
    box-shadow:
      0 10px 30px -5px rgba(0, 0, 0, 0.6),
      0 0 20px var(--deck-glow) !important;
    z-index: 2;
  }

  .starter-card.is-active .card-accent {
    height: 6px !important;
    opacity: 1 !important;
    box-shadow: 0 0 15px var(--deck-glow) !important;
  }

  .starter-card:hover { transform: scale(0.92); }

  .starter-card.is-active:hover {
    transform: scale(1);
    border-color: var(--deck-color) !important;
  }
}

.starter-nav-dots {
  display: none;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .starter-nav-dots { display: flex; }
}

.nav-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-dot.active {
  background: var(--accent-gold);
  border-color: var(--accent-gold);
  box-shadow: 0 0 10px var(--accent-gold);
  transform: scale(1.3);
}

/* ── Second .starter-card block (overrides first per original cascade) ── */
.starter-card {
  position: relative;
  padding: 2.2rem 1.8rem;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(15, 23, 42, 0.4);
  cursor: pointer;
  overflow: hidden;
}

.card-accent {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--deck-color);
  opacity: 0.5;
  transition: height 0.3s ease;
}

.starter-card:hover {
  transform: translateY(-8px);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow:
    0 15px 35px -5px rgba(0, 0, 0, 0.5),
    0 0 20px var(--deck-glow);
}

.starter-card:hover .card-accent {
  height: 6px;
  opacity: 1;
  box-shadow: 0 0 15px var(--deck-glow);
}

.deck-style {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: var(--deck-color);
  text-transform: uppercase;
  margin-bottom: 0.8rem;
  display: block;
}

.starter-card h4 {
  margin: 0 0 1rem 0;
  font-size: 1.35rem;
  font-family: var(--font-display);
  color: #fff;
}

.starter-card p {
  margin: 0 0 2rem 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-muted);
  flex-grow: 1;
}

.deck-difficulty {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 2rem;
  font-size: 0.8rem;
  color: #888;
}

.difficulty-bars {
  display: flex;
  gap: 4px;
}

.diff-bar {
  width: 12px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1px;
}

.diff-bar.active { background: var(--deck-color); }

.btn-outline-deck {
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  padding: 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  transition: all 0.3s ease;
}

.starter-card:hover .btn-outline-deck {
  background: var(--deck-color);
  border-color: var(--deck-color);
  color: #000;
}
</style>
