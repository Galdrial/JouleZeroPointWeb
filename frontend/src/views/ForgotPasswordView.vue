<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../utils/api';
import { useNotificationStore } from '../stores/notificationStore';

const router = useRouter();
const notifications = useNotificationStore();

const email = ref("");
const loading = ref(false);

const submitRequest = async () => {
  if (!email.value) return;
  loading.value = true;
  try {
    const res = await api.post("/auth/forgot-password", { email: email.value });
    notifications.success(res.data.message || "Richiesta inviata. Controlla la casella di posta.");
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  } catch (error: any) {
    notifications.error("Si è verificato un errore durante la generazione della richiesta.");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="forgot-wrapper fade-in">
    <div class="glass-panel text-center">
      <h2>Recupero Chiavi</h2>
      <p class="subtitle">Inserisci la tua Frequenza Temporale (Email) originaria. Il sistema invierà un gettone crittografico per ripristinare l'accesso.</p>
      
      <form @submit.prevent="submitRequest" class="forgot-form">
        <input 
          v-model="email" 
          type="email" 
          placeholder="Frequenza Temporale (Email)" 
          class="glass-input full-width" 
          required 
        />
        <div class="action-box">
          <button type="submit" class="cyber-btn btn-primary full-width" :disabled="loading">
            {{ loading ? 'Sintesi in corso...' : 'Invia Modulo di Recupero' }}
          </button>
        </div>
      </form>

      <p class="toggle-text">
        Non hai bisogno di aiuto?
        <RouterLink to="/login" class="back-link">Torna al Login</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.forgot-wrapper {
  min-height: 70vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.text-center {
  width: 100%;
  max-width: 480px;
  text-align: center;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.forgot-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.full-width {
  width: 100%;
}

.toggle-text {
  margin-top: 2rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.back-link {
  color: var(--accent-gold);
  text-decoration: none;
  font-weight: bold;
  margin-left: 0.5rem;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
