<script setup lang="ts">
import { ref } from "vue";
import { useNotificationStore } from "../stores/notificationStore";
import api from "../utils/api";

const isDownloading = ref(false);
const notifications = useNotificationStore();

const handleDownload = async () => {
  if (isDownloading.value) return;

  isDownloading.value = true;
  notifications.info(
    "Sincronizzazione in corso: Accesso ai file core...",
  );

  try {
    const link = document.createElement("a");
    link.href = "/Regolamento_Joule_Zero_Point.pdf";
    link.setAttribute("download", "Regolamento_Joule_Zero_Point.pdf");
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifications.success(
      "Acquisizione completata: Il manuale è ora disponibile nel tuo dispositivo.",
    );
  } catch (error) {
    console.error("Errore durante il download del regolamento:", error);
    notifications.error(
      "ERRORE: Impossibile recuperare il manuale dalla Matrice.",
    );
  } finally {
    isDownloading.value = false;
  }
};
</script>

<template>
  <div class="rules-view fade-in centered">
    <h1 class="glitch-text" data-text="REGOLAMENTO">REGOLAMENTO</h1>

    <!-- OPERATIONS HEADER -->
    <section class="glass-panel intro-panel">
      <div class="intro-flex">
        <div class="intro-text">
          <h1>&gt;_ DIRETTIVE OPERATIVE: JOULE ZERO POINT v5.0</h1>
          <p class="copyright-notice">
            © 2026 Simone Camerano. Tutti i diritti riservati. Opera depositata
            su Patamu Registry, n. 284864.
          </p>
          <p>
            Questo è il protocollo tecnico integrale per la gestione dei
            conflitti entropici. Ogni manovra, slittamento e collisione deve
            seguire fedelmente queste coordinate fisiche.
          </p>
        </div>
        <div class="intro-actions">
          <button
            @click="handleDownload"
            class="cyber-btn btn-primary"
            :disabled="isDownloading"
          >
            {{
              isDownloading ? "SINCRONIZZAZIONE..." : "SCARICA PDF INTEGRALE"
            }}
          </button>
        </div>
      </div>
    </section>

    <div class="rules-grid">
      <!-- 1. INTRODUCTION AND KEY CONCEPTS -->
      <article class="glass-panel text-content wide-panel">
        <h2 class="section-title">1. INTRODUZIONE E CONCETTI CHIAVE</h2>

        <h3>Filosofia del Gioco</h3>
        <p>
          A seguito dell'evento noto come Punto Zero, le leggi dello
          spazio-tempo si sono infrante. In questo universo senza più regole si
          ergono i Costruttori, entità visionarie il cui scopo è ripristinare
          l'equilibrio. Tuttavia, ogni Costruttore possiede una visione
          radicalmente opposta di come debba essere questo nuovo ordine: c'è chi
          cerca la perfezione del gelo assoluto, chi il caos purificatore del
          calore e chi l'adattabilità dei fluidi.
        </p>
        <p>
          Per imporre la propria visione della realtà, i Costruttori non evocano
          eserciti, ma plasmano e ricompongono i Frammenti dell'universo
          originario (colossali reliquie geologiche, tempeste di energia, masse
          oscure) forzandoli nel Presente. Quando due visioni incompatibili si
          scontrano, la linea temporale più debole collassa. Chi riuscirà a
          imporre i propri Frammenti, detterà le nuove leggi della fisica.
        </p>

        <div class="sub-grid">
          <div class="sub-col">
            <h3>Il Campo (Tre Colonne)</h3>
            <ul class="accent-list">
              <li><strong>Passato:</strong> Memoria e risonanza (supporto).</li>
              <li>
                <strong>Presente:</strong> Conflitto (istante di collisione).
              </li>
              <li><strong>Futuro:</strong> Pianificazione (coperto).</li>
            </ul>
          </div>
          <div class="sub-col">
            <h3>Valori Fondamentali</h3>
            <ul class="accent-list">
              <li><strong>ET:</strong> Energia Temporale (Risorsa).</li>
              <li><strong>PEP:</strong> Pressione Energetica (Attacco).</li>
              <li><strong>RP:</strong> Resistenza del Presente (Difesa).</li>
              <li><strong>IT:</strong> Integrità Temporale (Vita).</li>
              <li><strong>TP:</strong> Temperatura del Presente.</li>
            </ul>
          </div>
        </div>

        <h3>Componenti e Tipi di Carte</h3>
        <p>
          Ogni Costruttore dispone di un Mazzo da 40 carte + 1 Costruttore. Per
          tracciare lo stato della simulazione si utilizzano Segnalini ET, IT,
          TP, Surriscaldamento (🔴), Congelamento (🔵) e un Indicatore di
          Flusso.
        </p>
        <p>
          <strong>Tipi di Carte:</strong> Frammenti (Solido, Liquido, Gas,
          Plasma, Materia Oscura), Eventi, Anomalie (1 sola attiva, la nuova
          sostituisce la precedente) e Costruttori.
        </p>

        <h3>Zona di Attivazione e Deckbuilding</h3>
        <p>
          Salvo diversa indicazione, un Frammento applica il proprio testo solo
          mentre si trova nel <strong>Presente</strong>. Nelle altre colonne
          ignora il proprio testo (salvo effetti specifici per quella zona). Il
          Supporto del Passato è regolato esclusivamente dalla meccanica dei
          Bonus.
        </p>
        <p>
          <strong>Deckbuilding:</strong> Limite copie per nome: Stabile (3),
          Instabile (2), Critica (1). Consigliato: Min. 25 Frammenti, Max 15 tra
          Eventi/Anomalie.
        </p>
      </article>

      <!-- 2. SETUP AND VICTORY -->
      <article class="glass-panel text-content">
        <h2 class="section-title">2. PREPARAZIONE DELLA PARTITA</h2>
        <h3>Procedura di Setup</h3>
        <ol class="ordered-steps">
          <li>
            Valori iniziali: <strong>IT 20, TP 0, ET 3</strong>. Flusso
            iniziale: Normale.
          </li>
          <li>
            Pesca 5 carte. <strong>Mulligan:</strong> Una sola volta, rimescola
            e pesca 4 carte.
          </li>
          <li>
            <strong>Iniziativa:</strong> Si determina casualmente per il Round
            1. Nelle partite successive, decide chi ha perso l'ultima partita.
          </li>
        </ol>

        <h3>Condizioni di Vittoria</h3>
        <ul class="accent-list">
          <li>
            <strong>Vittoria per Collasso:</strong> L'IT avversaria scende a 0 o
            meno.
          </li>
          <li>
            <strong>Vittoria per Sincronia:</strong> Controlla almeno 1
            Frammento in ogni colonna e tutti e 5 gli stati della materia PRIMA
            dello slittamento. (La Materia Oscura può fungere da Jolly per un
            unico stato mancante). Valgono solo gli stati stampati originali.
          </li>
        </ul>
      </article>

      <!-- 3. ROUND STRUCTURE -->
      <article class="glass-panel text-content wide-panel">
        <h2 class="section-title">3. STRUTTURA DEL ROUND (IL CORE LOOP)</h2>
        <p class="loop-sequence">
          Slittamento → Risorse → Azioni → Collisione → Fine
        </p>

        <h3>Fase 1: Slittamento Temporale (Escluso Round 1)</h3>
        <p>Il tempo si muove secondo il Flusso:</p>
        <ul>
          <li>
            <strong>Flusso Normale:</strong> Futuro → Presente → Passato →
            Orizzonte (Scarto).
          </li>
          <li>
            <strong>Flusso Invertito:</strong> Passato → Presente → Futuro →
            Orizzonte.
          </li>
        </ul>
        <div class="note-box">
          <strong>Supporto del Passato:</strong> Dopo lo slittamento, ogni
          Frammento Caldo nel Passato dà +1 PEP; ogni Freddo +1 RP. Materia
          Oscura dà +1 a scelta. (Max 2 bonus totali).
        </div>

        <h3>Fase 2: Risorse</h3>
        <p>
          Entrambi ottengono +1 ET (fino a 10) e pescano 1 carta.
          <strong>Controllo Presente:</strong> Chi ha più Frammenti nel Presente
          sceglie se pescare una extra o infliggere 1 danno IT.
          <strong>Scambio:</strong> Una volta per round, scarta 1 carta per +1
          ET.
        </p>

        <h3>Fase 3 & 4: Azioni</h3>
        <p>
          Frammenti e Anomalie si giocano nel proprio turno. Eventi in qualsiasi
          momento. Costi: Presente (Pieno), Laterali (-1 ET).
        </p>

        <div class="paradox-box">
          <strong>PARADOSSO ENTROPICO:</strong> Una volta per round, giocando
          nell'ultima colonna prima dello scarto, puoi pagare il costo in
          <strong>IT</strong> invece di ET. La carta entra ruotata di 90°, al
          prossimo slittamento viaggerà controcorrente entrando nel Presente con
          PEP e RP scambiati, per poi distruggersi.
        </div>

        <h3>Fase 5: Collisione</h3>
        <p>
          I Frammenti nel Presente si scontrano (PEP Totale vs RP Totale). Se
          PEP > RP, lo scudo cede: i Frammenti nemici nel Presente sono
          distrutti e la differenza infligge danni IT.
        </p>
        <p>
          <strong>Proprietà degli Stati:</strong> 🧱 Solido (Assorbimento: -1
          danno IT), 💧 Liquido (Persistenza: torna nel Passato), 🌫️ Gas
          (Pressione: 1 danno IT se nessuno ha ferito l'IT avversaria), ⚡
          Plasma (Scarica: +1 danno extra).
        </p>
      </article>

      <!-- 4. TEMPERATURE -->
      <article class="glass-panel text-content">
        <h2 class="section-title">4. IL SISTEMA DELLA TEMPERATURA (TP)</h2>
        <p>
          La TP oscilla tra -4 e +4 a causa dei Frammenti Caldi (+1) e Freddi
          (-1) nel Presente. Viene ricalcolata a ogni Slittamento o ingresso di
          materia.
        </p>
        <h3>Transizione di Stato (Segnalini)</h3>
        <p>
          A TP ±2, i Frammenti acquistano segnalini termici (🔴/🔵):
          acquisiscono le proprietà dello stato superiore o inferiore senza
          mutare i valori base.
        </p>
        <p class="rule-gold">
          <strong>Regola d'Oro:</strong> La TP "cambia segno" anche quando tocca
          o attraversa esattamente lo 0 termico.
        </p>
      </article>

      <!-- 5. INVERSIONS -->
      <article class="glass-panel text-content">
        <h2 class="section-title">5. MECCANICHE AVANZATE: LE INVERSIONI</h2>
        <p>
          Se la TP raggiunge ±4 avviene un'Inversione spontanea gratuita. È
          possibile causarla con le carte subendo 1 danno IT.
        </p>
        <h3>Effetti dell'Inversione</h3>
        <ol>
          <li>Inverti il Flusso (Normale ↔ Invertito).</li>
          <li>
            Scambio Ruoli: Le colonne laterali scambiano funzione (Passato ↔
            Futuro). Le carte restano fisicamente dove sono, ma cambiano stato
            (scoperte/coperte).
          </li>
          <li>Ricalcolo Supporto immediato.</li>
        </ol>
        <div class="tactical-note">
          <strong>Nota Tattica:</strong> Se giochi nel nuovo Futuro sotto
          inversione, la carta slitterà direttamente nell'Orizzonte al prossimo
          round senza combattere!
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.centered {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  text-align: left;
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

.intro-panel {
  margin-bottom: 2rem;
}

.intro-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.intro-text {
  flex: 1;
  min-width: 300px;
}

.intro-panel h1 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--accent-gold);
}

