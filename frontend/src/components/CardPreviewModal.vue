<script setup lang="ts">
import type { Card } from "../stores/cardStore";

interface Props {
  card: Card | null;
  currentCount: number;
}

defineProps<Props>();
defineEmits(["close", "add", "remove"]);
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="card" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content glass-panel">
          <button class="close-btn" @click="$emit('close')">&times;</button>
          <div class="modal-body">
            <div class="modal-info">
              <h2>{{ card.name }}</h2>
              <div class="badge-row">
                <span
                  class="badge"
                  :class="(card.type || '').split(' ')[0].toLowerCase()"
                >{{ card.type }}</span>
                <span class="rarity-badge">{{ card.rarity }}</span>
              </div>
              <p class="modal-effect">{{ card.effect }}</p>
              <div class="modal-stats">
                <div class="stat-box">
                  <strong>ET</strong><span>{{ card.cost_et ?? "-" }}</span>
                </div>
                <div class="stat-box">
                  <strong>PEP</strong><span>{{ card.pep ?? "-" }}</span>
                </div>
                <div class="stat-box">
                  <strong>RP</strong><span>{{ card.rp ?? "-" }}</span>
                </div>
              </div>
              <div class="modal-controls-wrapper">
                <p v-if="card.role" class="modal-role">Ruolo: {{ card.role }}</p>
                <div class="viewer-controls">
                  <button
                    class="cyber-btn btn-danger small red-bg"
                    @click="$emit('remove', card)"
                  >
                    -
                  </button>
                  <span class="current-count">{{ currentCount }}</span>
                  <button
                    class="cyber-btn btn-primary small cyan-bg"
                    @click="$emit('add', card)"
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
</template>

<style scoped>
@import "../assets/card-modal-shared.css";
@import "../assets/card-badge-types.css";

.modal-body { grid-template-columns: 1fr; }

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

.modal-role {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
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
  color: var(--accent-gold);
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

.cyan-bg {
  background: var(--accent-gold) !important;
  color: #000 !important;
}

.red-bg {
  background: var(--accent-magenta) !important;
  color: #fff !important;
}

@media (max-width: 768px) {
  .modal-content { padding: 1.25rem 1rem; }
  .modal-info h2 { font-size: 1.5rem; margin-bottom: 0.75rem; }
}

@media (max-width: 480px) {
  .modal-overlay { padding: 0.75rem; }
  .modal-content { padding: 1rem 0.85rem; }
  .modal-info h2 { font-size: 1.3rem; }
  .viewer-controls { gap: 1rem; }
  .current-count { min-width: 44px; font-size: 1.55rem; }
}
</style>
