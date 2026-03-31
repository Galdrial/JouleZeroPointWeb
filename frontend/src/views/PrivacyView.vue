<script setup lang="ts">
// Static view for the GDPR Privacy Policy
</script>

<template>
  <div class="legal-view fade-in">
    <h1 class="glitch-text" data-text="PRIVACY POLICY">INFORMATIVA PRIVACY</h1>
    <div class="glass-panel legal-content">
      <p class="last-updated">Ultimo aggiornamento: 31 Marzo 2026</p>
      
      <h2>1. Origine e Natura dei Dati Raccolti</h2>
      <p>Ai fini dell'erogazione dei servizi primari e secondari riguardanti Joule: Zero Point, il Sistema raccoglie solo l'essenziale per il mantenimento dell'identità del Costruttore: indirizzo e-mail, pseudonimo utente (username), password (inequivocabilmente cifrata) e la metrica di gioco (mazzi creati, cronologia esportazione in TTS o PDF).</p>

      <h2>2. Finalità di Computazione e Trattamento</h2>
      <p>I dati anagrafici forniti vengono utilizzati unicamente per l'autenticazione biometrica-digitale al database dell'applicazione. Nessun dato è raccolto forzatamente al di fuori di quelli consenzientemente inseriti. Registriamo log di errore limitati solo al fine di evitare i crash della Matrice e tutelare l'integrità temporale del software.</p>

      <h2>3. Sicurezza, Cifratura e Archiviazione</h2>
      <p>Implementiamo protocolli di sicurezza standard per proteggere le comunicazioni verso i nostri nodi cloud. Le credenziali non sono visibili in chiaro e tutte le connessioni da e per Joule: Zero Point viaggiano crittografate sotto standard HTTPS.</p>

      <h2>4. Conservazione Temporale (Retention)</h2>
      <p>L'identità del Costruttore e i dati associati rimarranno innestati nella Matrice finché esisterà l'account. Su richiesta di eliminazione (Diritto all'Oblio), i dati dell'account verranno fisicamente distrutti. Alcune creazioni originariamente impostate su "Pubbliche", qualora clonate da altri giocatori, potrebbero perdere l'ancoraggio al nome utente originale ma restare sotto forma algoritmica anonimizzata in base alla persistenza del network.</p>

      <h2>5. Condivisione e Divieti con Terzi Soggetti</h2>
      <p>Il Team di Sviluppo non commercializzerà, scambierà, tantomeno cederà segretamente a terze corporazioni i frammenti della tua identità. Condivisioni tecniche avvengono unicamente con l'infrastruttura di hosting e database sottostante strettamente necessaria a erogare l'app in server protetti.</p>
      
      <h2>6. I tuoi Diritti da Costruttore (Protocollo GDPR)</h2>
      <p>Nel pieno rispetto del GDPR, hai totale accesso ai sensori di controllo. Puoi rettificare, richiedere l'estrazione e far disintegrare definitivamente i tuoi dati attivi dai nostri sistemi scrivendo al reparto Amministrazione tramite il nostro server Discord ufficiale o i recapiti social.</p>
    </div>
  </div>
</template>

<style scoped>
.legal-view {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
  padding-bottom: clamp(3rem, 6vw, 5rem);
  min-height: calc(100vh - 120px);
  text-align: left;
}
.legal-view h1 {
  font-size: clamp(2.2rem, 5vw, 3.5rem);
  font-family: var(--font-display);
  letter-spacing: clamp(0.18rem, 1vw, 0.5rem);
  background: linear-gradient(135deg, #fff 0%, var(--accent-gold) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: clamp(2rem, 5vw, 3.5rem) !important;
  text-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
  text-align: center;
}
.legal-content {
  padding: clamp(1.5rem, 4vw, 3rem);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: rgba(10, 15, 25, 0.85);
}
.last-updated {
  font-style: italic;
  color: var(--accent-gold);
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(254, 220, 104, 0.2);
  padding-bottom: 1rem;
  margin-bottom: 0.5rem;
}
.legal-content h2 {
  color: var(--text-light);
  font-family: var(--font-display);
  font-size: 1.3rem;
  margin-top: 1rem;
  letter-spacing: 1px;
}
.legal-content p {
  color: var(--text-muted);
  line-height: 1.7;
  font-size: 1rem;
}
</style>
