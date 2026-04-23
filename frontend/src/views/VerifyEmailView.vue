<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../utils/api';

const route = useRoute();
const router = useRouter();

const statusMsg = ref("Validazione chiavi crittografiche in corso...");
const isSuccess = ref(false);
const isLoading = ref(true);

onMounted(async () => {
  const token = route.params.token;
  try {
    const res = await api.get(`/auth/verify/${token}`);
    statusMsg.value = res.data.message || "Frequenza attivata con successo.";
    isSuccess.value = true;
  } catch (error: unknown) {
    const axiosErr = error as { response?: { data?: { error?: string } } };
    statusMsg.value = axiosErr.response?.data?.error || "Connessione corrotta. Gettone non valido.";
    isSuccess.value = false;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="verify-view fade-in">
    <div class="glass-panel text-center">
      <h2 class="glitch-text" :data-text="isSuccess ? 'Sistema Sbloccato' : 'Anomalia Rilevata'">
        {{ isSuccess ? 'Sistema Sbloccato' : 'Anomalia Rilevata' }}
      </h2>
      
      <p class="status-message" :class="{ 'error-msg': !isSuccess && !isLoading }">
        {{ statusMsg }}
      </p>

      <div class="action-box">
        <button v-if="!isLoading" class="cyber-btn btn-primary" @click="router.push('/login')">
          Torna all'Autenticazione
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verify-view {
  min-height: 60vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.text-center {
  width: 100%;
  max-width: 500px;
  text-align: center;
  padding: 3rem;
}

.status-message {
  color: var(--text-muted);
  margin-top: 1.5rem;
  margin-bottom: 2rem;
  font-family: var(--font-display);
  font-size: 1.1rem;
}

.error-msg {
  color: var(--accent-magenta);
}

.action-box {
  margin-top: 2rem;
}
</style>
