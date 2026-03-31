<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../utils/api";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notificationStore";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notifications = useNotificationStore();

const isLogin = ref(route.query.mode !== "register");
const username = ref("");
const email = ref("");
const password = ref("");
const loading = ref(false);

const toggleMode = () => {
  isLogin.value = !isLogin.value;
};

const submitForm = async () => {
  loading.value = true;

  try {
    if (isLogin.value) {
      const res = await api.post("/auth/login", {
        email: email.value,
        password: password.value,
      });
      
      authStore.setAuth(res.data.token, res.data.username);
      notifications.success("Sincronizzazione completata con successo!");
      
      const redirectTo = (route.query.redirect as string) || "/";
      setTimeout(() => router.push(redirectTo), 800);
    } else {
      await api.post("/auth/register", {
        username: username.value,
        email: email.value,
        password: password.value,
      });
      notifications.success("Frequenza registrata con successo! Inizializzando portale d'accesso...");
      setTimeout(() => {
        isLogin.value = true;
        password.value = "";
      }, 2000);
    }
  } catch (err: any) {
    // Gli errori globali sono già gestiti dall'interceptor di api.ts
    // ma possiamo aggiungere logica specifica qui se necessario (es. focus campi)
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-view fade-in">
    <div class="glass-panel auth-panel">
      <h2>{{ isLogin ? "Accesso Costruttori" : "Nuova Sincronizzazione" }}</h2>

      <div v-if="isLogin && route.query.session_expired" class="alert-box error">Frequenza di sessione scaduta. Re-autenticazione richiesta.</div>

      <form @submit.prevent="submitForm">
        <input
          v-if="!isLogin"
          v-model="username"
          type="text"
          placeholder="Nome Costruttore"
          class="glass-input"
          required
        />
        <input
          v-model="email"
          type="email"
          placeholder="Frequenza Temporale (Email)"
          class="glass-input"
          required
        />
        <input
          v-model="password"
          type="password"
          placeholder="Passphrase"
          class="glass-input"
          required
        />
        <button
          type="submit"
          class="cyber-btn btn-primary full-width"
          :disabled="loading"
        >
          {{
            loading
              ? "Elaborazione..."
              : isLogin
                ? "Sincronizzazione"
                : "Registra Frequenza"
          }}
        </button>
      </form>

      <p class="toggle-text">
        {{
          isLogin
            ? "Non hai un identificativo temporale?"
            : "Hai già una frequenza registrata?"
        }}
        <a href="#" @click.prevent="toggleMode">{{
          isLogin ? "Inizializzalo" : "Accedi"
        }}</a>
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

.auth-panel .btn-primary,
.auth-panel .btn-primary:hover,
.auth-panel .btn-primary:disabled {
  color: #0a0e1a !important;
}
</style>
