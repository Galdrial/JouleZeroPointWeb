<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import TerminalOracle from './components/TerminalOracle.vue'

const router = useRouter()
const route = useRoute()
const username = ref(localStorage.getItem('username') || '')

watch(
  () => route.fullPath,
  () => {
    username.value = localStorage.getItem('username') || ''
  }
)

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  username.value = ''
  router.push('/login')
}

const isTerminalOpen = ref(false)
const hideUI = computed(() => route.meta.hideUI === true);

// Deep-linking: Apre il terminale se ?terminal=1 è presente
onMounted(() => {
  if (route.query.terminal === '1') {
    isTerminalOpen.value = true
  }
})

// Watcher per cambiamenti rotta (es: navigazione verso un link con query)
watch(() => route.query.terminal, (newVal) => {
  if (newVal === '1') {
    isTerminalOpen.value = true
  }
})
</script>

<template>
  <div class="app-layout">
    <header v-if="!hideUI" class="glass-navbar">
      <RouterLink to="/" class="logo-link">
        <div class="logo">
          <span class="joule">JOULE:</span> <span class="zp">ZERO POINT</span>
        </div>
      </RouterLink>
      <nav>
        <RouterLink to="/cards">Database</RouterLink>
        <RouterLink to="/deckbuilder">Mazzi</RouterLink>
        
        <template v-if="username">
          <span class="welcome-text">{{ username }}</span>
          <button @click="logout" class="btn-primary" style="background: linear-gradient(135deg, var(--accent-magenta), #800020); padding: 0.6rem 1.2rem; font-size: 0.85rem;">Disconnessione</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn-primary">Accedi</RouterLink>
        </template>
      </nav>
    </header>

    <main class="content-wrapper">
      <RouterView />
    </main>

    <!-- Trigger Flottante Terminale -->
    <button 
      v-if="!hideUI"
      class="terminal-trigger" 
      :class="{ 'active': isTerminalOpen }"
      @click.stop="isTerminalOpen = !isTerminalOpen"
      title="Terminale Punto Zero"
    >
      <svg class="icon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 22 12 2Z" fill="currentColor" opacity="0.1"/>
        <path d="M7 8L3 12L7 16M11 16H15M17 8L21 12L17 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
.welcome-text {
  color: var(--text-muted);
  font-family: var(--font-display);
  font-weight: 600;
}

.logo-link {
  text-decoration: none;
  transition: opacity 0.3s;
}

.logo-link:hover {
  opacity: 0.8;
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
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
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
  box-shadow: 0 0 25px rgba(0, 240, 255, 0.4);
  border-color: #fff;
}

.terminal-trigger.active {
  background: rgba(255, 0, 60, 0.1);
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
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}
</style>
