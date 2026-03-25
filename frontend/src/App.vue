<script setup lang="ts">
import { ref, watch, onMounted, computed, onUnmounted } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import TerminalOracle from './components/TerminalOracle.vue'
import axios from 'axios'


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

const notifications = ref({ total: 0, pendingRequests: 0, unreadMessages: 0, unreadSenders: [] });
let notificationInterval: any = null;

const fetchNotifications = async () => {
  if (!username.value) {
    notifications.value = { total: 0, pendingRequests: 0, unreadMessages: 0, unreadSenders: [] };
    return;
  }
  try {
    const res = await axios.get('http://localhost:3000/api/social/notifications', {
      params: { username: username.value }
    });
    notifications.value = {
      total: Number(res.data.total) || 0,
      pendingRequests: Number(res.data.pendingRequests) || 0,
      unreadMessages: Number(res.data.unreadMessages) || 0,
      unreadSenders: res.data.unreadSenders || []
    };
  } catch (e) {
    console.error("Errore notifiche:", e);
    // Don't leave it in error state, assume 0 to avoid stuck UI
    notifications.value = { total: 0, pendingRequests: 0, unreadMessages: 0, unreadSenders: [] };
  }
};

onMounted(() => {
  if (route.query.terminal === '1') {
    isTerminalOpen.value = true
  }
  fetchNotifications();
  notificationInterval = setInterval(fetchNotifications, 5000);
})

onUnmounted(() => {
  if (notificationInterval) clearInterval(notificationInterval);
});

watch(username, (newVal) => {
  if (newVal) fetchNotifications();
  else notifications.value = { total: 0, pendingRequests: 0, unreadMessages: 0, unreadSenders: [] };
});

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
        <RouterLink to="/cards" class="cyber-btn btn-secondary nav-item">Database</RouterLink>
        <RouterLink to="/deckbuilder" class="cyber-btn btn-secondary nav-item">Mazzi</RouterLink>
        <RouterLink
          to="/social"
          class="cyber-btn btn-secondary nav-item social-link"
          :class="{ 'has-notifications': notifications.total > 0 }"
          v-if="username"
        >
          Social <span v-if="notifications.total > 0" class="notif-dot">●</span>
        </RouterLink>


        <template v-if="username">
          <RouterLink to="/profile" class="cyber-btn btn-secondary nav-item user-btn">{{ username }}</RouterLink>
          <button @click="logout" class="cyber-btn btn-danger nav-item logout-btn">Logout</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="cyber-btn btn-primary nav-item auth-btn">Accedi</RouterLink>
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

/* Social Notification Styles */
.social-link.has-notifications {
  border-color: #ffd700 !important;
  color: #ffd700 !important;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
  animation: pulse-yellow 2s infinite;
}

.notif-icon {
  margin-right: 8px;
  font-size: 1.1rem;
  vertical-align: middle;
}

.notif-dot {
  color: #ffd700;
  margin-left: 8px;
  font-size: 0.8rem;
}


@keyframes pulse-yellow {
  0% { 
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.2);
    border-color: #ffd700;
  }
  50% { 
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.6);
    border-color: #fff;
    transform: scale(1.05);
  }
  100% { 
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.2);
    border-color: #ffd700;
  }
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
