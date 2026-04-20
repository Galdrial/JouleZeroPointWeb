<script setup lang="ts">
import { ref } from "vue";
import api from "../utils/api";
import { useNotificationStore } from "../stores/notificationStore";

const notificationStore = useNotificationStore();

/**
 * Contact Form State
 * Implements a reactive interface for user input.
 * In this version, the form is for UI demonstration, triggering a mailto fallback.
 */
const form = ref({
  name: "",
  email: "",
  subject: "",
  message: "",
  privacyConsent: false,
});

const isSubmitting = ref(false);

const handleSubmit = async () => {
  if (!form.value.name || !form.value.email || !form.value.message) {
    notificationStore.error(
      "Protocollo incompleto. Inserire tutti i dati richiesti.",
    );
    return;
  }

  if (!form.value.privacyConsent) {
    notificationStore.error(
      "È necessario accettare la Privacy Policy per inviare il segnale.",
    );
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await api.post('/contact', form.value);
    
    notificationStore.success(
      response.data.message || "Segnale trasmesso con successo. Il team riceverà la comunicazione."
    );

    // Reset form
    form.value = { name: "", email: "", subject: "", message: "", privacyConsent: false };
  } catch (error: any) {
    console.error("Contact Form Error:", error);
    notificationStore.error(
      error.response?.data?.error || "Interferenza durante la trasmissione. Riprovare."
    );
  } finally {
    isSubmitting.value = false;
  }
};

const discordInviteUrl = "https://discord.gg/kjFWC5Uj";
</script>

<template>
  <div class="contact-view fade-in centered">
    <h1 class="glitch-text" data-text="CONTATTACI">CONTATTACI</h1>

    <div class="contact-grid">
      <!-- Channel info section -->
      <section class="info-section">
        <div class="glass-panel info-card">
          <div class="card-icon">📡</div>
          <h3>FREQUENZA DIRETTA</h3>
          <p>
            Hai domande sul gioco, proposte di partnership o hai trovato
            un'anomalia nel sistema? Il nostro nucleo operativo è pronto ad
            ascoltarti.
          </p>
          <a href="mailto:info@joulezeropoint.com" class="email-link"
            >info@joulezeropoint.com</a
          >
        </div>

        <div class="glass-panel info-card">
          <div class="card-icon">⚡</div>
          <h3>HUB DI COMUNICAZIONE</h3>
          <p>
            Per supporto tecnico rapido, feedback sulle carte o per trovare
            altri Costruttori, il nostro server Discord è la via più veloce.
          </p>
          <a
            :href="discordInviteUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="cyber-btn btn-secondary full-width"
          >
            ENTRA NEL DISCORD
          </a>
        </div>
      </section>

      <!-- Contact form (Encrypted Signal) -->
      <section class="form-section">
        <div class="glass-panel contact-panel">
          <div class="panel-header">
            <span class="status-dot"></span>
            <h2>INVIA SEGNALE CRIPTATO</h2>
          </div>

          <form @submit.prevent="handleSubmit" class="cyber-form">
            <div class="form-group">
              <label for="name">IDENTIFICATIVO (NOME)</label>
              <input
                type="text"
                id="name"
                v-model="form.name"
                placeholder="Inserisci il tuo nome..."
                required
              />
            </div>

            <div class="form-group">
              <label for="email">COORDINATE (EMAIL)</label>
              <input
                type="email"
                id="email"
                v-model="form.email"
                placeholder="latua@email.com"
                required
              />
            </div>

            <div class="form-group">
              <label for="subject">OGGETTO DEL MESSAGGIO</label>
              <input
                type="text"
                id="subject"
                v-model="form.subject"
                placeholder="Supporto, Feedback, Altro..."
              />
            </div>

            <div class="form-group">
              <label for="message">TRASMISSIONE (MESSAGGIO)</label>
              <textarea
                id="message"
                v-model="form.message"
                rows="5"
                placeholder="Scrivi qui il tuo messaggio..."
                required
              ></textarea>
            </div>

            <div class="form-group checkbox-group">
              <label class="privacy-label">
                <input 
                  type="checkbox" 
                  v-model="form.privacyConsent" 
                  required 
                />
                <span class="checkbox-custom"></span>
                <span>
                  Ho letto e accetto la 
                  <router-link to="/privacy" target="_blank" class="privacy-link">Privacy Policy</router-link> 
                  per il trattamento dei miei dati personali.
                </span>
              </label>
            </div>

            <button
              type="submit"
              class="cyber-btn btn-primary submit-btn"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? "TRASMISSIONE IN CORSO..." : "INVIA SEGNALE" }}
            </button>
          </form>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.contact-view {
  width: min(1200px, 100%);
  margin-top: 2rem;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 2rem;
  margin-top: 1rem;
}

