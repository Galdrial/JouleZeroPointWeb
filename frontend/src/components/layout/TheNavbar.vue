<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isMenuOpen = ref(false);
const hideUI = computed(() => route.meta.hideUI === true);

// Sincronizzazione automatica ad ogni cambio rotta
watch(
  () => route.fullPath,
  () => {
    isMenuOpen.value = false;
  },
);

const logout = () => {
  authStore.logout();
  isMenuOpen.value = false;
  router.push("/login");
};

const handleResize = () => {
  if (window.innerWidth > 1690 && isMenuOpen.value) {
    isMenuOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

// Applica blur al contenuto e permette lo scroll sotto il menu mobile
watch(isMenuOpen, (val) => {
  const content = document.querySelector(".content-wrapper") as HTMLElement | null;
  if (content) {
    content.style.transition = "filter 0.3s";
    content.style.filter = val ? "blur(3px)" : "";
    content.style.pointerEvents = val ? "none" : "";
  }
});
</script>

<template>
  <header v-if="!hideUI" class="glass-navbar">
    <RouterLink to="/" class="logo-link" @click="isMenuOpen = false">
      <div class="logo">
        <span class="joule">JOULE</span> <span class="zp">ZERO POINT</span>
      </div>
    </RouterLink>

    <!-- Hamburger (mobile only) -->
    <button
      class="hamburger"
      :class="{ open: isMenuOpen }"
      @click="isMenuOpen = !isMenuOpen"
      aria-label="Menu"
    >
      <span></span><span></span><span></span>
    </button>

    <!-- Navigazione Desktop -->
    <nav class="desktop-nav">
      <RouterLink to="/cards" class="cyber-btn btn-secondary nav-item">Database</RouterLink>
      <RouterLink to="/come-iniziare" class="cyber-btn btn-secondary nav-item">Come iniziare</RouterLink>
      <RouterLink to="/news" class="cyber-btn btn-secondary nav-item">News</RouterLink>
      <RouterLink to="/storia" class="cyber-btn btn-secondary nav-item">Storia</RouterLink>
      <RouterLink to="/public-decks" class="cyber-btn btn-secondary nav-item">Mazzi pubblici</RouterLink>

      <template v-if="authStore.username">
        <RouterLink to="/profile" class="cyber-btn btn-secondary nav-item user-btn">
          {{ authStore.username }}
        </RouterLink>
        <button @click="logout" class="cyber-btn btn-danger nav-item logout-btn">Logout</button>
      </template>
      <template v-else>
        <RouterLink to="/login" class="cyber-btn btn-primary nav-item auth-btn">Accedi</RouterLink>
      </template>
    </nav>
  </header>

  <!-- Modal Mobile -->
  <Teleport to="body">
    <Transition name="fade-overlay">
      <div v-if="isMenuOpen" class="nav-overlay" @click="isMenuOpen = false"></div>
    </Transition>
    <Transition name="fade-overlay">
      <div v-if="isMenuOpen" class="blur-overlay-clickable" @click="isMenuOpen = false"></div>
    </Transition>

    <nav class="mobile-nav" :class="{ 'nav--open': isMenuOpen }">
      <RouterLink to="/cards" class="mobile-nav-link" @click="isMenuOpen = false">Database</RouterLink>
      <RouterLink to="/come-iniziare" class="mobile-nav-link" @click="isMenuOpen = false">Come iniziare</RouterLink>
      <RouterLink to="/news" class="mobile-nav-link" @click="isMenuOpen = false">News</RouterLink>
      <RouterLink to="/storia" class="mobile-nav-link" @click="isMenuOpen = false">Storia</RouterLink>
      <RouterLink to="/public-decks" class="mobile-nav-link" @click="isMenuOpen = false">Mazzi pubblici</RouterLink>
      
      <template v-if="authStore.username">
        <RouterLink to="/profile" class="mobile-nav-link user-link" @click="isMenuOpen = false">
          {{ authStore.username }}
        </RouterLink>
        <button @click="logout" class="mobile-nav-link logout-link">Logout</button>
      </template>
      <template v-else>
        <RouterLink to="/login" class="mobile-nav-link auth-link" @click="isMenuOpen = false">Accedi</RouterLink>
      </template>
    </nav>
  </Teleport>
</template>

<style scoped>
/* Stili specifici estratti da App.vue */
.desktop-nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-item {
  padding: 0.5rem 1.5rem !important;
  font-size: 0.8rem !important;
  height: fit-content;
}

.auth-btn, .auth-btn:hover, .auth-btn.router-link-active {
  color: #0a0e1a !important;
  text-shadow: none !important;
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

.logo-link:hover { opacity: 0.8; }

.logo .joule {
  color: #fedc68;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.35);
}

.logo .zp { color: #ffffff; }

.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  z-index: 201;
}

.hamburger span {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--text-main);
  border-radius: 2px;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger.open span:nth-child(2) { opacity: 0; }
.hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

.mobile-nav {
  display: none;
}

@media (max-width: 1690px) {
  .hamburger { display: flex; }
  .desktop-nav { display: none !important; }

  .nav-overlay {
    display: block;
    position: fixed;
    top: 0;
    right: 0;
    width: min(80vw, 400px);
    height: 100dvh;
    background: rgba(0, 0, 0, 0.18);
    backdrop-filter: blur(2px);
    z-index: 150;
    cursor: pointer;
    border-radius: 0 0 0 24px;
    box-shadow: -8px 0 24px 0 rgba(0, 0, 0, 0.12);
    pointer-events: auto;
  }

  .blur-overlay-clickable {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100dvh;
    z-index: 120;
    background: transparent;
    cursor: pointer;
  }

  .mobile-nav {
    display: flex;
    position: fixed;
    top: 0;
    right: 0;
    width: min(80vw, 400px);
    height: 100dvh;
    background: #0a0f16;
    border-left: 1.5px solid var(--glass-border);
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 6rem 2rem 4rem;
    gap: 1.2rem;
    z-index: 200;
    transform: translateX(100%);
    visibility: hidden;
    pointer-events: none;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
    border-radius: 0 0 0 24px;
    box-shadow: -8px 0 24px 0 rgba(0, 0, 0, 0.12);
  }

  .mobile-nav.nav--open {
    transform: translateX(0);
    visibility: visible;
    pointer-events: auto;
  }

  .mobile-nav-link {
    width: 100%;
    text-align: center;
    padding: 0.8rem;
    color: var(--text-main);
    text-decoration: none;
    font-size: 1.25rem;
    font-family: var(--font-display);
    font-weight: 600;
    letter-spacing: 1px;
    transition: all 0.3s ease;
    background: transparent;
    border: none;
    cursor: pointer;
    display: block;
  }

  .mobile-nav-link:hover,
  .mobile-nav-link.router-link-active {
    color: var(--accent-cyan);
    text-shadow: 0 0 10px rgba(254, 220, 104, 0.4);
  }

  .mobile-nav-link.logout-link {
    margin-top: 1rem;
    color: var(--accent-magenta);
    opacity: 0.8;
  }

  .mobile-nav-link.auth-link, .mobile-nav-link.user-link {
    color: var(--accent-gold) !important;
    margin-top: 1rem;
  }
}

.fade-overlay-enter-active, .fade-overlay-leave-active { transition: opacity 0.25s ease; }
.fade-overlay-enter-from, .fade-overlay-leave-to { opacity: 0; }
</style>
