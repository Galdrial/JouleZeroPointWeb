<script setup lang="ts">
import { onMounted, ref, watch, defineAsyncComponent } from "vue";
import { RouterView, useRoute } from "vue-router";
import { useAuthStore } from "./stores/auth";

// Componenti Layout (100% Pro Edition)
const JouleTerminal = defineAsyncComponent(() => import("./components/JouleTerminal.vue"));
import FloatingTerminalTrigger from "./components/layout/FloatingTerminalTrigger.vue";
import TheFooter from "./components/layout/TheFooter.vue";
import TheNavbar from "./components/layout/TheNavbar.vue";
import CookieBanner from "./components/ui/CookieBanner.vue";
import JouleNotification from "./components/ui/JouleNotification.vue";

const route = useRoute();
const authStore = useAuthStore();

const isTerminalOpen = ref(false);

onMounted(() => {
  authStore.initialize();
  if (route.query.terminal === "1") {
    isTerminalOpen.value = true;
  }
});

// Watcher per cambiamenti rotta tramite query (es: link terminale)
watch(
  () => route.query.terminal,
  (newVal) => {
    if (newVal === "1") {
      isTerminalOpen.value = true;
    }
  },
);
</script>

<template>
  <div class="app-layout">
    <!-- Feedback Visivo Globale (100% Pro) -->
    <JouleNotification />

    <!-- Direttore d'Orchestra Layout -->
    <TheNavbar />

    <main
      class="content-wrapper"
      :class="{ 'content-wrapper--flush-top': route.path === '/' }"
    >
      <RouterView />
    </main>

    <TheFooter />

    <!-- Accessori Galattici -->
    <FloatingTerminalTrigger
      :is-open="isTerminalOpen"
      @toggle="isTerminalOpen = !isTerminalOpen"
    />

    <CookieBanner />

    <Teleport to="body">
      <JouleTerminal
        :is-open="isTerminalOpen"
        @close="isTerminalOpen = false"
      />
    </Teleport>

    <!-- Atmosfera Joule -->
    <div class="ambient-glow"></div>
  </div>
</template>

<style>
/* 
  STILI GLOBALI JOULE: ZERO POINT 
  Questi stili definiscono l'atmosfera core dell'applicazione.
*/
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.content-wrapper {
  flex: 1;
  padding-top: 5rem; /* Compensazione altezza Navbar (Fix Dinamico) */
  transition: filter 0.3s ease;
  position: relative;
  z-index: 1;
}

.content-wrapper--flush-top {
  padding-top: 0;
}

/* Atmosfera di Background (Matrice Joule ZP) */
.ambient-glow {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(
      circle at 15% 15%,
      rgba(var(--accent-gold-rgb), 0.05) 0%,
      transparent 40%
    ),
    radial-gradient(
      circle at 85% 85%,
      rgba(var(--accent-gold-rgb), 0.05) 0%,
      transparent 40%
    );
}

/* Blur globale per menu mobile (gestito via componente Navbar) */
.content-wrapper.blurred {
  filter: blur(4px);
  pointer-events: none;
}
</style>
