export interface StarterDeck {
  id: string;
  name: string;
  style: string;
  desc: string;
  difficulty: number;
  difficultyLabel: string;
  color: string;
  glow: string;
  imageUrl: string;
  longDesc?: string;
  objectPosition?: string;
  costruttoreId: string;
  stats: {
    attacco: number;
    difesa: number;
    velocita: number;
    controllo: number;
    interferenza: number;
  };
  cards: { id: string; count: number }[];
}

export const STARTER_DECKS: StarterDeck[] = [
  {
    id: 'pyros',
    name: 'Pyros, Punto di Fusione',
    style: 'Aggro / Danno Diretto',
    desc: 'Affidati a Gas elusivi e Plasmi letali per spingere ossessivamente la Temperatura (TP) verso il Surriscaldamento. Innesca catastrofiche Inversioni Temporali per incenerire e aggirare le difese nemiche.',
    longDesc: "Pyros è l'incarnazione del caos puro e del Surriscaldamento. Questo mazzo è l'esatto opposto di Chronos: non cerca di difendere il Presente, ma di bruciarlo. La tua strategia si affida alla letale combinazione di Gas e Plasmi, carte intrinsecamente \"Calde\" che alzano costantemente la Temperatura del Presente (TP). I Gas possiedono la proprietà \"Pressione\", che permette loro di infliggere danni diretti all'Integrità Temporale avversaria anche se il tuo attacco viene bloccato dallo scudo. I Plasmi scatenano la \"Scarica\", infliggendo danni aggiuntivi devastanti a patto di rischiare l'autodistruzione. Il tuo obiettivo è giocare in modo aggressivo per spingere di proposito la TP al limite critico (+4) e innescare Inversioni Temporali che inceneriscono i piani a lungo termine del tuo avversario. La tua mossa finale è la Tempesta di Collasso, una carta Critica che dimezza la Resistenza avversaria se l'arena è in Surriscaldamento.",
    difficulty: 2,
    difficultyLabel: 'Bassa',
    color: '#ff4d00',
    glow: 'rgba(255, 69, 0, 0.4)',
    imageUrl: '/images/pyros-builder.webp',
    objectPosition: 'center bottom',
    costruttoreId: '262',
    stats: { attacco: 10, difesa: 3, velocita: 9, controllo: 4, interferenza: 4 },
    cards: [
      { id: '8', count: 3 }, { id: '9', count: 3 }, { id: '30', count: 3 },
      { id: '57', count: 3 }, { id: '190', count: 3 }, { id: '13', count: 3 },
      { id: '156', count: 3 }, { id: '63', count: 3 }, { id: '64', count: 3 },
      { id: '15', count: 3 }, { id: '6', count: 3 }, { id: '19', count: 3 },
      { id: '128', count: 3 }, { id: '239', count: 1 }
    ]
  },
  {
    id: 'chronos',
    name: 'Chronos, Custode del Presente',
    style: 'Controllo / Assorbimento',
    desc: 'Domina l\'istante della Collisione innalzando insormontabili muri di Solidi. Congela l\'arena per azzerare i danni avversari, accumulare Energia Temporale (ET) e ottenere il controllo assoluto del campo di battaglia.',
    longDesc: "Se scegli Chronos, il tuo obiettivo non è vincere velocemente, ma dominare l'arena attraverso la stabilità assoluta. Il mazzo si basa quasi interamente sui Solidi, frammenti geologici di ghiaccio e roccia che possiedono la proprietà \"Assorbimento\": riducono sempre di 1 i danni inflitti alla tua Integrità Temporale (IT). Innalzando insormontabili muri nel Presente, congelerai il campo di battaglia, bloccando l'offensiva nemica e accumulando al contempo Energia Temporale (ET) bonus. Mentre l'avversario si sfinirà cercando di scalfire le tue difese, tu potrai usare carte Materia Oscura per neutralizzare i suoi vantaggi ed Eventi per rallentare il gioco. La tua chiusura ideale è la carta Critica Ancora di Tempo, un colossale monolite a costo 7 che impedisce fisicamente il verificarsi delle Inversioni Temporali e previene il primo danno che dovresti subire.",
    difficulty: 3,
    difficultyLabel: 'Media',
    color: '#00a2ff',
    glow: 'rgba(0, 242, 255, 0.4)',
    imageUrl: '/images/chronos-builder.webp',
    objectPosition: 'center bottom',
    costruttoreId: '254',
    stats: { attacco: 4, difesa: 10, velocita: 3, controllo: 9, interferenza: 6 },
    cards: [
      { id: '2', count: 3 }, { id: '23', count: 3 }, { id: '180', count: 3 },
      { id: '215', count: 3 }, { id: '24', count: 2 }, { id: '138', count: 2 },
      { id: '50', count: 2 }, { id: '134', count: 2 }, { id: '165', count: 3 },
      { id: '66', count: 2 }, { id: '130', count: 3 }, { id: '248', count: 3 },
      { id: '90', count: 3 }, { id: '46', count: 2 }, { id: '209', count: 2 },
      { id: '139', count: 1 }
    ]
  },
  {
    id: 'khepri',
    name: 'Khepri, Ricorsione Fluida',
    style: 'Mobilità / Evasione',
    desc: 'Sfuggi agli scontri frontali sfruttando l\'inesorabile persistenza dei Liquidi. Danza tra le pieghe del Passato e del Futuro, riposizionando i tuoi Frammenti per mandare a vuoto i colpi nemici in un logoramento continuo.',
    longDesc: "Khepri rifiuta lo scontro frontale e trasforma l'arena in un labirinto. L'esercito di questo mazzo è composto al 100% da frammenti allo stato Liquido. La forza dei Liquidi risiede nella loro \"Persistenza\": quando vengono distrutti, invece di finire negli scarti (Orizzonte degli Eventi), possono scivolare all'indietro nel Passato per salvaguardarsi e tornare in gioco. Guidare Khepri richiede calcolo e previsione: grazie all'abilità passiva del tuo Costruttore e agli Eventi di deviazione, potrai spostare volontariamente i tuoi Frammenti tra Passato, Presente e Futuro. Mentre l'avversario colpirà a vuoto, tu lo logorerai lentamente, riposizionando di continuo le tue truppe. L'asso nella manica è la carta Critica Mare di Assestamento, che ti permette di innescare Inversioni Temporali volontarie aggirando il normale tributo in punti vita richiesto dalle regole.",
    difficulty: 4,
    difficultyLabel: 'Alta',
    color: '#00ff4d',
    glow: 'rgba(0, 255, 170, 0.4)',
    imageUrl: '/images/khepri-builder.webp',
    objectPosition: 'center',
    costruttoreId: '259',
    stats: { attacco: 6, difesa: 6, velocita: 10, controllo: 7, interferenza: 5 },
    cards: [
      { id: '4', count: 3 }, { id: '26', count: 3 }, { id: '74', count: 3 },
      { id: '141', count: 3 }, { id: '145', count: 3 }, { id: '224', count: 3 },
      { id: '223', count: 2 }, { id: '17', count: 3 }, { id: '124', count: 3 },
      { id: '127', count: 3 }, { id: '168', count: 3 }, { id: '208', count: 3 },
      { id: '213', count: 2 }, { id: '252', count: 2 }, { id: '76', count: 1 }
    ]
  },
  {
    id: 'umbra',
    name: 'Umbra, Voce del Vuoto',
    style: 'Punisher / Disruption',
    desc: 'Non cercare l\'equilibrio, ma sabota le fondamenta stesse del tempo. Sfrutta l\'oscura letalità della Materia Oscura per infliggere danni simmetrici e punire severamente chiunque osi innescare un\'Inversione Temporale.',
    longDesc: "Umbra non è qui per bilanciare l'universo, ma per spezzarlo definitivamente. Questo mazzo è la vera \"nemesi\" del tempo, composto per oltre la metà da Materia Oscura. La Materia Oscura è una forza che non altera la temperatura globale, ma colpisce il sistema alla radice con effetti brutali, spesso simmetrici. Il tuo stile di gioco ruota attorno al concetto di \"Punisher\": tu non impedisci all'avversario di agire, ma lo punisci severamente ogni volta che lo fa. La tua intera strategia punisce pesantemente chiunque osi innescare un'Inversioni Temporale, infliggendo danni diretti a entrambi i giocatori, facendo scartare risorse e distruggendo frammenti in gioco. Per trionfare con Umbra dovrai gestire i tuoi stessi punti vita come una risorsa. Il culmine dell'entropia arriva con Nullità Assoluta, un'Anomalia devastante che annulla del tutto le variazioni termiche, forzando l'avversario a giocare secondo le tue spietate condizioni.",
    difficulty: 5,
    difficultyLabel: 'Alta',
    color: '#a200ff',
    glow: 'rgba(180, 0, 255, 0.5)',
    imageUrl: '/images/umbra-builder.webp',
    objectPosition: 'center bottom',
    costruttoreId: '260',
    stats: { attacco: 7, difesa: 5, velocita: 5, controllo: 6, interferenza: 10 },
    cards: [
      { id: '41', count: 3 }, { id: '42', count: 3 }, { id: '89', count: 3 },
      { id: '162', count: 3 }, { id: '203', count: 3 }, { id: '243', count: 3 },
      { id: '18', count: 2 }, { id: '67', count: 2 }, { id: '166', count: 2 },
      { id: '244', count: 2 }, { id: '173', count: 3 }, { id: '169', count: 3 },
      { id: '170', count: 3 }, { id: '175', count: 2 }, { id: '246', count: 2 },
      { id: '253', count: 1 }
    ]
  }
];
