<script setup lang="ts">
import { ref } from "vue";
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
});

const isSubmitting = ref(false);

const handleSubmit = async () => {
  if (!form.value.name || !form.value.email || !form.value.message) {
    notificationStore.error("Protocollo incompleto. Inserire tutti i dati richiesti.");
    return;
  }

  isSubmitting.value = true;
  
  // Simulazione invio (in attesa di integrazione backend/servizio esterno)
  setTimeout(() => {
    // Fallback professionale: Apertura client email con i dati pre-compilati
    const mailtoLink = `mailto:info@joulezeropoint.com?subject=${encodeURIComponent(form.value.subject || 'Contatto da Joule ZP')}&body=${encodeURIComponent(`Nome: ${form.value.name}\nEmail: ${form.value.email}\n\nMessaggio:\n${form.value.message}`)}`;
    window.location.href = mailtoLink;
    
    notificationStore.success("Canale di comunicazione aperto. Reindirizzamento al client email...");
    
    // Reset form
    form.value = { name: "", email: "", subject: "", message: "" };
    isSubmitting.value = false;
  }, 800);
};

const discordInviteUrl = "https://discord.gg/kjFWC5Uj";
</script>

<template>
  <div class="contact-view fade-in centered">
    <h1 class="glitch-text" data-text="CONTATTACI">CONTATTACI</h1>

    <div class="contact-grid">
      <!-- Sezione Info Canali -->
      <section class="info-section">
        <div class="glass-panel info-card">
          <div class="card-icon">📡</div>
          <h3>FREQUENZA DIRETTA</h3>
          <p>Hai domande sul gioco, proposte di partnership o hai trovato un'anomalia nel sistema? Il nostro nucleo operativo è pronto ad ascoltarti.</p>
          <a href="mailto:info@joulezeropoint.com" class="email-link">info@joulezeropoint.com</a>
        </div>

        <div class="glass-panel info-card">
          <div class="card-icon">⚡</div>
          <h3>HUB DI COMUNICAZIONE</h3>
          <p>Per supporto tecnico rapido, feedback sulle carte o per trovare altri Costruttori, il nostro server Discord è la via più veloce.</p>
          <a :href="discordInviteUrl" target="_blank" rel="noopener noreferrer" class="cyber-btn btn-secondary full-width">
            ENTRA NEL DISCORD
          </a>
        </div>
      </section>

      <!-- Form di Contatto (Encrypted Signal) -->
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

            <button type="submit" class="cyber-btn btn-primary submit-btn" :disabled="isSubmitting">
              {{ isSubmitting ? 'TRASMISSIONE IN CORSO...' : 'INVIA SEGNALE' }}
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
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
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
</style>
