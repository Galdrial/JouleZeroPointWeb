<script setup lang="ts">
import { ref } from "vue";
import { useHead } from "@unhead/vue";
import { useNotificationStore } from "../stores/notificationStore";

// SEO Optimization: Rules & Strategy Metadata
useHead({
  title: "Regolamento e Strategia - Joule: Zero Point",
  meta: [
    {
      name: "description",
      content: "Consulta il regolamento ufficiale di Joule: Zero Point. Impara le meccaniche di slittamento temporale, gestione dell'entropia e strategie avanzate per dominare il Punto Zero.",
    },
    {
      property: "og:title",
      content: "Joule: Zero Point - Regolamento v5.0",
    },
    {
      property: "og:description",
      content: "Tutte le direttive operative e le meccaniche di gioco per diventare un Costruttore esperto nel Punto Zero.",
    },
  ],
});

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
          <h2>&gt;_ DIRETTIVE OPERATIVE: JOULE ZERO POINT v5.0</h2>
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
            class="cyber-btn btn-primary"
            :disabled="isDownloading"
            @click="handleDownload"
          >
            {{
              isDownloading ? "SINCRONIZZAZIONE..." : "SCARICA PDF INTEGRALE"
            }}
          </button>
        </div>
      </div>
    </section>

    <div class="rules-grid">
      <article class="glass-panel text-content wide-panel">
        <p>JOULE: ZERO POINT © 2026 Simone Camerano. Tutti i diritti riservati. Opera depositata su Patamu Registry, numero deposito 284864. La riproduzione non autorizzata di testi, meccaniche e grafica sarà perseguita a termini di legge.</p>
        <p>JOULE: ZERO POINT – Regolamento Ufficiale (Riorganizzato)</p>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">1. Introduzione e Concetti Chiave</h3>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">Filosofia del Gioco:</h3>
        <p>A seguito dell'evento noto come Punto Zero, le leggi dello spazio-tempo si sono infrante. In questo universo senza più regole si ergono i Costruttori, entità visionarie il cui scopo è ripristinare l'equilibrio. Tuttavia, ogni Costruttore possiede una visione radicalmente opposta di come debba essere questo nuovo ordine: c'è chi cerca la perfezione del gelo assoluto, chi il caos purificatore del calore e chi l'adattabilità dei fluidi. Per imporre la propria visione della realtà, i Costruttori non evocano eserciti, ma plasmano e ricompongono i Frammenti dell'universo originario (colossali reliquie geologiche, tempeste di energia, masse oscure) forzandoli nel Presente. Quando due visioni incompatibili si scontrano, la linea temporale più debole collassa. Chi riuscirà a imporre i propri Frammenti, detterà le nuove leggi dell'Universo.</p>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">Il campo è diviso in tre colonne condivise:</h3>
        <ul><li>Passato – memoria e risonanza (supporto)</li></ul>
        <ul><li>Presente – conflitto (istante di collisione)</li></ul>
        <ul><li>Futuro – pianificazione (coperto).</li></ul>
        <p>Componenti</p>
        <ul><li>Mazzo da 40 carte + 1 Costruttore.</li></ul>
        <ul><li>Segnalini: ET (Energia Temporale), IT (Integrità Temporale/Vita), TP (Temperatura del Presente), Surriscaldamento (🔴), Congelamento (🔵).</li></ul>
        <ul><li>Indicatore Flusso (Normale/Invertito).</li></ul>
        <p>Valori Fondamentali</p>
        <ul><li>ET: Risorsa per giocare carte.</li></ul>
        <ul><li>PEP: Pressione Energetica (attacco).</li></ul>
        <ul><li>RP: Resistenza del Presente (difesa).</li></ul>
        <ul><li>IT: Punti vita.</li></ul>
        <ul><li>TP: Stato termico globale del Presente.</li></ul>
        <p>Tipi di Carte Frammenti (Solido, Liquido, Gas, Plasma, Materia Oscura), Eventi, Anomalie (1 attiva alla volta, qualsiasi giocatore ne giochi un’altra quest’ultima sostituisce la precedente), Costruttori.</p>
        <p>Zona di Attivazione dei Frammenti</p>
        <p>Salvo diversa indicazione, un Frammento applica il proprio testo solo mentre si trova nel Presente. Se un Frammento si trova nel Passato o nel Futuro, ignora completamente il proprio testo, ad eccezione di eventuali effetti che menzionano esplicitamente quella colonna. Il Supporto del Passato è regolato esclusivamente dalla sezione “Supporto del Passato (Bonus)” e non dagli effetti stampati sulle carte.</p>
        <p>Deckbuilding</p>
        <ul><li>Max copie: Stabile (3), Instabile (2), Critica (1).</li></ul>
        <ul><li>Consigliato: Minimo 25 Frammenti, Max 15 tra Eventi e Anomalie.</li></ul>
      </article>
      <article class="glass-panel text-content wide-panel">
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">2. Preparazione della Partita (Setup)</h3>
        <p>Procedura</p>
        <p>1. Ogni giocatore sceglie un mazzo da 40 carte e 1 Costruttore.</p>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">2. Valori iniziali: IT 20, TP 0, ET 3.</h3>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">3. Flusso iniziale: Normale.</h3>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">4. Ogni giocatore pesca 5 carte.</h3>
        <p>5. Determinare l'Iniziativa: I giocatori tirano un dado (o usano un altro metodo casuale) per stabilire chi ha l'Iniziativa nel Round 1 della prima partita. Chi vince può scegliere se avere l’iniziativa o assegnarla all’avversario. Nelle partite successive contro lo stesso avversario (es. in un formato &quot;al meglio delle 3&quot;), il giocatore che ha perso la partita precedente decide chi avrà l'Iniziativa nel Round 1.</p>
        <p>Mulligan Una sola volta: rimescola e pesca 1 carta in meno (4 carte).</p>
        <p>Condizioni di Vittoria Prima di iniziare, è fondamentale sapere come si vince:</p>
        <p>1. Vittoria per Collasso: L’IT dell’avversario scende a 0 o meno. (Se accade a entrambi contemporaneamente: Pareggio per Collasso Sincrono).</p>
        <p>2. Vittoria per Sincronia: Un giocatore controlla almeno 1 Frammento in ogni colonna (Passato, Presente, Futuro) e tutti e 5 gli stati della materia (Se possiedi più di una Materia Oscura, UNA SOLA di esse può fungere da Jolly per sostituire un unico stato della materia mancante) prima dello slittamento. Anche in questo caso è possibile il pareggio se entrambi ottengono la Sincronia contemporaneamente. Ai fini del conteggio per la Vittoria per Sincronia, è considerata valida esclusivamente la natura originale (lo stato stampato) del Frammento. Gli eventuali stati aggiuntivi acquisiti tramite i Segnalini Termici (Transizione di Stato) vengono ignorati per questo calcolo.</p>
      </article>
      <article class="glass-panel text-content wide-panel">
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">3. Struttura del Round (Il Core Loop)</h3>
        <p>Ogni Round segue questa sequenza: Slittamento -&gt; Risorse -&gt; Azioni -&gt; Collisione -&gt; Fine.</p>
        <p>Fase 1: Slittamento Temporale</p>
        <p>All’inizio di ogni Round (escluso il primo), il tempo slitta secondo la Direzione del Flusso.</p>
        <ul><li>Flusso Normale: Futuro → Presente → Passato → Orizzonte degli Eventi (scarto).</li></ul>
        <ul><li>Flusso Invertito: Passato → Presente → Futuro (coperto) → Orizzonte degli Eventi.</li></ul>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">Dettagli Slittamento:</h3>
        <ul><li>Le carte entrano nel Presente simultaneamente e attivano effetti &quot;Quando entra nel Presente&quot;.</li></ul>
        <ul><li>I segnalini Termici (🔴/🔵) vengono rimossi.</li></ul>
        <ul><li>Dopo lo slittamento, si ricalcola la TP.</li></ul>
        <p>Se più effetti si attivano simultaneamente, il giocatore con Iniziativa sceglie l’ordine di risoluzione dei propri effetti, poi l’avversario.</p>
        <p>Supporto del Passato (Bonus) Immediatamente dopo lo Slittamento, la colonna &quot;Passato&quot; fornisce bonus alla futura collisione:</p>
        <ul><li>Ogni Frammento Caldo nel Passato: +1 PEP.</li></ul>
        <ul><li>Ogni Frammento Freddo nel Passato: +1 RP.</li></ul>
        <ul><li>Materia Oscura: +1 PEP o +1 RP a scelta.</li></ul>
        <ul><li>Limite: Max 2 bonus totali per Round per giocatore.</li></ul>
        <p>Se un Frammento che ha contribuito al Supporto del Passato lascia quella colonna durante il Round, il bonus assegnato non viene riassegnato a meno che non avvenga una Inversione Temporale.</p>
        <p>Fase 2: Risorse</p>
        <p>1. Crescita ET: Entrambi i giocatori ottengono ET. Si inizia con 3 ET; ogni round aumenta di +1 fino a un massimo di 10 (salvo eventuali Bonus).</p>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">2. Pesca: Entrambi pescano 1 carta.</h3>
        <p>Bonus Controllo: Chi controlla il Presente (più Frammenti) può scegliere se pescare 1 carta extra oppure infliggere 1 danno IT diretto all'avversario.</p>
        <p>Collasso Entropico: Se un giocatore deve pescare una carta (durante questa fase o per via di un qualsiasi altro effetto) ma il suo mazzo è vuoto, la sua linea temporale viene consumata dall'entropia e quel giocatore perde inesorabilmente la partita</p>
        <p>3. Scambio: Una volta per round puoi scartare 1 carta per ottenere +1 ET.</p>
        <p>Fase 3 &amp; 4: Azioni (Giocatori)</p>
        <p>Il giocatore con Iniziativa agisce per primo, poi l'altro.</p>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">Tempismo di Giocata:</h3>
        <p>Frammenti e Anomalie: Possono essere giocati solo durante il proprio turno di Azione (quando si ha l'Iniziativa o quando l'avversario ha passato).</p>
        <p>Eventi: Sono azioni rapide. Possono essere giocati in qualsiasi momento (durante il turno di Azione di qualsiasi giocatore o durante la Fase 5: Collisione), a meno che il testo della carta non specifichi una condizione precisa (es. &quot;Gioca durante una Collisione&quot;).</p>
        <ul><li>Presente: Costo normale.</li></ul>
        <ul><li>Futuro: Costo -1 ET (entra coperta).</li></ul>
        <ul><li>Passato: Costo -1 ET (entra scoperta).</li></ul>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">• Capienza: Max 4 Frammenti per colonna per giocatore:</h3>
        <p>Divieto di Giocata (Attiva): Non puoi giocare dalla mano o spostare volontariamente un Frammento in una colonna che contiene già 4 carte.</p>
        <p>Distruzione per Slittamento (Passiva): Se durante la Fase di Slittamento Temporale un quinto Frammento viene spinto in una colonna già piena, il giocatore deve scegliere e distruggere immediatamente uno dei suoi Frammenti in quella colonna, mandandolo nell'Orizzonte degli Eventi.</p>
        <p>PARADOSSO ENTROPICO (Azione Volontaria Mirata) Quando giochi un Frammento nell'ultima colonna prima dell'Orizzonte degli Eventi (il Passato durante il Flusso Normale, oppure il Futuro durante il Flusso Invertito), puoi innescare un &quot;Paradosso Entropico&quot; (Limite: Max 1 volta per Round per giocatore). Questa azione non causa un'Inversione Temporale globale, ma ti permette di forzare il Frammento controcorrente attraverso un sacrificio vitale.</p>
        <p>Il Costo del Paradosso: Invece di spendere Energia Temporale (ET), devi subire un ammontare di danni diretti alla tua Integrità Temporale (IT) pari al costo della carta (applicando lo sconto standard delle colonne laterali). Il costo minimo da pagare in IT è sempre 1.</p>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">Se paghi il costo:</h3>
        <p>Stato Anomalo: Il Frammento entra nella colonna ruotato di 90 gradi. Rispetta le normali regole di visibilità: scoperto nel Passato, coperto nel Futuro.</p>
        <p>Viaggio a Ritroso: Al successivo Slittamento Temporale, il Frammento viaggerà controcorrente ed entrerà nel Presente innescando normalmente eventuali effetti. (Mantieni la carta ruotata).</p>
        <p>Overclock Entropico: Entrando nel Presente con un'entropia capovolta, il suo valore base di Pressione Energetica (PEP) e di Resistenza del Presente (RP) vengono scambiati tra loro per la durata della Collisione. Il Polo Termico originale e il suo effetto sulla TP rimangono inalterati.</p>
        <p>Distruzione: Alla fine della Collisione, incapace di reggere l'anomalia fisica, il Frammento viene distrutto.</p>
        <p>Fase 5: Collisione</p>
        <p>Tutti i Frammenti nel Presente si scontrano.</p>
        <p>Impatto e Rottura: Somma la PEP Totale vs la RP Totale avversaria.</p>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">2. Destino del Presente (Collasso o Sopravvivenza):</h3>
        <p>Collasso: Se la tua PEP totale supera la RP avversaria (PEP &gt; RP), lo scudo cede. Il Presente avversario collassa: tutti i suoi Frammenti nel Presente sono condannati e verranno distrutti alla fine del calcolo dei danni.</p>
        <p>Sopravvivenza: Se la PEP è pari o inferiore alla RP avversaria, lo scudo regge. Nessun Frammento collassa e restano tutti sul campo per il prossimo slittamento.</p>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">3. Calcolo Danni IT e Assorbimento:</h3>
        <p>Se lo scudo ha ceduto, calcola la differenza tra PEP e RP. Questo è il danno base inflitto all'Integrità Temporale (IT) avversaria. A questo punto si attivano gli eventuali stati Solido (Assorbimento) per ridurre i danni all'IT. (Nota tattica: Grazie all'Assorbimento è possibile ridurre i danni IT fino a 0, proteggendo così i propri punti vita, ma questo non salva i Frammenti: se lo scudo iniziale è stato infranto al punto 2, i Frammenti collasseranno comunque nell'Orizzonte degli Eventi alla fine di questa fase).</p>
        <p>Proprietà degli Stati (Attive solo in Collisione) Durante la collisione, gli stati attivano poteri speciali (Max 2 volte per tipo):</p>
        <ul><li>🧱 Solido (Assorbimento): Riduci di 1 il danno IT subito.</li></ul>
        <ul><li>💧 Liquido (Persistenza): Se distrutto, puoi spostarlo nel Passato invece che scartarlo (una sola volta per Frammento)</li></ul>
        <ul><li>🌫️ Gas (Pressione): Se al termine del calcolo dei danni nessun giocatore ha inflitto danni IT, infliggi 1 danno IT all’avversario.</li></ul>
        <ul><li>⚡ Plasma (Scarica): Se infliggi danno IT, infliggi +1 danno extra.</li></ul>
        <p>Fase 6 &amp; 7: Fine Round</p>
        <p>Verifica condizioni vittoria. L'Iniziativa passa all'altro giocatore.</p>
      </article>
      <article class="glass-panel text-content wide-panel">
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">4. Il Sistema della Temperatura (TP)</h3>
        <p>La Temperatura del Presente (TP) altera il campo di battaglia.</p>
        <p>Variazione della TP</p>
        <ul><li>Ogni Frammento Caldo nel Presente: +1 TP.</li></ul>
        <ul><li>Ogni Frammento Freddo nel Presente: -1 TP.</li></ul>
        <p>La TP non può mai superare il valore di +4 (Surriscaldamento Critico) né scendere sotto il valore di -4 (Congelamento Assoluto). Qualsiasi variazione termica in eccesso viene ignorata.</p>
        <p>La TP viene ricalcolata ogni volta che un Frammento entra o lascia il Presente, e immediatamente dopo ogni Inversione Temporale.</p>
        <p>Segnalini Termici Vengono assegnati in base alla TP (ricalcolata dopo slittamento o durante il round):</p>
        <ul><li>TP ≥ +2: Assegna 🔴 (Surriscaldamento) a tutti i Frammenti nel Presente.</li></ul>
        <ul><li>TP ≤ -2: Assegna 🔵 (Congelamento) a tutti i Frammenti nel Presente.</li></ul>
        <ul><li>Se TP torna tra -1 e +1, i segnalini vengono rimossi.</li></ul>
        <p>Effetti dei Segnalini (Transizione di Stato) Ordine: Solido ↔ Liquido ↔ Gas ↔ Plasma.</p>
        <ul><li>🔴: Il Frammento acquisisce anche le proprietà dello stato superiore (es. Gas diventa Gas+Plasma).</li></ul>
        <ul><li>🔵: Il Frammento acquisisce anche le proprietà dello stato inferiore.</li></ul>
        <ul><li>Nota: Non modifica i valori di PEP/RP stampati.</li></ul>
        <ul><li>Nota Termodinamica: La Materia Oscura è un'anomalia estranea alla fisica classica. È totalmente immune ai cambiamenti di Temperatura, non riceve mai i segnalini 🔴 o 🔵 e non subisce Transizioni di Stato.</li></ul>
        <p>Regola d'Oro Termodinamica: Il Cambio di Segno &quot;A causa dell'estrema instabilità del Punto Zero, ai fini della risoluzione degli effetti delle carte, si considera che la TP 'cambi segno' non solo quando passa direttamente da un valore positivo a uno negativo (o viceversa), ma anche ogni volta che il suo valore raggiunge o attraversa esattamente lo 0 partendo da un valore positivo (Caldo) o negativo (Freddo).&quot;</p>
      </article>
      <article class="glass-panel text-content wide-panel">
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">5. Meccaniche Avanzate: Le Inversioni</h3>
        <p>Le Inversioni alterano il flusso del tempo e la struttura del campo.</p>
        <p>Inversione Temporale: Cosa succede?</p>
        <h3 style="color: var(--accent-gold); margin-top: 1rem;">1. Inverti il Flusso (Normale ↔ Invertito).</h3>
        <p>2. Scambio Ruoli: Le colonne laterali si scambiano ruolo (Passato diventa Futuro e viceversa).</p>
        <p>◦ Le carte NON si spostano fisicamente.</p>
        <p>◦ Le carte nel nuovo Futuro vengono coperte.</p>
        <p>◦ Le carte nel nuovo Passato vengono rivelate.</p>
        <p>3. Ricalcolo Supporto: Il Supporto del Passato viene ricalcolato immediatamente in base alla nuova colonna Passato.</p>
        <p>4. Nota: L'inversione non è un movimento e non attiva effetti &quot;Entrata nel Presente&quot;.</p>
        <p>Trigger dell'Inversione Esistono due modi per causare un'Inversione:</p>
        <p>1. Spontanea (TP): Se TP raggiunge +4 o -4, avviene un'Inversione Temporale gratuita (Max 1 per round).</p>
        <p>2. Volontaria (Carte): Se una carta causa un'Inversione Temporale, il giocatore che la gioca subisce immediatamente 1 danno alla propria Integrità Temporale (IT).</p>
        <p>Ruolo delle Colonne</p>
        <ul><li>Flusso Normale: Sinistra = Passato (Scoperto) | Destra = Futuro (Coperto).</li></ul>
        <ul><li>Flusso Invertito: Sinistra = Futuro (Coperto) | Destra = Passato (Scoperto).</li></ul>
        <ul><li>La colonna centrale è sempre il Presente.</li></ul>
        <p>Note Tattiche sulle Inversioni</p>
        <p>1. La direzione fisica delle carte non cambia mai &quot;Nota bene: sebbene le colonne si scambino di ruolo (Sinistra diventa Futuro, Destra diventa Passato), il movimento fisico delle carte sul tavolo viaggia sempre e solo da Destra verso Sinistra. Durante il Flusso Normale le carte scivolano dal Futuro(Destra) al Passato(Sinistra). Durante il Flusso Invertito scivolano dal Passato(Destra) al Futuro(Sinistra). Il nastro trasportatore non cambia mai verso, cambiano solo i nomi delle zone d'arrivo e di partenza.&quot;</p>
        <p>2. Giocare carte durante l'Inversione (La Trappola del Futuro) &quot;Quando il flusso è invertito, fare investimenti cambia radicalmente:</p>
        <p>Se giochi a Sinistra (nuovo Futuro): Le carte entrano coperte. Attenzione: poiché il Futuro è l'ultima tappa del Flusso Invertito, al prossimo slittamento queste carte scivoleranno direttamente nell'Orizzonte degli Eventi (scartate) senza mai entrare nel Presente.</p>
        <p>Se giochi a Destra (nuovo Passato): Le carte entrano scoperte. Poiché entrano nella Fase Azioni, non forniranno Supporto per la Collisione in corso (il Supporto si calcola subito dopo lo Slittamento), ma al turno successivo slitteranno regolarmente nel Presente.&quot;</p>
        <p>3. La semantica delle carte (L'esatta lettura del testo) &quot;Le abilità delle carte leggono solo il ruolo attuale della colonna, senza memoria del passato.</p>
        <p>Esempio 1 (Nodo Inamovibile): Il suo testo recita 'Non slitta nel Passato'. Durante un'Inversione, il flusso la spinge a sinistra. Poiché la sinistra è diventata il nuovo Futuro, la carta non ha difese e slitta regolarmente.</p>
        <p>Esempio 2 (Nyx): La sua abilità recita 'Il primo Frammento che giochi nel Futuro...'. Durante un'Inversione, Nyx considererà come Futuro la colonna di sinistra, permettendo di giocarvi carte coperte e farle saltare nel Presente.&quot;</p>
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
