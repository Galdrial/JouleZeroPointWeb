<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

const isLogin = ref(true);
const username = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  error.value = '';
  success.value = '';
};

const submitForm = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    if (isLogin.value) {
      const res = await axios.post('http://localhost:3000/api/auth/login', {
        email: email.value,
        password: password.value
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      success.value = res.data.message;
      setTimeout(() => router.push('/'), 1200);
    } else {
      const res = await axios.post('http://localhost:3000/api/auth/register', {
        username: username.value,
        email: email.value,
        password: password.value
      });
      success.value = res.data.message;
      setTimeout(() => { 
        isLogin.value = true; 
        password.value = '';
      }, 2000);
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Errore di comunicazione col Nucleo Centrale.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-view fade-in">
    <div class="glass-panel auth-panel">
      <h2>{{ isLogin ? 'Accesso Costruttori' : 'Nuova Sincronizzazione' }}</h2>
      
      <div v-if="error" class="alert-box error">{{ error }}</div>
      <div v-if="success" class="alert-box success">{{ success }}</div>

      <form @submit.prevent="submitForm">
        <input v-if="!isLogin" v-model="username" type="text" placeholder="Nome Costruttore" class="glass-input" required />
        <input v-model="email" type="email" placeholder="Frequenza Temporale (Email)" class="glass-input" required />
        <input v-model="password" type="password" placeholder="Passphrase" class="glass-input" required />
        <button type="submit" class="btn-primary full-width" :disabled="loading">
          {{ loading ? 'Elaborazione...' : (isLogin ? 'Sincronizzazione' : 'Registra Frequenza') }}
        </button>
      </form>

      <p class="toggle-text">
        {{ isLogin ? 'Non hai un identificativo temporale?' : 'Hai già una frequenza registrata?' }}
        <a href="#" @click.prevent="toggleMode">{{ isLogin ? 'Inizializzalo' : 'Accedi' }}</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.alert-box {
  padding: 0.8rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  text-align: center;
}
.error {
  background: rgba(255, 0, 60, 0.2);
  border: 1px solid var(--accent-magenta);
  color: #ff80a0;
}
.success {
  background: rgba(0, 255, 100, 0.2);
  border: 1px solid #00ff88;
  color: #80ffc0;
}
.toggle-text {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.toggle-text a {
  color: var(--accent-cyan);
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.5rem;
}
.toggle-text a:hover {
  text-decoration: underline;
  text-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
}
</style>
