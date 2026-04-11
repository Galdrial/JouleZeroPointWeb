<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

// UI Flags and LocalStorage Key setup
const isVisible = ref(false);
const COOKIE_STORAGE_KEY = "joule_cookie_consent";

// Mount lifecycle: Check local storage for consent status
onMounted(() => {
  const currentConsent = localStorage.getItem(COOKIE_STORAGE_KEY);
  if (!currentConsent) {
    // If no consent has been previously recorded, show the banner
    setTimeout(() => {
      isVisible.value = true;
    }, 1000); // Small delay to let the initial layout breathe
  }

  // Register CustomEvent listener allowing the footer to trigger this banner open
  window.addEventListener("open-cookie-banner", handleOpenBanner);
});

onUnmounted(() => {
  window.removeEventListener("open-cookie-banner", handleOpenBanner);
});

// Event Handler for manually re-opening preferences
const handleOpenBanner = () => {
  isVisible.value = true;
};

// Consent Triggers
const setConsent = (choice: "all" | "essential") => {
  // Store choice persistently
  localStorage.setItem(COOKIE_STORAGE_KEY, choice);
  
  // Here in the future, if choice === 'all', you might inject tracking scripts like Google Analytics.
  isVisible.value = false;
};
</script>

<template>
  <Transition name="slide-up">
    <div v-if="isVisible" class="cookie-banner-overlay" role="dialog" aria-live="polite">
      <div class="glass-panel cookie-content fade-in">
        <div class="cookie-text-section">
          <h2 class="cookie-title"><span class="terminal-prompt">&gt; </span>CALIBRAZIONE SENSORI E COOKIE</h2>
          <p class="cookie-desc">
            Il Sistema "Joule: Zero Point" utilizza stralci di memoria locale (cookie tecnici essenziali) per garantire il corretto funzionamento dell'autenticazione, della plancia di comando e della tua sessione di hacking nel Deckbuilder. 
            Utilizziamo cookie aggiuntivi (se approvati) esclusivamente per analizzare il traffico anonimizzato e prevenire fratture nella Matrice. 
            Puoi ricalibrare i sensori consultando l'<RouterLink to="/privacy" class="link-privacy">Informativa sulla Privacy</RouterLink>.
          </p>
        </div>
        
        <div class="cookie-actions">
          <button @click="setConsent('essential')" class="btn btn-secondary btn-essenziali" aria-label="Rifiuta telemetrie, solo essenziali">
            SOLO ESSENZIALI
          </button>
          <button @click="setConsent('all')" class="btn btn-primary btn-accetta" aria-label="Accetta calibrazione completa">
            ACCETTA TUTTO
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.cookie-banner-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;
  z-index: 9999;
  display: flex;
  justify-content: center;
  padding: 1rem;
  pointer-events: none; /* Let clicks pass through outside the panel */
}

.cookie-content {
  width: 100%;
  max-width: 1000px;
  background: rgba(12, 18, 28, 0.95);
  border: 1px solid rgba(254, 220, 104, 0.3);
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.7), inset 0 0 20px rgba(254, 220, 104, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  pointer-events: auto; /* Re-enable clicks for the panel itself */
}

@media (min-width: 768px) {
  .cookie-content {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.cookie-text-section {
  flex: 1;
}

.cookie-title {
  color: var(--text-light);
  font-family: var(--font-display);
  font-size: 1.2rem;
  margin-top: 0;
  margin-bottom: 0.5rem;
  letter-spacing: 2px;
}

.terminal-prompt {
  color: var(--accent-magenta);
}

.cookie-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
}

.link-privacy {
  color: var(--accent-gold);
  text-decoration: underline;
  transition: color 0.2s ease;
}
.link-privacy:hover {
  color: #fff;
}

.cookie-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 200px;
}

@media (min-width: 480px) {
  .cookie-actions {
    flex-direction: row;
  }
}

@media (min-width: 768px) {
  .cookie-actions {
    flex-direction: column;
  }
}

@media (min-width: 900px) {
  .cookie-actions {
    flex-direction: row;
  }
}

.btn {
  padding: 0.8rem 1.5rem;
  font-family: var(--font-display);
  font-size: 0.9rem;
  letter-spacing: 1.5px;
  cursor: pointer;
  white-space: nowrap;
  text-align: center;
  border-radius: 4px; /* Optional slight rounding for pro feel */
}

/* Animations using Vue Transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
