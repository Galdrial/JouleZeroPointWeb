<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../utils/api";
import { useAuthStore } from "../stores/auth";
import { useNotificationStore } from "../stores/notificationStore";

/**
 * Card Interface
 * Structural definition for fragment assets.
 */
interface Card {
  id: number;
  name: string;
  type: string;
  rarity: string;
  image_url: string;
}

/**
 * SavedDeck Interface
 * Structural definition for synchronized deck artifacts.
 */
interface SavedDeck {
  id: number;
  name: string;
  costruttoreId: number | null;
  creator: string;
  cards: { cardId: number; count: number }[];
  isPublic: boolean;
}

// Global Orchestration: Routing & Stores
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const notifications = useNotificationStore();

// Identity State
const username = ref(route.query.user?.toString() || authStore.username);
const isOwnProfile = computed(
  () => !route.query.user || route.query.user === authStore.username,
);

// Identity Management State
const newName = ref(authStore.username);
const isUpdating = ref(false);
const isSendingReset = ref(false);
const showAliasConfirm = ref(false);

// Resource Loading State
const loading = ref(true);
const userDecks = ref<SavedDeck[]>([]);
const allCards = ref<Card[]>([]);
const showDeleteConfirm = ref(false);

/**
 * Perspective Observer: Watch for user parameter mutations.
 */
watch(
  () => route.query.user,
  (newVal) => {
    username.value = newVal?.toString() || authStore.username;
    fetchProfileData();
  },
);

/**
 * Data Retrieval Protocol: Fetch Profile Artifacts
 * Synchronizes the dashboard with the user's saved decks and card registry.
 */
const fetchProfileData = async () => {
  try {
    loading.value = true;
    const [decksRes, cardsRes] = await Promise.all([
      api.get(`/decks?creator=${username.value}`),
      api.get("/cards"),
    ]);
    userDecks.value = decksRes.data.decks;
    allCards.value = cardsRes.data;
  } catch (error) {
    // Managed via global notification infrastructure
  } finally {
    loading.value = false;
  }
};

/**
 * Security Protocol: Decommission Account
 * Irreversibly purges all synchronized decks and identity data from the Matrix.
 */
const deleteAccount = async () => {
  try {
    // Terminate Identity Record (Backend handled atomic purge of user + decks)
    await api.delete(`/auth/profile`);

    // 3. Cleanup session and redirect to terminal login
    notifications.success("Account terminato. Tutti i dati epurati dai database Atlas.");
    authStore.logout();
    router.push("/login");
  } catch (error) {
    // Managed via global error handlers
  }
};

/**
 * Protocol: Initiate Identity Update
 * Triggers confirmation if alias signature is being modified.
 */
const updateIdentity = () => {
  if (newName.value === authStore.username) {
    notifications.warn("Identità invariata. Inserire un nuovo Alias.");
    return;
  }
  showAliasConfirm.value = true;
};

/**
 * Protocol: Confirm and Update Identity Profile
 * Synchronizes new alias with the central Matrix.
 */
const confirmUpdateIdentity = async () => {
  try {
    isUpdating.value = true;
    await authStore.updateProfile({
      username: newName.value || undefined
    });
    notifications.success("Protocollo di identità aggiornato con successo.");
    username.value = authStore.username; // Synchronize header display
    showAliasConfirm.value = false;
  } catch (error) {
    // Managed via notification infrastructure
  } finally {
    isUpdating.value = false;
  }
};

/**
 * Security Protocol: Trigger Passphrase Reset
 * Dispatches a high-frequency reset link to the user's registered email.
 */
const triggerPassphraseReset = async () => {
  if (!authStore.email) {
    notifications.error("Segnale email non trovato. Contattare l'amministrazione.");
    return;
  }
  
  try {
    isSendingReset.value = true;
    notifications.info("Inizializzazione reset passphrase...");
    await authStore.requestPasswordReset(authStore.email);
    notifications.success(`Link di sincronizzazione inviato a: ${authStore.email}`);
  } catch (error) {
    notifications.error("Errore nel dispacciamento del link di reset.");
  } finally {
    isSendingReset.value = false;
  }
};

/**
 * Protocol: Execute Data Portability Export
 * Requests a complete JSON archive of the user's Matrix footprint (GDPR Art. 20).
 */
