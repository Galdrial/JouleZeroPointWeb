<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../utils/api';
import { useNotificationStore } from '../stores/notificationStore';

const route = useRoute();
const router = useRouter();
const notifications = useNotificationStore();

const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);

const submitReset = async () => {
  if (password.value !== confirmPassword.value) {
    notifications.error("Errore crittografico: Le Passphrase non combaciano.");
    return;
  }
  
  loading.value = true;
  const token = route.params.token;
  try {
    const res = await api.post(`/auth/reset-password/${token}`, { password: password.value });
    notifications.success(res.data.message || "Passphrase aggiornata con successo.");
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  } catch (error: any) {
    notifications.error(error.response?.data?.error || "Gettone temporale scaduto o inesistente.");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="reset-wrapper fade-in">
    <div class="glass-panel text-center">
      <h2>Inizializzazione Sicurezza</h2>
      <p class="subtitle">La tua connessione all'enclave è protetta. Inserisci e conferma la tua nuova Passphrase.</p>
      
      <form @submit.prevent="submitReset" class="reset-form">
        <input 
          v-model="password" 
          type="password" 
          placeholder="Nuova Passphrase" 
          class="glass-input full-width" 
          required 
        />
        <input 
          v-model="confirmPassword" 
          type="password" 
          placeholder="Conferma Nuova Passphrase" 
          class="glass-input full-width" 
          required 
        />
        <div class="action-box">
          <button type="submit" class="cyber-btn btn-primary full-width" :disabled="loading">
            {{ loading ? 'Applicazione crittografia...' : 'Aggiorna Passphrase' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.reset-wrapper {
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

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.full-width {
  width: 100%;
}
</style>
