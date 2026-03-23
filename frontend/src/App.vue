<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'

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
</script>

<template>
  <div class="app-layout">
    <header class="glass-navbar">
      <div class="logo">
        <span class="joule">JOULE:</span> <span class="zp">ZERO POINT</span>
      </div>
      <nav>
        <RouterLink to="/">Orizzonte</RouterLink>
        <RouterLink to="/cards">Database</RouterLink>
        <RouterLink to="/deckbuilder">Mazzi</RouterLink>
        
        <template v-if="username">
          <span class="welcome-text">Bentornato, {{ username }}</span>
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

    <div class="ambient-glow"></div>
  </div>
</template>

<style scoped>
.welcome-text {
  color: var(--text-muted);
  font-family: var(--font-display);
  font-weight: 600;
}
</style>
