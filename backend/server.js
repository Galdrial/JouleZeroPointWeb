require( 'dotenv' ).config();
const express = require( 'express' );
const cors = require( 'cors' );
const axios = require( 'axios' );

const app = express();
app.use( cors() );
app.use( express.json() );

// Autenticazione (Gestione Costruttori)
const authRoutes = require( './auth' );
app.use( '/api/auth', authRoutes );

// Terminale del Punto Zero (AI Oracolo)
const chatbotRoutes = require( './chatbot' );
app.use( '/api', chatbotRoutes );

const GOOGLE_SHEETS_CSV_URL = process.env.SHEETS_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4otsaVBcLkcGI4zdD8aBJn0nRah9mUrEG0BprARIMF0WdocEkPsBkK0n4v-Sdf70KnBGmI95nS7EG/pub?gid=1051449153&single=true&output=tsv';

function parseCSV( fileContent ) {
  const lines = fileContent.split( '\n' );
  if ( lines.length < 2 ) return [];

  const headers = lines[0].split( '\t' ).map( h => h.trim() );
  const cards = [];

  for ( let i = 1; i < lines.length; i++ ) {
    const line = lines[i];
    if ( !line.trim() ) continue;

    const values = line.split( '\t' ).map( v => v.trim() );
    const data = {};
    headers.forEach( ( header, index ) => {
      data[header] = values[index];
    } );

    const cost_et = data['Costo_ET'] ? parseInt( data['Costo_ET'], 10 ) : null;
    const pep = data['PEP'] ? parseInt( data['PEP'], 10 ) : null;
    const rp = data['RP'] ? parseInt( data['RP'], 10 ) : null;

    const id = parseInt( data['ID'], 10 );
    const card = {
      id: id,
      name: data['Nome'],
      type: data['Tipo'],
      status: data['Stato'],
      cost_et: isNaN( cost_et ) ? null : cost_et,
      pep: isNaN( pep ) ? null : pep,
      rp: isNaN( rp ) ? null : rp,
      rarity: data['Rarità'],
      effect: data['Effetto'],
      role: data['Ruolo'],
      image_url: `/assets/cards/${String( id ).padStart( 3, '0' )}_${( data['Nome'] || '' ).replace( /,/g, '' ).replace( / /g, '_' )}.png`
    };

    if ( data['Nome'] ) {
      cards.push( card );
    }
  }
  return cards;
}

const fs = require('fs');
const path = require('path');
const DECKS_FILE = path.join(__dirname, 'decks.json');

function normalizeDeck(deck) {
  return {
    ...deck,
    isPublic: deck.isPublic === true,
    createdAt: deck.createdAt || deck.id || Date.now(),
    updatedAt: deck.updatedAt || deck.createdAt || deck.id || Date.now(),
    votes: Array.isArray(deck.votes)
      ? [...new Set(deck.votes.filter(v => typeof v === 'string' && v.trim().length > 0))]
      : [],
    importsCount: Number.isFinite(deck.importsCount) ? deck.importsCount : 0
  };
}

function readDecks() {
  const raw = fs.readFileSync(DECKS_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeDeck);
}

function writeDecks(decks) {
  fs.writeFileSync(DECKS_FILE, JSON.stringify(decks, null, 2));
}

app.get( '/api/cards', async ( req, res ) => {
  try {
    const response = await axios.get( GOOGLE_SHEETS_CSV_URL );
    const liveCards = parseCSV( response.data );
    res.json( liveCards );
  } catch ( error ) {
    console.error( 'Errore nel fetch delle carte da Google Sheets:', error );
    res.status( 500 ).json( { error: 'Errore durante la lettura della Matrice Dati (Server Error)' } );
  }
} );

