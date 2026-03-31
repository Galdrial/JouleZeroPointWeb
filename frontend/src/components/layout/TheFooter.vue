<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

// Route Orchestration: Global Layout Controller
const route = useRoute();

/**
 * Visibility Logic
 * Determines if the footer should be rendered based on route metadata (hideUI flag).
 * Commonly disabled in immersive views like the Terminal or specialized dashboards.
 */
const hideUI = computed(() => route.meta.hideUI === true);

// Cookie Consent Trigger
const openCookieSettings = () => {
  window.dispatchEvent(new CustomEvent("open-cookie-banner"));
};
</script>

<template>
  <footer v-if="!hideUI" class="app-footer">
    <div class="footer-social-section">
      <div class="footer-section-title">SOCIAL NETWORK</div>
      <div class="footer-socials">
        <a href="https://example.com/facebook" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="footer-social-link">
          <svg viewBox="0 0 24 24" class="footer-social-icon" aria-hidden="true">
            <path fill="currentColor" d="M13.5 8.5V6.9c0-.6.4-1 1-1h1.2V3h-2c-2.2 0-3.7 1.5-3.7 3.7v1.8H8v3h2v9h3.5v-9h2.3l.5-3z" />
          </svg>
        </a>
        <a href="https://example.com/instagram" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="footer-social-link">
          <svg viewBox="0 0 24 24" class="footer-social-icon" aria-hidden="true">
            <path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm11 1.8a1.2 1.2 0 1 1 0 2.4a1.2 1.2 0 0 1 0-2.4M12 7a5 5 0 1 1 0 10a5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6a3 3 0 0 0 0-6" />
          </svg>
        </a>
        <a href="https://example.com/discord" target="_blank" rel="noopener noreferrer" aria-label="Discord" class="footer-social-link">
          <svg viewBox="0 0 24 24" class="footer-social-icon" aria-hidden="true">
            <path fill="currentColor" d="M19.6 5.7a15 15 0 0 0-3.8-1.2l-.2.4c1.5.4 2.2 1 2.2 1a11 11 0 0 0-5.8-1.5A11 11 0 0 0 6.2 6s.7-.6 2.2-1l-.2-.4a15 15 0 0 0-3.8 1.2C2 9.2 1.4 12.5 1.6 15.8a15.6 15.6 0 0 0 4.6 2.3l1-1.6c-.6-.2-1.1-.5-1.6-.8l.4-.3c2 1 4.2 1.5 6.4 1.5s4.4-.5 6.4-1.5l.4.3c-.5.3-1 .6-1.6.8l1 1.6a15.6 15.6 0 0 0 4.6-2.3c.3-3.8-.6-7.1-3.6-10.1M8.9 14.1c-.8 0-1.4-.7-1.4-1.5c0-.9.6-1.5 1.4-1.5c.8 0 1.4.7 1.4 1.5c0 .9-.6 1.5-1.4 1.5m6.2 0c-.8 0-1.4-.7-1.4-1.5c0-.9.6-1.5 1.4-1.5c.8 0 1.4.7 1.4 1.5c0 .9-.6 1.5-1.4 1.5" />
          </svg>
        </a>
      </div>
    </div>
    <div class="footer-divider"></div>
    <div class="footer-links">
      <RouterLink to="/terms">Termini di utilizzo</RouterLink>
      <RouterLink to="/code-of-conduct">Codice di condotta</RouterLink>
      <RouterLink to="/privacy">Informativa sulla privacy</RouterLink>
      <a href="#" @click.prevent="openCookieSettings" aria-label="Impostazioni Sensori e Cookie">Impostazioni Cookie</a>
    </div>
    <div class="footer-divider footer-divider--secondary"></div>
    <div class="footer-copyright">
      © 2026 Simone Camerano. All Right Reserved.
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  width: 100%;
  text-align: center;
  padding: 1.8rem 2rem 1.2rem;
  color: var(--text-muted);
  font-size: 0.8rem;
  letter-spacing: 0.6px;
  border-top: 1px solid var(--glass-border);
  background: var(--surface-glass);
}

.footer-social-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.28rem;
  padding-top: 0.2rem;
  padding-bottom: 0.5rem;
}

.footer-section-title {
  font-family: var(--font-display);
  font-size: 0.92rem;
  letter-spacing: 0.28rem;
  color: var(--text-main);
}

.footer-divider {
  width: min(320px, 100%);
  height: 1px;
  margin: 0.45rem auto 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(254, 220, 104, 0.5), rgba(255, 255, 255, 0));
}

.footer-copyright { margin-top: 0.8rem; }
.footer-divider--secondary { margin-top: 1rem; }

.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem 1.4rem;
  margin-top: 0.9rem;
}

.footer-links a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.8rem;
  transition: color 0.2s ease;
}

.footer-links a:hover { color: var(--accent-gold); }

.footer-socials {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.footer-social-link {
  color: var(--accent-gold);
  text-decoration: none;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(254, 220, 104, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.03);
}

.footer-social-link:hover {
  background: rgba(254, 220, 104, 0.12);
  box-shadow: 0 0 12px rgba(254, 220, 104, 0.3);
}

.footer-social-icon { width: 20px; height: 20px; }
</style>