.intro-panel p {
  color: var(--text-muted);
  line-height: 1.7;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.text-content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.text-content h2 {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--accent-magenta);
  border-bottom: 1px solid rgba(var(--accent-magenta-rgb), 0.3);
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
}

.text-content h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--accent-gold);
  margin-top: 1rem;
}

.text-content p {
  color: var(--text-main);
  line-height: 1.6;
}

.text-content ul,
.text-content ol {
  padding-left: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  color: var(--text-muted);
}

.text-content li strong {
  color: var(--text-main);
}

.wide-panel {
  grid-column: 1 / -1;
}

.section-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  color: var(--accent-gold);
  border-bottom: 2px solid rgba(var(--accent-gold-rgb), 0.3);
  padding-bottom: 0.8rem;
  margin-bottom: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.text-content h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--accent-magenta);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.text-content h3::before {
  content: ">";
  color: var(--accent-gold);
  font-weight: bold;
}

.sub-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin: 1.5rem 0;
}

.loop-sequence {
  background: rgba(255, 0, 60, 0.1);
  border: 1px solid rgba(255, 0, 60, 0.3);
  padding: 0.8rem;
  text-align: center;
  font-family: var(--font-display);
  font-weight: bold;
  color: var(--accent-magenta);
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.note-box,
.paradox-box,
.tactical-note {
  padding: 1.2rem;
  border-radius: 4px;
  margin: 1rem 0;
  font-size: 0.95rem;
  line-height: 1.6;
}

.note-box {
  background: rgba(212, 175, 55, 0.08);
  border-left: 3px solid var(--accent-gold);
}

.paradox-box {
  background: rgba(150, 0, 255, 0.08);
  border-left: 3px solid #a855f7;
  color: #d8b4fe;
}

.tactical-note {
  background: rgba(0, 255, 255, 0.08);
  border-left: 3px solid #06b6d4;
  color: #67e8f9;
}

.rule-gold {
  color: var(--accent-gold);
  font-style: italic;
  font-weight: 600;
  margin-top: 1rem;
}

.copyright-notice {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 0.5rem !important;
}

.cyber-divider {
  border: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--accent-gold-rgb), 0.3),
    transparent
  );
  margin: 1.5rem 0;
}

@media (max-width: 768px) {
  .sub-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.accent-list .highlight {
  color: var(--accent-gold);
  font-weight: bold;
}

.ordered-steps {
  counter-reset: custom-counter;
  list-style: none;
  padding-left: 0 !important;
}

.ordered-steps li {
  position: relative;
  padding-left: 2rem;
  margin-bottom: 1rem !important;
}

.ordered-steps li::before {
  counter-increment: custom-counter;
  content: "0" counter(custom-counter);
  position: absolute;
  left: 0;
  top: 2px;
  font-family: var(--font-display);
  color: var(--accent-magenta);
  font-size: 0.85rem;
  font-weight: bold;
}
</style>
