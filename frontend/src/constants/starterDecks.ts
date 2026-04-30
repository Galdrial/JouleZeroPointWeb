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
    desc: 'Erigi muri impenetrabili, congela il termometro e chiudi la partita per Sincronia o per sfinimento.',
    longDesc: "Chronos domina il Presente costruendo una fortezza inespugnabile. Sfrutta i Solidi inamovibili e carte come Stasi Totale per congelare la Temperatura (TP), bloccando le transizioni di stato avversarie. Grazie all'incredibile flessibilità della Materia Oscura, che funge da Jolly, può ottenere la Vittoria per Sincronia mentre l'avversario si infrange contro i suoi scudi. Mette inoltre in luce il vero potere di manipolazione temporale, usando il Vortice di Ripristino per recuperare gli scarti.",
    difficulty: 3,
    difficultyLabel: 'Intermedio',
    color: '#00a2ff',
    glow: 'rgba(0, 242, 255, 0.4)',
    imageUrl: '/images/chronos-builder.webp',
    objectPosition: 'center bottom',
    costruttoreId: '254',
    stats: { attacco: 4, difesa: 10, velocita: 3, controllo: 9, interferenza: 6 },
    cards: [
      { id: '1', count: 3 }, { id: '23', count: 3 }, { id: '50', count: 3 }, { id: '180', count: 3 },
      { id: '138', count: 2 }, { id: '139', count: 1 }, { id: '224', count: 3 }, { id: '74', count: 3 },
      { id: '13', count: 3 }, { id: '156', count: 3 },
      { id: '165', count: 3 }, { id: '124', count: 1 },
      { id: '125', count: 3 }, { id: '90', count: 3 }, { id: '248', count: 3 }
    ]
  },
  {
    id: 'khepri',
    name: 'Khepri, Ricorsione Fluida',
    style: 'Sincronia Fluida (Evasione Pura / Manipolazione del Mazzo)',
    desc: 'Danza tra le linee temporali, salva i tuoi Frammenti nel Passato e scolpisci il futuro a tuo vantaggio.',
    longDesc: "Khepri porta la meccanica di Sopravvivenza al suo estremo. Facendo scivolare i Liquidi fuori dal Passato, li salva mettendoli in cima al mazzetto della Memoria, garantendosi un flusso inesauribile di risorse contro il Collasso Entropico. È un mazzo sfuggente che schiva i colpi mortali con Deviazione Temporale e manipola le pescate con Mare di Pianificazione. Utilizzando le sue carte Materia Oscura per sostituire lo stato Plasma mancante, incastra la Sincronia perfetta in modo del tutto inafferrabile.",
    difficulty: 4,
    difficultyLabel: 'Avanzato',
    color: '#00ff4d',
    glow: 'rgba(0, 255, 170, 0.4)',
    imageUrl: '/images/khepri-builder.webp',
    objectPosition: 'center',
    costruttoreId: '259',
    stats: { attacco: 5, difesa: 6, velocita: 8, controllo: 7, interferenza: 4 },
    cards: [
      { id: '4', count: 3 }, { id: '141', count: 3 }, { id: '26', count: 3 }, { id: '77', count: 3 },
      { id: '145', count: 3 }, { id: '76', count: 1 }, { id: '8', count: 3 },
      { id: '79', count: 3 }, { id: '2', count: 3 },
      { id: '181', count: 3 }, { id: '17', count: 3 },
      { id: '203', count: 3 }, { id: '127', count: 3 }, { id: '208', count: 3 }
    ]
  },
  {
    id: 'umbra',
    name: 'Umbra, Voce del Vuoto',
    style: 'L\'Orizzonte Ineluttabile (Auto-Inversione / Punizione Entropica)',
    desc: 'Forza Inversioni Temporali a ripetizione per innescare combo letali e logorare l\'Integrità Temporale nemica.',
    longDesc: "L'incarnazione del caos puro. Umbra rinuncia matematicamente alla Sincronia per concentrarsi sulla distruzione assoluta tramite Vittoria per Collasso. Il mazzo è un inarrestabile motore che forza le Inversioni Temporali a comando tramite Eventi e Anomalie come Sfasamento Temporale e Faglia Temporale. Ogni volta che il flusso del tempo si capovolge, la rete di Materia Oscura stritola le risorse nemiche, mentre Frammenti come la Nebbia Risonante guadagnano poteri mostruosi per chiudere lo scontro.",
    difficulty: 5,
    difficultyLabel: 'Esperto',
    color: '#a200ff',
    glow: 'rgba(180, 0, 255, 0.5)',
    imageUrl: '/images/umbra-builder.webp',
    objectPosition: 'center bottom',
    costruttoreId: '260',
    stats: { attacco: 8, difesa: 4, velocita: 7, controllo: 5, interferenza: 10 },
    cards: [
      { id: '18', count: 2 }, { id: '244', count: 2 }, { id: '166', count: 2 }, { id: '67', count: 2 },
      { id: '66', count: 2 }, { id: '162', count: 3 },
      { id: '41', count: 1 }, { id: '9', count: 3 }, { id: '57', count: 3 }, { id: '59', count: 3 },
      { id: '48', count: 3 }, { id: '91', count: 2 },
      { id: '211', count: 2 }, { id: '172', count: 2 },
      { id: '46', count: 2 }, { id: '175', count: 2 },
      { id: '93', count: 1 }, { id: '90', count: 3 }
    ]
  }
];
