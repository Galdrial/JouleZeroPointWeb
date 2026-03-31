<script setup lang="ts">
// Vista statica per il Codice di Condotta
</script>

<template>
  <div class="legal-view fade-in">
    <h1 class="glitch-text" data-text="CODICE DI CONDOTTA">CODICE DI CONDOTTA</h1>
    <div class="glass-panel legal-content">
      <p class="last-updated">Ultimo aggiornamento: 31 Marzo 2026</p>
      
      <h2>1. Rispetto Reciproco</h2>
      <p>Il Punto Zero è un metasistema condiviso tra molti Costruttori. È richiesto il massimo rispetto verso tutti i membri della community. Insulti, bullismo, molestie, odio razziale, di genere o qualsiasi altra forma di discriminazione comporteranno l'esilio istantaneo dalla Matrice.</p>

      <h2>2. Fair Play Strategico</h2>
      <p>All'interno delle simulazioni pubbliche e dei tornei di Joule: Zero Point (anche su piattaforme terze come Tabletop Simulator, Discord o dal vivo), ci aspettiamo che i giocatori competano con assoluta correttezza agonistica. Sfruttare volontariamente vulnerabilità meccaniche non previste ("barare") recide il delicato equilibrio termodinamico e non sarà tollerato.</p>

      <h2>3. Condivisione Pubblica dei Mazzi</h2>
      <p>La condivisione dei propri incastri strategici con la rete è incoraggiata. Tuttavia, è severamente vietato pubblicare mazzi con titoli o descrizioni volgari, blasfeme, diffamatorie o offensive. Tali artefatti verranno vaporizzati dal database in via definitiva, senza alcun preavviso al creatore originario.</p>

      <h2>4. Segnalazione di Anomalie (Bug & Exploit)</h2>
      <p>I Costruttori devoti che smascherano falle di sistema, bug critici o vulnerabilità logiche nel bilanciamento sono pregati di non sfruttarle a proprio vantaggio, bensì di segnalarle in modo privato ai Sommi Creatori sulla piattaforma ufficiale Discord. Divulgare metodi di sfruttamento causerà pesanti infrazioni dell'account.</p>

      <h2>5. Sanzioni e Arbitrato</h2>
      <p>I contenziosi e le contravvenzioni al Codice di Condotta saranno valutati insindacabilmente dagli amministratori di Joule. I provvedimenti andranno dal reset dell'account al wipe temporale (ban definitivo di email e IP connessi).</p>
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
