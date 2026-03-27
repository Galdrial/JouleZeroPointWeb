<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import TerminalOracle from "./components/TerminalOracle.vue";

const router = useRouter();
const route = useRoute();
const username = ref(localStorage.getItem("username") || "");

watch(
  () => route.fullPath,
  () => {
    username.value = localStorage.getItem("username") || "";
  },
);

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  username.value = "";
  router.push("/login");
};

const isTerminalOpen = ref(false);
const hideUI = computed(() => route.meta.hideUI === true);

onMounted(() => {
  if (route.query.terminal === "1") {
    isTerminalOpen.value = true;
  }
});

// Watcher per cambiamenti rotta (es: navigazione verso un link con query)
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
    <header v-if="!hideUI" class="glass-navbar">
      <RouterLink to="/" class="logo-link">
        <div class="logo">
          <span class="joule">JOULE</span> <span class="zp">ZERO POINT</span>
        </div>
      </RouterLink>
      <nav>
        <RouterLink to="/cards" class="cyber-btn btn-secondary nav-item"
          >Database</RouterLink
        >
        <RouterLink to="/news" class="cyber-btn btn-secondary nav-item"
          >News</RouterLink
        >
        <RouterLink to="/public-decks" class="cyber-btn btn-secondary nav-item"
          >Mazzi pubblici</RouterLink
        >

        <template v-if="username">
          <RouterLink to="/deckbuilder" class="cyber-btn btn-secondary nav-item"
            >I miei mazzi</RouterLink
          >
          <RouterLink
            to="/profile"
            class="cyber-btn btn-secondary nav-item user-btn"
            >{{ username }}</RouterLink
          >
          <button
            @click="logout"
            class="cyber-btn btn-danger nav-item logout-btn"
          >
            Logout
          </button>
        </template>
        <template v-else>
          <RouterLink
            to="/login"
            class="cyber-btn btn-primary nav-item auth-btn"
            >Accedi</RouterLink
          >
        </template>
      </nav>
    </header>

    <main
      class="content-wrapper"
      :class="{ 'content-wrapper--flush-top': route.path === '/' }"
    >
      <RouterView />
    </main>

    <footer v-if="!hideUI" class="app-footer">
      <div class="footer-social-section">
        <div class="footer-section-title">SOCIAL NETWORK</div>
        <div class="footer-socials">
          <a
            href="https://example.com/facebook"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            class="footer-social-link"
          >
            <svg
              viewBox="0 0 24 24"
              class="footer-social-icon"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M13.5 8.5V6.9c0-.6.4-1 1-1h1.2V3h-2c-2.2 0-3.7 1.5-3.7 3.7v1.8H8v3h2v9h3.5v-9h2.3l.5-3z"
              />
            </svg>
          </a>
          <a
            href="https://example.com/instagram"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            class="footer-social-link"
          >
            <svg
              viewBox="0 0 24 24"
              class="footer-social-icon"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm11 1.8a1.2 1.2 0 1 1 0 2.4a1.2 1.2 0 0 1 0-2.4M12 7a5 5 0 1 1 0 10a5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6a3 3 0 0 0 0-6"
              />
            </svg>
          </a>
          <a
            href="https://example.com/discord"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord"
            class="footer-social-link"
          >
            <svg
              viewBox="0 0 24 24"
              class="footer-social-icon"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M19.6 5.7a15 15 0 0 0-3.8-1.2l-.2.4c1.5.4 2.2 1 2.2 1a11 11 0 0 0-5.8-1.5A11 11 0 0 0 6.2 6s.7-.6 2.2-1l-.2-.4a15 15 0 0 0-3.8 1.2C2 9.2 1.4 12.5 1.6 15.8a15.6 15.6 0 0 0 4.6 2.3l1-1.6c-.6-.2-1.1-.5-1.6-.8l.4-.3c2 1 4.2 1.5 6.4 1.5s4.4-.5 6.4-1.5l.4.3c-.5.3-1 .6-1.6.8l1 1.6a15.6 15.6 0 0 0 4.6-2.3c.3-3.8-.6-7.1-3.6-10.1M8.9 14.1c-.8 0-1.4-.7-1.4-1.5c0-.9.6-1.5 1.4-1.5c.8 0 1.4.7 1.4 1.5c0 .9-.6 1.5-1.4 1.5m6.2 0c-.8 0-1.4-.7-1.4-1.5c0-.9.6-1.5 1.4-1.5c.8 0 1.4.7 1.4 1.5c0 .9-.6 1.5-1.4 1.5"
              />
            </svg>
          </a>
        </div>
      </div>
      <div class="footer-divider"></div>
      <div class="footer-links">
        <a
          href="https://example.com/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          Termini di utilizzo
        </a>
        <a
          href="https://example.com/code-of-conduct"
          target="_blank"
          rel="noopener noreferrer"
        >
          Codice di condotta
        </a>
        <a
          href="https://example.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Informativa sulla privacy
        </a>
      </div>
      <div class="footer-divider footer-divider--secondary"></div>
      <div class="footer-copyright">
        © 2026 Simone Camerano. All Right Reserved.
      </div>
    </footer>

    <!-- Trigger Flottante Terminale -->
    <button
      v-if="!hideUI"
      class="terminal-trigger"
      :class="{ active: isTerminalOpen }"
      @click.stop="isTerminalOpen = !isTerminalOpen"
      title="Terminale Punto Zero"
    >
      <svg
        class="icon-svg"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 22 12 2Z"
          fill="currentColor"
          opacity="0.1"
        />
        <path
          d="M7 8L3 12L7 16M11 16H15M17 8L21 12L17 16"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="pulse-ring"></span>
    </button>

    <!-- Modal Terminale (Teleport) -->
    <Teleport to="body">
      <TerminalOracle
        :is-open="isTerminalOpen"
        @close="isTerminalOpen = false"
      />
    </Teleport>

    <div class="ambient-glow"></div>
  </div>