@media (max-width: 900px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}

/* Info Cards */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card {
  padding: 2rem;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-icon {
  font-size: 2rem;
  opacity: 0.8;
}

.info-card h3 {
  font-family: var(--font-display);
  letter-spacing: 2px;
  color: var(--accent-gold);
}

.info-card p {
  color: var(--text-muted);
  line-height: 1.6;
  font-size: 0.95rem;
}

.email-link {
  color: var(--text-main);
  text-decoration: underline;
  font-weight: 600;
  transition: color 0.3s;
}

.email-link:hover {
  color: var(--accent-gold);
}

/* Form Panel */
.contact-panel {
  padding: 0;
  overflow: hidden;
}

.panel-header {
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  background: var(--accent-gold);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--accent-gold);
  animation: pulse 2s infinite;
}

.panel-header h2 {
  font-size: 1rem;
  font-family: var(--font-display);
  letter-spacing: 2px;
  margin-bottom: 0;
}

.cyber-form {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--text-muted);
}

.form-group input,
.form-group textarea {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--glass-border);
  border-radius: 4px;
  padding: 0.8rem 1rem;
  color: #fff;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-gold);
  background: rgba(212, 175, 55, 0.05);
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.1);
}

.submit-btn {
  width: 100%;
  padding: 1.2rem !important;
  font-size: 1rem !important;
  margin-top: 1rem;
}

@keyframes pulse {
  0% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.4;
  }
}

.centered {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
}

.glitch-text {
  text-align: center;
  margin-bottom: 3.5rem !important;
  font-size: clamp(2.2rem, 5vw, 3.5rem);
  font-family: var(--font-display);
  letter-spacing: clamp(0.18rem, 1vw, 0.5rem);
  background: linear-gradient(135deg, #fff 0%, var(--accent-gold) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
}

/* Privacy Checkbox Styling */
.checkbox-group {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.privacy-label {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  cursor: pointer;
  font-size: 0.85rem !important;
  color: var(--text-muted) !important;
  line-height: 1.4;
  text-transform: none !important;
  letter-spacing: normal !important;
  font-weight: normal !important;
}

.privacy-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkbox-custom {
  position: relative;
  display: inline-block;
  min-width: 18px;
  height: 18px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--glass-border);
  border-radius: 3px;
  transition: all 0.2s ease;
  margin-top: 2px;
}

.privacy-label:hover input ~ .checkbox-custom {
  border-color: var(--accent-gold);
}

.privacy-label input:checked ~ .checkbox-custom {
  background-color: rgba(212, 175, 55, 0.2);
  border-color: var(--accent-gold);
}

.checkbox-custom:after {
  content: "";
  position: absolute;
  display: none;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid var(--accent-gold);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.privacy-label input:checked ~ .checkbox-custom:after {
  display: block;
}

.privacy-link {
  color: var(--accent-gold);
  text-decoration: underline;
  text-decoration-color: rgba(212, 175, 55, 0.4);
  transition: all 0.2s ease;
}

.privacy-link:hover {
  text-decoration-color: var(--accent-gold);
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
}
</style>
