<script setup lang="ts">
// Struttura statica per il Regolamento
</script>

<template>
  <div class="rules-view fade-in centered">
    <h1 class="glitch-text" data-text="REGOLAMENTO">REGOLAMENTO</h1>

    <!-- INDICE & HEADER -->
    <section class="glass-panel intro-panel">
      <h1>&gt;_ DIRETTIVE OPERATIVE: JOULE ZERO POINT</h1>
      <p>
        Questo è il manuale tecnico di base per i Costruttori appena connessi alla simulazione. 
        Gli scontri temporali si basano su due risorse principali: la <strong>Energia Temporale (ET)</strong>, usata per richiamare i Frammenti, e la <strong>Integrità Temporale (IT)</strong>, che rappresenta i "punti vita" del Costruttore.
      </p>
    </section>    <div class="rules-grid">

      <!-- 1. INTRODUZIONE E CONCETTI CHIAVE -->
      <article class="glass-panel text-content wide-panel">
        <h2>1. INTRODUZIONE E CONCETTI CHIAVE</h2>
        
        <h3>Filosofia del Gioco</h3>
        <p>A seguito dell'evento noto come Punto Zero, le leggi dello spazio-tempo si sono infrante. In questo universo senza più regole si ergono i Costruttori, entità visionarie il cui scopo è ripristinare l'equilibrio. Tuttavia, ogni Costruttore possiede una visione radicalmente opposta di come debba essere questo nuovo ordine: c'è chi cerca la perfezione del gelo assoluto, chi il caos purificatore del calore e chi l'adattabilità dei fluidi. Per imporre la propria visione della realtà, i Costruttori non evocano eserciti, ma plasmano e ricompongono i Frammenti dell'universo originario (colossali reliquie geologiche, tempeste di energia, masse oscure) forzandoli nel Presente. Quando due visioni incompatibili si scontrano, la linea temporale più debole collassa. Chi riuscirà a imporre i propri Frammenti, detterà le nuove leggi della fisica.</p>
        
        <h3>Il Campo e i Valori Fondamentali</h3>
        <p>Il campo è diviso in tre colonne condivise:</p>
        <ul class="accent-list" style="margin-bottom: 1rem;">
          <li><strong>Passato</strong> – memoria e risonanza (supporto)</li>
          <li><strong>Presente</strong> – conflitto (istante di collisione)</li>
          <li><strong>Futuro</strong> – pianificazione (coperto)</li>
        </ul>

        <p><strong>Valori Fondamentali:</strong></p>
        <ul>
          <li><strong>ET:</strong> Energia Temporale (Risorsa per giocare carte).</li>
          <li><strong>PEP:</strong> Pressione Energetica (attacco).</li>
          <li><strong>RP:</strong> Resistenza del Presente (difesa).</li>
          <li><strong>IT:</strong> Integrità Temporale (Punti vita).</li>
          <li><strong>TP:</strong> Temperatura del Presente (Stato termico globale).</li>
        </ul>

        <h3>Zona di Attivazione e Deckbuilding</h3>
        <p>Salvo diversa indicazione, un Frammento applica il proprio testo solo mentre si trova nel Presente. Se un Frammento si trova nel Passato o nel Futuro, ignora completamente il proprio testo, ad eccezione di eventuali effetti che menzionano esplicitamente quella colonna. Il Supporto del Passato è regolato esclusivamente dalla specifica meccanica (Bonus) e non dagli effetti stampati sulle carte.</p>
        <p><strong>Deckbuilding:</strong> Max copie: Stabile (3), Instabile (2), Critica (1). Consigliato: Minimo 25 Frammenti, Max 15 tra Eventi e Anomalie.</p>
      </article>

      <!-- 2. SETUP E VITTORIA -->
      <article class="glass-panel text-content">
        <h2>2. PREPARAZIONE E VITTORIA</h2>
        
        <p><strong>Procedura Autogestita:</strong></p>
        <ol class="ordered-steps">
          <li>Ogni giocatore sceglie un mazzo da 40 carte e 1 Costruttore.</li>
          <li>Valori iniziali: <strong>IT 20, TP 0, ET 3</strong>. Flusso iniziale: Normale.</li>
          <li>Ogni giocatore pesca 5 carte. <strong>Mulligan:</strong> Una sola volta, puoi rimescolare e pescare 1 carta in meno (4 carte).</li>
          <li><strong>Determinare l'Iniziativa:</strong> Metodo casuale (dado). Chi vince sceglie chi ha l'Iniziativa. Nelle partite successive, decide chi ha perso la partita precedente.</li>
        </ol>

        <hr class="cyber-divider" />

        <h3>Condizioni di Vittoria</h3>
        <ul class="accent-list">
          <li>
            <span class="highlight">1. Vittoria per Collasso:</span> L’IT dell’avversario scende a 0 o meno. (Se accade a entrambi contemporaneamente: Pareggio per Collasso Sincrono).
          </li>
          <li>
            <span class="highlight">2. Vittoria per Sincronia:</span> Controlla almeno 1 Frammento in ogni colonna e possiedi tutti e 5 gli stati della materia PRIMA dello slittamento temporale. <em>(Una sola Materia Oscura può fungere da Jolly)</em>. Essendo ai fini di questo calcolo considerata solo la natura originale stampata.
          </li>
        </ul>
      </article>

      <!-- 3. STRUTTURA DEL ROUND LOOP -->
      <article class="glass-panel text-content wide-panel">
        <h2>3. IL CORE LOOP (STRUTTURA DEL ROUND)</h2>
        <p>Ogni Round segue questa sequenza: <strong>Slittamento -&gt; Risorse -&gt; Azioni -&gt; Collisione -&gt; Fine</strong>.</p>
        
        <h3>Fase 1: Slittamento Temporale (Escluso Round 1)</h3>
        <p>Il tempo slitta secondo la Direzione del Flusso. Le carte entrano nel Presente simultaneamente attivando gli effetti in entrata, i Segnalini Termici vengono dissipati e si ricalcola la TP. <em>Se effetti simultanei: primo il giocatore con l'Iniziativa.</em></p>
        <ul>
          <li><strong>Flusso Normale:</strong> Futuro → Presente → Passato → Orizzonte (scarto).</li>
          <li><strong>Flusso Invertito:</strong> Passato → Presente → Futuro (coperto) → Orizzonte.</li>
        </ul>

        <p><strong>Supporto del Passato (Bonus):</strong> Calcolato Immediatamente dopo lo Slittamento.<br/>
        Ogni Frammento Caldo nel Passato: +1 PEP. Ogni Freddo: +1 RP. Materia Oscura: +1 a scelta (Max 2 bonus totali a giocatore). Restano validi per l'intero round a meno che non ci sia Inversione Temporale.</p>

        <hr class="cyber-divider" />

        <h3>Fase 2: Risorse</h3>
        <ol class="ordered-steps">
          <li><strong>Crescita ET:</strong> Aumenta di +1 fino a max 10.</li>
          <li><strong>Pesca:</strong> Entrambi pescano 1 carta. <em>Collasso Entropico: se devi pescare dal mazzo vuoto, perdi all'istante!</em></li>
          <li><strong>Bonus Controllo:</strong> Chi ha più Frammenti nel <em>Presente</em> sceglie: pescare 1 extra oppure infliggere 1 danno all'IT nemica.</li>
          <li><strong>Scambio:</strong> Puoi scartare 1 carta dalla mano per ottenere +1 ET.</li>
        </ol>

        <hr class="cyber-divider" />

        <h3>Fase 3 & 4: Azioni</h3>
        <p>I giocatori si alternano. Frammenti & Anomalie si giocano solo nel proprio turno. Eventi sono azioni rapide (qualsiasi momento).</p>
        <p>
          <strong>Costi di Giocata:</strong> Presente (Costo Normale). Futuro (Costo -1 ET, entra coperta). Passato (Costo -1 ET, entra scoperta).<br/>
          <strong>Capienza:</strong> Massimo 4 Frammenti per colonna per giocatore. Divieto di gioco su colonne piene. Distruzione passiva forzata se lo Slittamento spinge la quinta carta.
        </p>

        <div style="background: rgba(100,0,100,0.2); padding: 1rem; border-left: 2px solid var(--accent-magenta); margin-top: 1rem;">
          <strong>IL PARADOSSO ENTROPICO:</strong><br/>
          Giocando la carta nell'ultima colonna prima dell'Orizzonte degli Eventi, sacrifichi la tua IT invece della ET pari al costo scontato (minimo 1IT).
          La carta entra a -90 Gradi. Nel prossimo Slittamento andrà controcorrente ed entrerà nel presente (Scambiando RP e PEP per quella collisione), per poi auto-distruggersi.
        </div>

        <hr class="cyber-divider" />

        <h3>Fase 5: Collisione (Solo Presente)</h3>
        <p>Somma PEP VS RP per schieramento. Se la PEP supera la RP avversaria (es. 5 contro 2), lo Scudo Cede. Il Presente nemico collassa (Frammenti condannati all'oblio) e la differenza (3) si detrae dai punti IT.<br/>
        Se la PEP è inferiore o pari alla RP, lo scudo Regge: zero danni e niente collassa al nemico.</p>
        <p>
          <strong>Proprietà degli Stati Materia (Max 2 per Tipo in Collisione):</strong><br/>
          🧱 <em>Solido:</em> Riduci di 1 il danno IT. | 💧 <em>Liquido:</em> Se muore, salvalo nel Passato. | 🌫️ <em>Gas:</em> Se zero danni inflitti a IT nemica per questa collisione da chiunque, infliggi 1 danno IT. | ⚡ <em>Plasma:</em> Se infliggi danno all'IT, +1 danno extra.
        </p>

      </article>

      <!-- 4. TEMPERATURA -->
      <article class="glass-panel text-content">
        <h2>4. SISTEMA TERMICO E TEMPERATURE GLOBALI (TP)</h2>
        <p>Il Termometro Globale TP è unico e si sposta tra -4 (Congelamento Assoluto) e +4 (Surriscaldamento Critico). Varia (ricalcolo) ogni volta che la materia entra o esce dal centro (il Presente), o dopo Inversioni.</p>
        
        <p>
          <strong>Segnalini Termici (Transizioni di Stato)</strong><br/>
          Quando TP tocca +2 (🔴) o -2 (🔵), si infondono i Frammenti col relativo segnalino, che conferisce alla carta anche le proprietà dello stato materico superiore (o inferiore). Non modificano l'Attacco/Difesa originale.
        </p>

        <p class="highlight" style="font-style:italic">"Ai fini degli effetti delle carte, si considera che la TP cambi segno non solo quando passa da un valore netto positivo o negativo, ma anche quando raggiunge o attraversa lo 0 termico."</p>

      </article>
      
      <!-- 5. INVERSIONI -->
      <article class="glass-panel text-content">
        <h2>5. MECCANICHE AVANZATE: LE INVERSIONI TEMPORALI</h2>
        <p>Avvengono se <strong>esasperati dal Termometro (Tocca ±4 -> Inversione Gratuita Spontanea)</strong> o giocate volutamente col lancio di una carta idonea (Costano 1 danno Auto-Inflitto all'IT).</p>
        
        <ul class="accent-list">
          <li><strong>Flusso Inverso:</strong> Passato diventa il nuovo Futuro e viceversa. Il nastro trasportatore scivola al contrario.</li>
          <li><strong>Note Tattiche (Trappola):</strong> Se giochi a sinistra (nuovo Futuro), scarterai subito le carte all'Orizzonte al prossimo giro. La semantica delle carte (es. "Non slitta nel Passato") si riferisce unicamente al ruolo ATTUALE della colonna di riferimento.</li>
        </ul>
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

.text-content ul, .text-content ol {
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

.cyber-divider {
  border: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--accent-gold-rgb), 0.3), transparent);
  margin: 1.5rem 0;
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
