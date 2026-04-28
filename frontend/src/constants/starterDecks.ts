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
    id: 'chronos',
    name: 'Chronos, Custode del Presente',
    style: 'Sincronia Architettonica (Controllo Spaziale / Difesa)',
    desc: 'Erigi muri impenetrabili, controlla il campo e chiudi la partita raggiungendo la Sincronia.',
    longDesc: "Chronos domina il Presente. Sfrutta i Solidi inamovibili per difendere strenuamente la tua linea temporale e Plasma letali per fare piazza pulita delle minacce avversarie. Questo mazzo punisce i tentativi di Inversione nemici usando la Materia Oscura come Jolly per colmare gli stati mancanti. Mette inoltre in luce il vero potere necromantico del nuovo Orizzonte degli Eventi, usando il Vortice di Ripristino per recuperare gli scarti quando tutto sembra perduto.",
    difficulty: 3,
    difficultyLabel: 'Intermedio',
    color: '#00a2ff',
    glow: 'rgba(0, 242, 255, 0.4)',
    imageUrl: '/images/chronos-builder.webp',
    objectPosition: 'center bottom',
    costruttoreId: '254',
    stats: { attacco: 4, difesa: 10, velocita: 3, controllo: 9, interferenza: 6 },
    cards: [
      { id: '23', count: 3 }, { id: '180', count: 3 }, { id: '24', count: 2 }, { id: '138', count: 2 },
      { id: '13', count: 3 }, { id: '156', count: 3 }, { id: '63', count: 3 }, { id: '15', count: 3 },
      { id: '74', count: 3 }, { id: '224', count: 3 },
      { id: '41', count: 3 }, { id: '42', count: 3 },
      { id: '169', count: 3 }, { id: '246', count: 2 }, { id: '139', count: 1 }
    ]
  },
  {
    id: 'khepri',
    name: 'Khepri, Ricorsione Fluida',
    style: 'Sincronia Fluida (Mobilità / Evasione)',
    desc: 'Danza tra le linee temporali evadendo gli attacchi e manipola a tuo favore le memorie del Passato.',
    longDesc: "Un inno all'adattabilità. Khepri guida Liquidi e Gas sfuggendo alla distruzione frontale per sfruttare appieno la nuova meccanica della \"Memoria\". Quando le tue carte eludono il Presente e scivolano fuori dal tabellone, si salvano in cima al tuo mazzetto del Passato. Grazie a questa formidabile fluidità, puoi innescare Inversioni Temporali mirate per dictare le regole della tua prossima pescata e incastrare con facilità i cinque stati per la Vittoria per Sincronia.",
    difficulty: 4,
    difficultyLabel: 'Avanzato',
    color: '#00ff4d',
    glow: 'rgba(0, 255, 170, 0.4)',
    imageUrl: '/images/khepri-builder.webp',
    objectPosition: 'center',
    costruttoreId: '259',
    stats: { attacco: 6, difesa: 6, velocita: 10, controllo: 7, interferenza: 5 },
    cards: [
      { id: '4', count: 3 }, { id: '141', count: 3 }, { id: '26', count: 3 }, { id: '6', count: 3 },
      { id: '8', count: 3 }, { id: '190', count: 3 }, { id: '30', count: 3 },
      { id: '2', count: 3 }, { id: '215', count: 3 },
      { id: '203', count: 3 }, { id: '17', count: 3 },
      { id: '208', count: 3 }, { id: '209', count: 2 }, { id: '252', count: 2 }
    ]
  },
  {
    id: 'umbra',
    name: 'Umbra, Voce del Vuoto',
    style: 'L\'Orizzonte Ineluttabile (Punisher / Logoramento Entropico)',
    desc: 'Condanna l\'avversario a subire danni irreversibili ogni volta che tenta di salvarsi esorendo il mazzo.',
    longDesc: "Il mazzo di controllo definitivo forgiato per esaltare le leggi del nuovo timer entropico. Sfruttando la meccanica del deckout (il mazzo che si svuota obbligando a cambiare flusso), Umbra trasforma la necessità in una condanna a morte. Ogni volta che l'avversario innesca un'Inversione per non morire di inedia, la fitta rete di Anomalie e Materia Oscura di questo mazzo lo punirà con pesantissimi danni diretti ineluttabili. Blocca i danni fisici con le Stasi e osserva l'arena che lo consuma.",
    difficulty: 5,
    difficultyLabel: 'Esperto',
    color: '#a200ff',
    glow: 'rgba(180, 0, 255, 0.5)',
    imageUrl: '/images/umbra-builder.webp',
    objectPosition: 'center bottom',
    costruttoreId: '260',
    stats: { attacco: 7, difesa: 5, velocita: 5, controllo: 6, interferenza: 10 },
    cards: [
      { id: '18', count: 2 }, { id: '244', count: 2 }, { id: '166', count: 2 }, { id: '67', count: 2 },
      { id: '66', count: 2 }, { id: '162', count: 2 },
      { id: '175', count: 2 }, { id: '128', count: 3 }, { id: '19', count: 3 }, { id: '46', count: 2 },
      { id: '90', count: 3 }, { id: '253', count: 1 },
      { id: '9', count: 3 }, { id: '57', count: 3 },
      { id: '64', count: 3 }, { id: '239', count: 1 },
      { id: '145', count: 3 }, { id: '76', count: 1 }
    ]
  }
];