const handleDataExport = async () => {
  try {
    notifications.info("Generazione archivio dati in corso...");
    const response = await api.get('/auth/export-data', { responseType: 'blob' });
    
    // Create download bridge
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `joule_export_${authStore.username}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    notifications.success("Archivio dati scaricato con successo.");
  } catch (error) {
    notifications.error("Errore durante l'esportazione dei dati.");
  }
};

onMounted(fetchProfileData);

/**
 * Computed Logic: Aggregate Resource Metrics
 */
const totalCardsInDecks = computed(() => {
  return userDecks.value.reduce((acc, deck) => {
    return acc + deck.cards.reduce((sum, c) => sum + c.count, 0);
  }, 0);
});

/**
 * Registry Lookup: Retrieve Constructor Asset URL
 */
const getCostruttoreImage = (deck: SavedDeck) => {
  const costruttore = allCards.value.find((c) => String(c.id) === String(deck.costruttoreId));
  return costruttore ? costruttore.image_url : "/assets/cards/placeholder.png";
};

/**
 * Registry Lookup: Retrieve Constructor Nominal ID
 */
const getCostruttoreName = (deck: SavedDeck) => {
  const costruttore = allCards.value.find((c) => String(c.id) === String(deck.costruttoreId));
  return costruttore ? costruttore.name : "Unknown";
};

/**
 * Viewport Bridge: Navigate to Deckbuilder terminal
 */
const goToDeck = () => {
  router.push("/deckbuilder");
};
</script>

<template>
  <div class="profile-page">
    <div class="profile-header glass-panel">
      <div class="cyber-avatar">
        <div class="avatar-glow"></div>
        <div class="avatar-symbol">{{ username.charAt(0).toUpperCase() }}</div>
      </div>
      <div class="user-info">
        <h1 class="username-title">{{ username }}</h1>
        <div class="user-badges">
          <span class="badge status">ACTIVE</span>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card glass-panel">
        <div class="stat-label">MAZZI CREATI</div>
        <div class="stat-value">{{ userDecks.length }}</div>
      </div>
      <div class="stat-card glass-panel">
        <div class="stat-label">CARTE TOTALI</div>
        <div class="stat-value">{{ totalCardsInDecks }}</div>
      </div>
    </div>

    <section class="user-decks-section">
      <div class="section-header">
        <h2 class="cyber-subtitle">I TUOI MAZZI SINCRONIZZATI</h2>
        <div class="header-line"></div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="scanner-bar"></div>
        CARICAMENTO DATI...
      </div>

      <div v-else-if="userDecks.length === 0" class="empty-state glass-panel">
        <p>NESSUN MAZZO TROVATO NEI TUOI ARCHIVI.</p>
        <RouterLink to="/deckbuilder" class="cyber-btn">CREA ORA</RouterLink>
      </div>

      <div v-else class="decks-grid">
        <div
          v-for="deck in userDecks"
          :key="deck.id"
          class="deck-card glass-panel hover-glow"
          @click="goToDeck()"
        >
          <div class="deck-header">
            <span class="deck-name">{{ deck.name }}</span>
          </div>

          <div class="deck-hero-container">
            <img
              :src="getCostruttoreImage(deck)"
              :alt="getCostruttoreName(deck)"
              class="deck-hero"
            />
          </div>

          <div class="deck-hero-caption">
            <span class="caption-name">{{ getCostruttoreName(deck) }}</span>
            <div class="tag-row mt-spacing">
              <span class="privacy-tag" :class="{ public: deck.isPublic }">
                {{ deck.isPublic ? "PUBBLICO" : "PRIVATO" }}
              </span>
            </div>
          </div>

          <div v-if="isOwnProfile" class="deck-footer">
            <span class="edit-btn">
              <span>MODIFICA ARCHIVIO</span>
              <svg viewBox="0 0 16 16" class="edit-btn-icon" aria-hidden="true">
                <path
                  d="M6.5 3.5L11 8l-4.5 4.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Profile Configuration -->
    <section v-if="isOwnProfile" class="profile-config-section">
      <div class="section-header">
        <h2 class="cyber-subtitle">CONFIGURAZIONE PROFILO</h2>
        <div class="header-line"></div>
      </div>
      
      <div class="config-panel glass-panel">
        <div class="form-grid">
          <!-- Alias Section -->
          <div class="input-group">
            <label for="display-name" class="cyber-label">NOME VISIBILE (ALIAS)</label>
            <div class="alias-update-row">
              <input 
                id="display-name" 
                v-model="newName" 
                type="text" 
                placeholder="Inserisci nuovo alias..." 
                class="glass-input no-margin"
                autocomplete="username"
              />
              <button class="cyber-btn btn-primary" :disabled="isUpdating || newName === authStore.username" @click="updateIdentity">
                {{ isUpdating ? "SYNC..." : "MODIFICA" }}
              </button>
            </div>
            <small class="input-hint">L'Alias è la tua firma pubblica nel Punto Zero.</small>
          </div>
          
          <!-- Security Section -->
          <div class="input-group">
            <label class="cyber-label">SICUREZZA PASSPHRASE</label>
            <div class="security-action-panel">
              <p class="security-note">
                Per garantire l'integrità neurale, il cambio password avviene tramite link di sincronizzazione inviato alla tua email registrata.
              </p>
              <button 
                class="cyber-btn btn-secondary full-width" 
                :disabled="isSendingReset"
                @click="triggerPassphraseReset"
              >
                {{ isSendingReset ? "DISPACCIAMENTO LINK..." : "INVIA LINK DI RESET" }}
              </button>

              <div class="portability-section mt-spacing">
                <button 
                  class="cyber-btn btn-secondary full-width" 
                  @click="handleDataExport"
                >
                  DOWNLOAD DATA EXTRACTION (JSON)
                </button>
                <small class="input-hint">Esporta i tuoi dati e i tuoi mazzi (Art. 20 GDPR).</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Danger Zone -->
    <section v-if="isOwnProfile" class="danger-zone">
      <div class="section-header">
        <h2 class="cyber-subtitle magenta">DANGER ZONE</h2>
        <div class="header-line magenta"></div>
      </div>
      <div class="danger-panel glass-panel">
        <div class="danger-content">
          <h3>ELIMINAZIONE DATI GENETICI</h3>
          <p>
            L'eliminazione dell'account rimuoverà permanentemente tutti i tuoi
            mazzi sincronizzati e i tuoi record dal database del Punto Zero.
          </p>
        </div>
        <button class="cyber-btn btn-danger" @click="showDeleteConfirm = true">
          ELIMINA ACCOUNT
        </button>
      </div>
    </section>

    <!-- Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay">
      <div class="confirm-modal glass-panel">
        <div class="modal-header">
          <span class="warning-icon">⚠️</span>
          <h2>CONFERMA ELIMINAZIONE?</h2>
        </div>
        <p>
          Questa azione è irreversibile. Tutta la tua sincronizzazione verrà
          persa nei flussi del tempo.
        </p>
        <div class="modal-actions">
          <button
            class="cyber-btn btn-secondary"
            @click="showDeleteConfirm = false"
          >
            ANNULLA
          </button>
          <button class="cyber-btn btn-danger" @click="deleteAccount">
            CONFERMA ELIMINAZIONE
          </button>
        </div>
      </div>
    </div>

    <!-- Alias Confirmation Modal -->
    <div v-if="showAliasConfirm" class="modal-overlay">
      <div class="confirm-modal glass-panel">
        <div class="modal-header">
          <div class="header-icon-wrapper">
            <svg viewBox="0 0 24 24" class="cyber-icon gold" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" fill="currentColor" />
            </svg>
          </div>
          <h2>SINCRONIZZAZIONE ALIAS</h2>
        </div>
        <p>
          Vuoi sincronizzare il tuo nuovo Alias: <strong>{{ newName }}</strong>? 
          Questa sarà la tua nuova identificazione pubblica nel Matrix.
        </p>
        <div class="modal-actions">
          <button
            class="cyber-btn btn-secondary"
            @click="showAliasConfirm = false"
          >
            ANNULLA
          </button>
          <button class="cyber-btn btn-primary" :disabled="isUpdating" @click="confirmUpdateIdentity">
            {{ isUpdating ? "IN CORSO..." : "CONFERMA SINCRONIZZAZIONE" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  padding: clamp(1rem, 4vw, 4rem) clamp(0.5rem, 3vw, 2rem);
  max-width: 1200px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: clamp(1.25rem, 4vw, 3rem);
  padding: clamp(1.25rem, 4vw, 3rem);
  margin-bottom: clamp(1.5rem, 4vw, 3rem);
  border-left: 5px solid var(--accent-gold);
}

.cyber-avatar {
  position: relative;
  width: clamp(96px, 18vw, 150px);
  height: clamp(96px, 18vw, 150px);
  border-radius: 50%;
  background: rgba(212, 175, 55, 0.08);
  border: 2px solid var(--accent-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-glow {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(212, 175, 55, 0.22) 0%,
    transparent 70%
  );
  animation: pulse-avatar 4s infinite;
}

@keyframes pulse-avatar {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

.avatar-symbol {
  font-family: var(--font-display);
  font-size: clamp(3rem, 7vw, 5rem);
  color: var(--accent-gold);
  text-shadow: 0 0 20px var(--accent-gold);
}

.username-title {
  font-size: clamp(2rem, 6vw, 4rem);
  margin: 0;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
  line-height: 1.05;
  word-break: break-word;
}

.user-badges {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.3rem 0.8rem;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 1px;
  border-radius: 0;
}

.badge.status {
  background: rgba(0, 255, 150, 0.1);
  color: #00ff96;
  border: 1px solid #00ff96;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: clamp(1rem, 2.5vw, 2rem);
  margin-bottom: clamp(2rem, 5vw, 4rem);
}

.stat-card {
  padding: clamp(1.25rem, 3vw, 2rem);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.stat-value {
  font-size: clamp(2.4rem, 6vw, 3.5rem);
  font-family: var(--font-display);
  font-weight: 900;
  color: #fff;
  line-height: 1;
  margin: 0.5rem 0;
}

.stat-icon {
  display: none;
}

.cyber-subtitle {
  font-size: clamp(0.95rem, 2.5vw, 1.2rem);
  letter-spacing: clamp(2px, 0.6vw, 5px);
  color: var(--accent-gold);
  margin: 0;
}

.cyber-subtitle.magenta {
  color: var(--accent-magenta);
}

.section-header {
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 2rem);
  margin-bottom: clamp(1rem, 3vw, 2rem);
  flex-wrap: wrap;
}

.header-line {
  flex-grow: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--accent-gold), transparent);
}

.header-line.magenta {
  background: linear-gradient(90deg, var(--accent-magenta), transparent);
}

.decks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: clamp(1rem, 2.5vw, 2rem);
  margin-bottom: clamp(2rem, 5vw, 4rem);
}

.deck-card {
  padding: clamp(1rem, 2.5vw, 1.5rem);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.deck-card:hover {
  transform: translateY(-10px);
  border-color: var(--accent-gold);
  background: rgba(212, 175, 55, 0.08);
}

.deck-header {
  margin-bottom: 1rem;
}

.deck-name {
  font-weight: 700;
  color: #fff;
  font-size: 1.1rem;
  display: block;
}

.deck-hero-container {
  height: clamp(180px, 24vw, 200px);
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.deck-hero {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.deck-hero-caption {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
}

.caption-label {
  font-size: 0.6rem;
  color: var(--text-muted);
}

.caption-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.5rem;
}

.tag-row {
  display: flex;
  gap: 0.5rem;
}

.privacy-tag {
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border: 1px solid var(--accent-magenta);
  color: var(--accent-magenta);
}

.privacy-tag.public {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

.deck-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--accent-gold);
  font-weight: 700;
}

.edit-btn-icon {
  width: 0.8rem;
  height: 0.8rem;
  flex: 0 0 auto;
}

/* Profile Configuration Styles */
.profile-config-section {
  margin-bottom: clamp(2rem, 5vw, 4rem);
}

.config-panel {
  padding: clamp(1.25rem, 3vw, 2.5rem);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.cyber-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-gold);
  margin-bottom: 0.75rem;
  letter-spacing: 1px;
}

.no-margin {
  margin-bottom: 0 !important;
}

.input-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.65rem;
  color: var(--text-muted);
  font-style: italic;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
}

.alias-update-row {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.alias-update-row .glass-input {
  flex-grow: 1;
}

.alias-update-row .cyber-btn {
  white-space: nowrap;
  padding: 0.8rem 1.5rem;
}

.header-icon-wrapper {
  background: rgba(212, 175, 55, 0.1);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  border: 1px solid rgba(212, 175, 55, 0.2);
}

.cyber-icon {
  width: 20px;
  height: 20px;
}

.cyber-icon.gold {
  color: var(--accent-gold);
}

.security-action-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(212, 175, 55, 0.2);
}

.security-note {
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--text-muted);
  margin: 0;
}

.full-width {
  width: 100%;
}

.danger-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: clamp(1.25rem, 3vw, 2rem);
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid rgba(255, 0, 80, 0.3);
  background: rgba(255, 0, 80, 0.02);
}

.danger-content h3 {
  color: var(--accent-magenta);
  margin: 0 0 0.5rem 0;
  font-family: var(--font-display);
}

.danger-content p {
  color: var(--text-muted);
  margin: 0;
  max-width: 600px;
}

.mt-spacing {
  margin-top: 1rem;
}

.modal-actions {
  display: flex;
  gap: clamp(1rem, 3vw, 1.5rem);
  margin-top: clamp(1.5rem, 4vw, 2.5rem);
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .profile-header {
    text-align: center;
    justify-content: center;
  }

  .user-info,
  .user-badges {
    width: 100%;
    justify-content: center;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .header-line {
    width: 100%;
  }

  .deck-name {
    font-size: 1rem;
  }

  .caption-name {
    font-size: 0.85rem;
  }

  .deck-footer {
    display: flex;
    justify-content: flex-end;
  }

  .danger-panel .cyber-btn {
    width: 100%;
    text-align: center;
  }

  .confirm-modal {
    padding: 1.25rem 1rem;
  }

  .modal-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .modal-actions .cyber-btn {
    width: 100%;
    text-align: center;
  }
}
</style>