// Gestione Mazzi
app.get( '/api/decks', ( req, res ) => {
  try {
    const { creator, q, costruttoreId, page = 1, limit = 12 } = req.query;
    let decks = readDecks();
    
    // Filtro per creatore
    if (creator) {
      decks = decks.filter(d => d.creator === creator);
      // Se non è il creatore stesso a richiedere, mostriamo solo i pubblici
      const requester = req.headers['x-user'] || ''; 
      if (requester !== creator) {
        decks = decks.filter(d => d.isPublic === true);
      }
    }

    // Filtro ricerca testuale
    if ( q ) {
      const query = q.toLowerCase();
      decks = decks.filter( d => d.name.toLowerCase().includes( query ) );
    }

    // Filtro per Costruttore
    if ( costruttoreId ) {
      const cid = parseInt( costruttoreId );
      decks = decks.filter( d => d.costruttoreId === cid );
    }

    const total = decks.length;

    // Paginazione
    const start = ( parseInt( page ) - 1 ) * parseInt( limit );
    const end = start + parseInt( limit );
    const paginatedDecks = decks.slice( start, end );

    res.json( {
      decks: paginatedDecks,
      total: total
    } );
  } catch ( error ) {
    res.status( 500 ).json( { error: 'Errore caricamento mazzi' } );
  }
} );

app.get('/api/public-decks', (req, res) => {
  try {
    const { q, costruttoreId, sort = 'recent', page = 1, limit = 12 } = req.query;
    const requester = (req.headers['x-user'] || '').toString();
    let decks = readDecks().filter(d => d.isPublic === true);

    if (q) {
      const query = q.toString().toLowerCase();
      decks = decks.filter(d =>
        (d.name || '').toLowerCase().includes(query) ||
        (d.creator || '').toLowerCase().includes(query)
      );
    }

    if (costruttoreId) {
      const cid = parseInt(costruttoreId, 10);
      decks = decks.filter(d => d.costruttoreId === cid);
    }

    if (sort === 'top') {
      decks.sort((a, b) => (b.votes.length - a.votes.length) || (b.createdAt - a.createdAt));
    } else if (sort === 'imports') {
      decks.sort((a, b) => (b.importsCount - a.importsCount) || (b.createdAt - a.createdAt));
    } else {
      decks.sort((a, b) => b.createdAt - a.createdAt);
    }

    const total = decks.length;
    const start = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const end = start + parseInt(limit, 10);
    const paginatedDecks = decks.slice(start, end).map(d => {
      const { votes, ...rest } = d;
      return {
        ...rest,
        votesCount: votes.length,
        userVoted: requester ? votes.includes(requester) : false
      };
    });

    res.json({ decks: paginatedDecks, total });
  } catch (error) {
    console.error('Errore caricamento mazzi pubblici:', error);
    res.status(500).json({ error: 'Errore caricamento mazzi pubblici' });
  }
});

app.post('/api/decks/:id/vote', (req, res) => {
  try {
    const deckId = parseInt(req.params.id, 10);
    const requester = (req.headers['x-user'] || '').toString().trim();

    if (!requester) {
      return res.status(401).json({ error: 'Autenticazione richiesta per votare.' });
    }

    let decks = readDecks();
    const deck = decks.find(d => d.id === deckId);

    if (!deck || deck.isPublic !== true) {
      return res.status(404).json({ error: 'Mazzo pubblico non trovato.' });
    }

    if (deck.votes.includes(requester)) {
      deck.votes = deck.votes.filter(v => v !== requester);
    } else {
      deck.votes.push(requester);
    }
    deck.updatedAt = Date.now();

    writeDecks(decks);
    res.json({
      deckId,
      votesCount: deck.votes.length,
      userVoted: deck.votes.includes(requester)
    });
  } catch (error) {
    console.error('Errore voto mazzo:', error);
    res.status(500).json({ error: 'Errore voto mazzo' });
  }
});