</template>

<style scoped>
/* Nav Customizations */
.nav-item {
  padding: 0.5rem 1.5rem !important;
  font-size: 0.8rem !important;
  height: fit-content;
}

.user-btn {
  border-color: var(--accent-cyan) !important;
  color: var(--accent-cyan) !important;
}

.logout-btn {
  margin-left: 0.5rem;
}

.logo-link {
  text-decoration: none;
  transition: opacity 0.3s;
}

.logo-link:hover {
  opacity: 0.8;
}

.logo .joule {
  color: #fedc68;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.35);
}

.logo .zp {
  color: #ffffff;
}

.content-wrapper--flush-top {
  padding-top: 0;
}

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
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0),
    rgba(254, 220, 104, 0.5),
    rgba(255, 255, 255, 0)
  );
}

.footer-copyright {
  margin-top: 0.8rem;
}

.footer-divider--secondary {
  margin-top: 1rem;
}

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

.footer-links a:hover {
  color: var(--accent-cyan);
}

.footer-socials {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.footer-social-link {
  color: var(--accent-cyan);
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

.footer-social-icon {
  width: 20px;
  height: 20px;
}

/* Float Trigger Styles */
.terminal-trigger {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: rgba(10, 15, 20, 0.8);
  border: 1px solid var(--accent-cyan);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 999;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.22);
  backdrop-filter: blur(10px);
}

.terminal-trigger .icon-svg {
  width: 1.8rem;
  height: 1.8rem;
  color: var(--accent-cyan);
  transition: all 0.3s ease;
  z-index: 2;
}

.terminal-trigger:hover {
  transform: scale(1.1) rotate(10deg);
  box-shadow: 0 0 25px rgba(212, 175, 55, 0.4);
  border-color: #fff;
}

.terminal-trigger.active {
  background: rgba(255, 159, 28, 0.14);
  border-color: var(--accent-magenta);
  transform: scale(1.1) rotate(10deg);
}

.terminal-trigger.active .icon-svg {
  color: var(--accent-magenta);
  filter: drop-shadow(0 0 5px var(--accent-magenta));
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid var(--accent-cyan);
  animation: pulse-ring 2s infinite;
  opacity: 0;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
</style>
