<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const goHome = () => {
  router.push("/");
};
</script>

<template>
  <div class="not-found-view fade-in">
    <div class="glass-panel error-panel">
      <div class="error-code">404</div>
      <div class="divider"></div>
      <h1 class="glitch-text" data-text="DISSONANZA RILEVATA">DISSONANZA RILEVATA</h1>
      <p class="error-msg">
        Le coordinate temporali fornite non corrispondono ad alcun settore della Matrice Joule. 
        Il flusso è instabile in questa zona.
      </p>
      <button class="cyber-btn btn-primary" @click="goHome">
        RITORNA ALLA BASE
      </button>
    </div>
  </div>
</template>

<style scoped>
.not-found-view {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.error-panel {
  max-width: 600px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  border: 1px solid rgba(var(--accent-magenta-rgb), 0.3);
  box-shadow: 0 0 40px rgba(var(--accent-magenta-rgb), 0.1);
}

.error-code {
  font-family: var(--font-display);
  font-size: 6rem;
  font-weight: 800;
  color: var(--accent-magenta);
  text-shadow: 0 0 20px rgba(var(--accent-magenta-rgb), 0.5);
  line-height: 1;
}

.divider {
  width: 50px;
  height: 4px;
  background: var(--accent-magenta);
  border-radius: 2px;
}

.glitch-text {
  font-size: 1.8rem;
  letter-spacing: 4px;
  margin: 0;
  color: #fff;
}

.error-msg {
  color: var(--text-muted);
  line-height: 1.6;
  font-size: 1.1rem;
}

.cyber-btn {
  margin-top: 1rem;
}
</style>