app.post('/api/decks/:id/import', (req, res) => {
  try {
    const deckId = parseInt(req.params.id, 10);
    const requester = (req.headers['x-user'] || '').toString().trim();

    if (!requester) {
      return res.status(401).json({ error: 'Autenticazione richiesta per importare.' });
    }

    let decks = readDecks();
    const sourceDeck = decks.find(d => d.id === deckId && d.isPublic === true);
    if (!sourceDeck) {
      return res.status(404).json({ error: 'Mazzo pubblico non trovato.' });
    }

    const existingNames = new Set(
      decks
        .filter(d => (d.creator || '').toLowerCase() === requester.toLowerCase())
        .map(d => (d.name || '').trim().toLowerCase())
    );

    let importedName = `${sourceDeck.name} (importato)`;
    let suffix = 2;
    while (existingNames.has(importedName.trim().toLowerCase())) {
      importedName = `${sourceDeck.name} (importato ${suffix})`;
      suffix++;
    }

    const importedDeck = normalizeDeck({
      id: Date.now(),
      name: importedName,
      cards: sourceDeck.cards,
      costruttoreId: sourceDeck.costruttoreId,
      creator: requester,
      isPublic: false,
      parentDeckId: sourceDeck.id,
      votes: [],
      importsCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    sourceDeck.importsCount = (sourceDeck.importsCount || 0) + 1;
    sourceDeck.updatedAt = Date.now();

    decks.push(importedDeck);
    writeDecks(decks);

    res.json({ importedDeck });
  } catch (error) {
    console.error('Errore import mazzo:', error);
    res.status(500).json({ error: 'Errore import mazzo' });
  }
});

app.post( '/api/decks', ( req, res ) => {
  try {
    const newDeck = req.body;
    let decks = readDecks();

    const normalizedName = ( newDeck.name || '' ).trim().toLowerCase();
    const normalizedCreator = ( newDeck.creator || '' ).trim().toLowerCase();

    if ( !normalizedName ) {
      return res.status( 400 ).json( { error: 'Nome mazzo obbligatorio.' } );
    }

    const duplicateDeck = decks.find( d => {
      const sameName = ( d.name || '' ).trim().toLowerCase() === normalizedName;
      const sameCreator = ( d.creator || '' ).trim().toLowerCase() === normalizedCreator;
      const differentDeck = !newDeck.id || d.id !== newDeck.id;
      return sameName && sameCreator && differentDeck;
    } );

    if ( duplicateDeck ) {
      return res.status( 409 ).json( { error: 'Esiste già un mazzo con questo nome per questo utente.' } );
    }

    if ( newDeck.id ) {
      // Aggiornamento esistente
      const existingDeck = decks.find(d => d.id === newDeck.id);
      const mergedDeck = normalizeDeck({
        ...existingDeck,
        ...newDeck,
        createdAt: existingDeck?.createdAt || newDeck.createdAt || Date.now(),
        updatedAt: Date.now(),
        votes: existingDeck?.votes || [],
        importsCount: existingDeck?.importsCount || 0
      });
      decks = decks.map( d => d.id === newDeck.id ? mergedDeck : d );
      writeDecks(decks);
      return res.json(mergedDeck);
    } else {
      // Nuovo mazzo
      const normalizedDeck = normalizeDeck({
        ...newDeck,
        id: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        votes: [],
        importsCount: 0
      });
      decks.push( normalizedDeck );
      writeDecks(decks);
      return res.json(normalizedDeck);
    }
  } catch ( error ) {
    console.error( 'Errore salvataggio mazzo:', error );
    res.status( 500 ).json( { error: 'Errore salvataggio mazzo' } );
  }
} );

app.delete( '/api/decks/:id', ( req, res ) => {
  try {
    const deckId = parseInt( req.params.id, 10 );
    if ( Number.isNaN( deckId ) ) {
      return res.status( 400 ).json( { error: 'ID mazzo non valido' } );
    }

    let decks = readDecks();
    const initialLength = decks.length;
    decks = decks.filter( d => d.id !== deckId );

    if ( decks.length === initialLength ) {
      return res.status( 404 ).json( { error: 'Mazzo non trovato' } );
    }

    writeDecks(decks);
    res.json( { message: 'Mazzo eliminato con successo.' } );
  } catch ( error ) {
    res.status( 500 ).json( { error: 'Errore eliminazione mazzo' } );
  }
} );

app.delete( '/api/decks/user/:username', ( req, res ) => {
  try {
    const { username } = req.params;
    let decks = readDecks();
    decks = decks.filter(d => d.creator !== username);
    writeDecks(decks);

    res.json({ message: `Tutti i mazzi di ${username} rimossi con successo.` });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante la pulizia dei dati mazzi' });
  }
} );


const PORT = process.env.PORT || 3000;
app.listen( PORT, '0.0.0.0', () => {
  console.log( `[Punto Zero] Backend Server in ascolto sulla porta ${PORT}` );
} );
