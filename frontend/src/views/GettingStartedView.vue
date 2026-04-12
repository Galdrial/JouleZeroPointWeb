<script setup lang="ts">
/**
 * Global Constants: External Connection Gateways
 * Links to the official communication hub and virtualization environment.
 */
const discordInviteUrl = "https://discord.gg/kjFWC5Uj";
const tabletopModUrl =
  "https://steamcommunity.com/sharedfiles/filedetails/?id=3673801132";
</script>

<template>
  <div class="getting-started-view fade-in centered">
    <h1 class="glitch-text" data-text="COME INIZIARE">COME INIZIARE</h1>
    <section class="glass-panel intro-panel">
      <h1>&gt;_ PROTOCOLLO DI INIZIAZIONE: ACCESSO AL PUNTO ZERO</h1>
      <p>
        Benvenuto, Costruttore. JOULE: Zero Point è attualmente in fase di
        Closed Beta (v5.0). Per testare l'instabilità del sistema e le
        meccaniche complesse del gioco senza l'ingombro del calcolo mentale, le
        simulazioni di conflitto avvengono interamente in digitale.
      </p>
      <p>
        Segui questi 4 passaggi per accedere alla Matrice e iniziare a giocare.
      </p>
    </section>

    <section class="step-grid">
      <article class="glass-panel step-card step-card--wide">
        <h2>STEP 1: CONNESSIONE ALLA RETE (UNISCITI A DISCORD)</h2>
        <p>
          Il Punto Zero non si affronta da soli. Il primo passo è accedere al
          nostro terminale di comunicazione ufficiale. Sul server Discord potrai
          trovare avversari per le tue simulazioni, discutere le strategie,
          scaricare i mazzi pre-assemblati e dialogare direttamente con i
          creatori del gioco.
        </p>
        <a
          :href="discordInviteUrl"
          class="cyber-btn btn-primary step-btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          ACCEDI AL DISCORD
        </a>
      </article>

      <article class="glass-panel step-card step-card--wide">
        <h2>STEP 2: AVVIO DELLA SIMULAZIONE (TABLETOP SIMULATOR)</h2>
        <p>
          Le battaglie temporali si svolgono virtualmente. Avrai bisogno di una
          copia di Tabletop Simulator (su Steam). Una volta installato,
          iscriviti gratuitamente alla nostra Mod ufficiale nel Workshop per
          avere accesso immediato all'intero database di carte, al tabellone
          automatizzato e ai segnalini termici.
        </p>
        <a
          :href="tabletopModUrl"
          class="cyber-btn btn-primary step-btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          SCARICA LA MOD GRATUITA
        </a>
      </article>

      <article class="glass-panel step-card step-card--wide">
        <h2>STEP 3: ASSIMILAZIONE DELLE REGOLE (I 4 CONCETTI CHIAVE)</h2>
        <p>
          Prima di scendere in campo, devi comprendere le leggi fondamentali che
          governano questo nuovo universo. Consulta il Regolamento Ufficiale del
          Punto Zero, oppure, per iniziare, ti bastano queste 4 direttive base:
        </p>

        <router-link to="/regolamento" class="cyber-btn btn-primary step-btn">
          LEGGI IL REGOLAMENTO
        </router-link>

        <ul class="directive-list">
          <li>
            <strong>L'Obiettivo:</strong> Trionfa facendo collassare il tuo
            avversario. Usa la tua Energia Temporale (ET) per giocare carte e
            riduci a 0 l'Integrità Temporale (IT) nemica.
          </li>
          <li>
            <strong>Il Campo e il Flusso:</strong> Il campo è diviso in 3
            colonne (Passato, Presente, Futuro). Il tempo non si ferma mai: a
            ogni round le carte slittano inesorabilmente in avanti.
          </li>
          <li>
            <strong>La Collisione:</strong> Lo scontro avviene simultaneamente
            solo nella colonna del Presente. Somma la tua Pressione Energetica
            (PEP) contro la Resistenza del Presente (RP) avversaria. Se la
            superi, le difese nemiche crollano e infliggi danni.
          </li>
          <li>
            <strong>Termodinamica e Inversioni:</strong> Le carte Calde (🔥) e
            Fredde (❄️) alterano la Temperatura globale del tabellone. Se la
            spingi agli estremi critici di +4 o -4, avviene un'Inversione
            Temporale: il flusso si inverte, il Passato diventa Futuro e le
            strategie avversarie vengono stravolte.
          </li>
        </ul>
      </article>

      <article class="glass-panel step-card step-card--wide">
        <h2>STEP 4: LA VOSTRA MISSIONE (DIRETTIVE BETA)</h2>
        <p>
          Una volta sul campo di battaglia, il vostro compito come Costruttori
          reclutati per la Beta è vitale:
        </p>
        <ul class="directive-list">
          <li>Testate i limiti delle meccaniche (Inversioni, Collassi).</li>
          <li>
            Cercate combinazioni "rotte" o bug critici nelle interazioni tra i
            Frammenti.
          </li>
          <li>
            Segnalate ogni anomalia tramite i canali dedicati sul nostro
            Discord.
          </li>
          <li>
            Il vostro feedback determinerà la forma fisica e definitiva di
            Joule.
          </li>
        </ul>
        <p class="closing">
          Ci vediamo al Punto Zero. Il caos è un'arma. Usalo.
        </p>
      </article>
    </section>
  </div>
</template>

<style scoped>
.getting-started-view {
  width: min(1120px, 100%);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.intro-panel h1 {
  margin-bottom: 1rem;
  line-height: 1.2;
}

.intro-panel p {
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 0.7rem;
}

.step-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.step-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.step-card--wide {
  grid-column: 1 / -1;
}

.step-card h2 {
  font-size: clamp(1rem, 2.1vw, 1.18rem);
  line-height: 1.3;
}

.step-card p {
  color: var(--text-muted);
  line-height: 1.7;
}

.step-btn {
  width: fit-content;
  margin: 0.25rem 0;
}

.directive-list {
  margin-left: 1rem;
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  line-height: 1.65;
}

.directive-list li::marker {
  color: var(--accent-gold);
}

.closing {
  margin-top: 0.6rem;
  color: var(--accent-gold);
  font-family: var(--font-display);
  letter-spacing: 0.5px;
}
</style>
<style scoped>
.centered {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  text-align: left;
  padding: clamp(1rem, 3vw, 2rem);
}
/* Same title style as CardsView.vue */
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
