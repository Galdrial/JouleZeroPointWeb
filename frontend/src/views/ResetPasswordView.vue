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
const shakeError = ref(false);

const triggerShake = () => {
  shakeError.value = true;
  setTimeout(() => (shakeError.value = false), 600);
};

const submitReset = async () => {
  if (password.value.length < 8) {
    triggerShake();
    notifications.error("Frequenza troppo corta: La Passphrase deve essere di almeno 8 caratteri.");
    return;
  }

  if (password.value !== confirmPassword.value) {
    triggerShake();
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
          class="glass-input full-width no-margin" 
          :class="{ 'shake-limit': shakeError && password.length < 8 }"
          required 
        />
        <div class="password-requirements">
          <span :class="{ 'met': password.length >= 8 }">
            {{ password.length >= 8 ? '✓' : '○' }} Almeno 8 caratteri necessari
          </span>
        </div>
        <input 
          v-model="confirmPassword" 
          type="password" 
          placeholder="Conferma Nuova Passphrase" 
          class="glass-input full-width no-margin" 
          :class="{ 'shake-limit': shakeError && password !== confirmPassword }"
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
  gap: 1.2rem;
}

.no-margin {
  margin: 0 !important;
}

.full-width {
  width: 100%;
}

/* Password Requirements Styling */
.password-requirements {
  text-align: center;
  margin: -0.2rem 0;
  font-size: 0.78rem;
  color: var(--text-muted);
  font-family: var(--font-body);
  transition: all 0.3s ease;
}
.password-requirements span {
  display: inline-block;
  padding: 0.2rem 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  border-radius: 20px;
}
.password-requirements .met {
  color: #00ff88;
  border-color: rgba(0, 255, 136, 0.3);
  background: rgba(0, 255, 136, 0.05);
  text-shadow: 0 0 12px rgba(0, 255, 136, 0.4);
}

/* Error Feedback Animations */
.shake-limit {
  animation: shake-limit 0.4s cubic-bezier(.36,.07,.19,.97) both;
  border-color: rgba(255, 0, 60, 0.5) !important;
  box-shadow: 0 0 15px rgba(255, 0, 60, 0.15) !important;
}

@keyframes shake-limit {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
