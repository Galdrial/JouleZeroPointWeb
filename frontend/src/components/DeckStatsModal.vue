<script setup lang="ts">
import { computed } from "vue";
import { TYPE_COLOR_GRADIENTS, TYPE_GLOWS } from "../constants/cardTypes";

interface Props {
  show: boolean;
  totalCards: number;
  costCurve: Record<string, number>;
  averagePep: string | number;
  averageRp: string | number;
  typeDistribution: Record<string, number>;
}

const props = defineProps<Props>();
defineEmits(["close"]);

const safeTotal = computed(() => props.totalCards || 1);

const getTypeColor = (type: string): string =>
  TYPE_COLOR_GRADIENTS[type] ?? "linear-gradient(90deg, #fff, #ccc)";

const getTypeGlow = (type: string): string =>
  TYPE_GLOWS[type] ?? "none";
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content glass-panel">
          <button class="close-btn" @click="$emit('close')">&times;</button>
          <div class="modal-header-stats">
            <h2>ANALISI STATISTICA MAZZO</h2>
          </div>
          <div class="stats-modal-body">
            <!-- Cost curve -->
            <div class="stats-section">
              <h3>CURVA DI COSTO (ET)</h3>
              <div class="cost-chart">
                <div
                  v-for="(count, cost) in costCurve"
                  :key="cost"
                  class="cost-bar"
                >
                  <div class="cost-label">{{ cost }}</div>
                  <div
                    class="cost-bar-fill"
                    :style="{ width: (count / safeTotal) * 100 + '%' }"
                  >
                    <span class="cost-count">{{ count }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Average stats -->
            <div class="stats-section">
              <h3>STATISTICHE MEDIE</h3>
              <div class="avg-stats-grid">
                <div class="avg-stat">
                  <span class="stat-label">PEP MEDIO</span>
                  <span class="stat-value">{{ averagePep }}</span>
                </div>
                <div class="avg-stat">
                  <span class="stat-label">RP MEDIO</span>
                  <span class="stat-value">{{ averageRp }}</span>
                </div>
              </div>
            </div>

            <!-- Type distribution -->
            <div class="stats-section">
              <h3>DISTRIBUZIONE PER TIPO</h3>
              <div class="type-distribution">
                <div
                  v-for="(count, type) in typeDistribution"
                  :key="type"
                  class="type-row"
                >
                  <span class="type-name">{{ type }}</span>
                  <div class="type-bar">
                    <div
                      class="type-bar-fill"
                      :style="{
                        width: (count / safeTotal) * 100 + '%',
                        background: getTypeColor(String(type)),
                        boxShadow: getTypeGlow(String(type)),
                      }"
                    >
                      <span class="type-count">{{ count }}</span>
                    </div>
                  </div>
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

.modal-header-stats {
  text-align: center;
  margin-bottom: 2rem;
}

.modal-header-stats h2 {
  font-family: var(--font-display);
  font-size: 1.8rem;
  margin: 0;
  color: var(--text-main);
  background: linear-gradient(to right, #fff, var(--accent-gold));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stats-modal-body {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 1rem;
}

.stats-modal-body::-webkit-scrollbar { width: 6px; }
.stats-modal-body::-webkit-scrollbar-track {
  background: rgba(212, 175, 55, 0.08);
  border-radius: 10px;
}
.stats-modal-body::-webkit-scrollbar-thumb {
  background: var(--accent-gold);
  border-radius: 10px;
}

.stats-section {
  border: 1px solid rgba(212, 175, 55, 0.22);
  padding: 1.5rem;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
}

.stats-section h3 {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--accent-gold);
  margin: 0 0 1.5rem 0;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.cost-chart {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.cost-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cost-label {
  font-family: var(--font-display);
  font-size: 0.9rem;
  min-width: 30px;
  text-align: right;
  color: var(--text-muted);
  font-weight: bold;
}

.cost-bar-fill {
  flex: 0 0 auto;
  background: linear-gradient(90deg, var(--accent-gold), #00ff88);
  min-height: 28px;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.cost-count {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #000;
  font-weight: bold;
  font-size: 0.85rem;
  font-family: var(--font-display);
}

.avg-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.avg-stat {
  background: rgba(212, 175, 55, 0.1);
  padding: 1.2rem;
  border-radius: 8px;
  border: 1px solid rgba(212, 175, 55, 0.18);
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
}

.stat-value {
  display: block;
  font-family: var(--font-display);
  font-size: 2rem;
  color: var(--accent-gold);
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
}

.type-distribution {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.type-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 1rem;
  align-items: center;
}

.type-name {
  font-size: 0.9rem;
  color: var(--text-main);
  font-weight: 600;
  text-transform: capitalize;
}

.type-bar {
  height: 24px;
  background: rgba(212, 175, 55, 0.12);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(212, 175, 55, 0.18);
  position: relative;
}

.type-bar-fill {
  height: 100%;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
}

.type-count {
  color: #000;
  font-size: 0.75rem;
  font-weight: bold;
  font-family: var(--font-display);
}

@media (max-width: 768px) {
  .stats-modal-body {
    gap: 1.4rem;
    padding-right: 0.2rem;
  }

  .avg-stats-grid {
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }

  .type-row {
    grid-template-columns: 90px 1fr;
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {
  .type-row {
    grid-template-columns: 1fr;
  }

  .type-name {
    font-size: 0.82rem;
  }
}
</style>
