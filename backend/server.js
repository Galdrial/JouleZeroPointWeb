require( 'dotenv' ).config();
const express = require( 'express' );
const cors = require( 'cors' );
const axios = require( 'axios' );
const multer = require( 'multer' );

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

const fs = require( 'fs' );
const path = require( 'path' );
const DECKS_FILE = path.join( __dirname, 'decks.json' );
const NEWS_FILE = path.join( __dirname, 'news.json' );
const FRONTEND_PUBLIC_NEWS_DIR = path.join( __dirname, '..', 'frontend', 'public', 'news' );

fs.mkdirSync( FRONTEND_PUBLIC_NEWS_DIR, { recursive: true } );

const uploadStorage = multer.diskStorage( {
  destination: ( _req, _file, cb ) => cb( null, FRONTEND_PUBLIC_NEWS_DIR ),
  filename: ( _req, file, cb ) => {
    const extension = path.extname( file.originalname || '' ).toLowerCase() || '.jpg';
    const sanitizedBase = path
      .basename( file.originalname || 'news-image', extension )
      .toLowerCase()
      .replace( /[^a-z0-9-_]/g, '-' )
      .replace( /-+/g, '-' )
      .replace( /^-|-$|_/g, '' ) || 'news-image';

    cb( null, `${Date.now()}-${sanitizedBase}${extension}` );
  }
} );

const uploadNewsImage = multer( {
  storage: uploadStorage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: ( _req, file, cb ) => {
    if ( file.mimetype && file.mimetype.startsWith( 'image/' ) ) {
      cb( null, true );
    } else {
      cb( new Error( 'Solo immagini consentite.' ) );
    }
  }
} );

function normalizeNews( news ) {
  const parsedFeaturedOrder = Number.isFinite( Number( news.featuredOrder ) )
    ? Number( news.featuredOrder )
    : null;

  return {
    id: news.id,
    slug: news.slug,
    title: news.title,
    summary: news.summary,
    content: news.content,
    imageUrl: news.imageUrl || '',
    sourceUrl: news.sourceUrl || '',
    publishedAt: news.publishedAt,
    isPublished: news.isPublished !== false,
    isFeatured: news.isFeatured === true || ( news.isFeatured !== false && parsedFeaturedOrder !== null ),
    featuredOrder: news.isFeatured === false ? null : parsedFeaturedOrder
  };
}

function sortNewsItems( news ) {
  return [...news].sort( ( a, b ) => {
    if ( a.isFeatured !== b.isFeatured ) {
      return a.isFeatured ? -1 : 1;
    }

    if ( a.isFeatured && b.isFeatured ) {
      const aOrder = Number.isFinite( a.featuredOrder ) ? a.featuredOrder : Number.MAX_SAFE_INTEGER;
      const bOrder = Number.isFinite( b.featuredOrder ) ? b.featuredOrder : Number.MAX_SAFE_INTEGER;

      if ( aOrder !== bOrder ) {
        return aOrder - bOrder;
      }
    }

    return new Date( b.publishedAt ).getTime() - new Date( a.publishedAt ).getTime();
  } );
}

function readNews() {
  const raw = fs.readFileSync( NEWS_FILE, 'utf8' );
  const parsed = JSON.parse( raw );
  if ( !Array.isArray( parsed ) ) return [];
  return parsed.map( normalizeNews );
}

function writeNews( news ) {
  fs.writeFileSync( NEWS_FILE, JSON.stringify( news, null, 2 ) );
}

function requireAdmin( req, res, next ) {
  const adminKey = process.env.ADMIN_KEY;
  if ( !adminKey ) {
    return res.status( 503 ).json( { error: 'Gestione news non configurata (ADMIN_KEY mancante).' } );
  }
  const provided = req.headers['x-admin-key'] || '';
  if ( provided !== adminKey ) {
    return res.status( 401 ).json( { error: 'Accesso non autorizzato.' } );
  }
  next();
}

function normalizeDeck( deck ) {
  return {
    ...deck,
    isPublic: deck.isPublic === true,
    createdAt: deck.createdAt || deck.id || Date.now(),
    updatedAt: deck.updatedAt || deck.createdAt || deck.id || Date.now(),
    votes: Array.isArray( deck.votes )
      ? [...new Set( deck.votes.filter( v => typeof v === 'string' && v.trim().length > 0 ) )]
      : [],
    importsCount: Number.isFinite( deck.importsCount ) ? deck.importsCount : 0
  };
}

function readDecks() {
  const raw = fs.readFileSync( DECKS_FILE, 'utf8' );
  const parsed = JSON.parse( raw );
  if ( !Array.isArray( parsed ) ) return [];
  return parsed.map( normalizeDeck );
}

function writeDecks( decks ) {
  fs.writeFileSync( DECKS_FILE, JSON.stringify( decks, null, 2 ) );
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

app.get( '/api/news', ( req, res ) => {
  try {
    const { limit } = req.query;
    const parsedLimit = parseInt( limit, 10 );

    let news = sortNewsItems(
      readNews().filter( item => item.isPublished )
    );

    if ( Number.isFinite( parsedLimit ) && parsedLimit > 0 ) {
      news = news.slice( 0, parsedLimit );
    }

    const payload = news.map( ( { content, ...item } ) => item );
    res.json( payload );
  } catch ( error ) {
    console.error( 'Errore caricamento news:', error );
    res.status( 500 ).json( { error: 'Errore caricamento news' } );
  }
} );

app.get( '/api/news/:slug', ( req, res ) => {
  try {
    const { slug } = req.params;
    const news = readNews().find( item => item.slug === slug && item.isPublished );

    if ( !news ) {
      return res.status( 404 ).json( { error: 'News non trovata' } );
    }

    res.json( news );
  } catch ( error ) {
    console.error( 'Errore dettaglio news:', error );
    res.status( 500 ).json( { error: 'Errore dettaglio news' } );
  }
} );

// Gestione News (Admin)
app.get( '/api/admin/news', requireAdmin, ( req, res ) => {
  try {
    const news = sortNewsItems( readNews() );
    res.json( news );
  } catch ( error ) {
    console.error( 'Errore caricamento admin news:', error );
    res.status( 500 ).json( { error: 'Errore caricamento news' } );
  }
} );

app.post( '/api/admin/news/upload-image', requireAdmin, ( req, res ) => {
  uploadNewsImage.single( 'image' )( req, res, ( error ) => {
    if ( error ) {
      const message = error.message === 'File too large'
        ? 'Immagine troppo grande (max 4MB).'
        : error.message || 'Errore upload immagine.';
      return res.status( 400 ).json( { error: message } );
    }

    if ( !req.file ) {
      return res.status( 400 ).json( { error: 'Nessun file ricevuto.' } );
    }

    return res.status( 201 ).json( {
      imageUrl: `/news/${req.file.filename}`
    } );
  } );
} );

app.post( '/api/admin/news', requireAdmin, ( req, res ) => {
  try {
    const { slug, title, summary, content, imageUrl, sourceUrl, publishedAt, isPublished, isFeatured, featuredOrder } = req.body;

    if ( !slug || !title || !summary || !content ) {
      return res.status( 400 ).json( { error: 'Campi obbligatori: slug, title, summary, content.' } );
    }

    const news = readNews();
    if ( news.find( n => n.slug === slug ) ) {
      return res.status( 409 ).json( { error: `Esiste già una news con slug "${slug}".` } );
    }

    const newItem = normalizeNews( {
      id: Date.now(),
      slug: slug.trim(),
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      imageUrl: ( imageUrl || '' ).trim(),
      sourceUrl: ( sourceUrl || '' ).trim(),
      publishedAt: publishedAt || new Date().toISOString(),
      isPublished: isPublished !== false,
      isFeatured: isFeatured === true,
      featuredOrder: isFeatured === true && Number.isFinite( Number( featuredOrder ) )
        ? Number( featuredOrder )
        : null
    } );

    news.push( newItem );
    writeNews( news );
    res.status( 201 ).json( newItem );
  } catch ( error ) {
    console.error( 'Errore creazione news:', error );
    res.status( 500 ).json( { error: 'Errore creazione news' } );
  }
} );

app.put( '/api/admin/news/:slug', requireAdmin, ( req, res ) => {
  try {
    const { slug } = req.params;
    const news = readNews();
    const index = news.findIndex( n => n.slug === slug );

    if ( index === -1 ) {
      return res.status( 404 ).json( { error: 'News non trovata.' } );
    }

    const rawUpdated = {
      ...news[index],
      ...req.body,
      slug,
      id: news[index].id
    };

    if ( req.body.isFeatured === false ) {
      rawUpdated.featuredOrder = null;
    }

    const updated = normalizeNews( rawUpdated );

    news[index] = updated;
    writeNews( news );
    res.json( updated );
  } catch ( error ) {
    console.error( 'Errore aggiornamento news:', error );
    res.status( 500 ).json( { error: 'Errore aggiornamento news' } );
  }
} );

app.delete( '/api/admin/news/:slug', requireAdmin, ( req, res ) => {
  try {
    const { slug } = req.params;
    const news = readNews();
    const filtered = news.filter( n => n.slug !== slug );

    if ( filtered.length === news.length ) {
      return res.status( 404 ).json( { error: 'News non trovata.' } );
    }

    writeNews( filtered );
    res.json( { message: `News "${slug}" eliminata.` } );
  } catch ( error ) {
    console.error( 'Errore eliminazione news:', error );
    res.status( 500 ).json( { error: 'Errore eliminazione news' } );
  }
} );

// Gestione Mazzi
app.get( '/api/decks', ( req, res ) => {
  try {
    const { creator, q, costruttoreId, page = 1, limit = 12 } = req.query;
    let decks = readDecks();

    // Filtro per creatore
    if ( creator ) {
      decks = decks.filter( d => d.creator === creator );
      // Se non è il creatore stesso a richiedere, mostriamo solo i pubblici
      const requester = req.headers['x-user'] || '';
      if ( requester !== creator ) {
        decks = decks.filter( d => d.isPublic === true );
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

app.get( '/api/public-decks', ( req, res ) => {
  try {
    const { q, costruttoreId, sort = 'recent', page = 1, limit = 12 } = req.query;
    const requester = ( req.headers['x-user'] || '' ).toString();
    let decks = readDecks().filter( d => d.isPublic === true );

    if ( q ) {
      const query = q.toString().toLowerCase();
      decks = decks.filter( d =>
        ( d.name || '' ).toLowerCase().includes( query ) ||
        ( d.creator || '' ).toLowerCase().includes( query )
      );
    }

    if ( costruttoreId ) {
      const cid = parseInt( costruttoreId, 10 );
      decks = decks.filter( d => d.costruttoreId === cid );
    }

    if ( sort === 'top' ) {
      decks.sort( ( a, b ) => ( b.votes.length - a.votes.length ) || ( b.createdAt - a.createdAt ) );
    } else if ( sort === 'imports' ) {
      decks.sort( ( a, b ) => ( b.importsCount - a.importsCount ) || ( b.createdAt - a.createdAt ) );
    } else {
      decks.sort( ( a, b ) => b.createdAt - a.createdAt );
    }

    const total = decks.length;
    const start = ( parseInt( page, 10 ) - 1 ) * parseInt( limit, 10 );
    const end = start + parseInt( limit, 10 );
    const paginatedDecks = decks.slice( start, end ).map( d => {
      const { votes, ...rest } = d;
      return {
        ...rest,
        votesCount: votes.length,
        userVoted: requester ? votes.includes( requester ) : false
      };
    } );

    res.json( { decks: paginatedDecks, total } );
  } catch ( error ) {
    console.error( 'Errore caricamento mazzi pubblici:', error );
    res.status( 500 ).json( { error: 'Errore caricamento mazzi pubblici' } );
  }
} );

app.post( '/api/decks/:id/vote', ( req, res ) => {
  try {
    const deckId = parseInt( req.params.id, 10 );
    const requester = ( req.headers['x-user'] || '' ).toString().trim();

    if ( !requester ) {
      return res.status( 401 ).json( { error: 'Autenticazione richiesta per votare.' } );
    }

    let decks = readDecks();
    const deck = decks.find( d => d.id === deckId );

    if ( !deck || deck.isPublic !== true ) {
      return res.status( 404 ).json( { error: 'Mazzo pubblico non trovato.' } );
    }

    if ( deck.votes.includes( requester ) ) {
      deck.votes = deck.votes.filter( v => v !== requester );
    } else {
      deck.votes.push( requester );
    }
    deck.updatedAt = Date.now();

    writeDecks( decks );
    res.json( {
      deckId,
      votesCount: deck.votes.length,
      userVoted: deck.votes.includes( requester )
    } );
  } catch ( error ) {
    console.error( 'Errore voto mazzo:', error );
    res.status( 500 ).json( { error: 'Errore voto mazzo' } );
  }
} );

app.post( '/api/decks/:id/import', ( req, res ) => {
  try {
    const deckId = parseInt( req.params.id, 10 );
    const requester = ( req.headers['x-user'] || '' ).toString().trim();

    if ( !requester ) {
      return res.status( 401 ).json( { error: 'Autenticazione richiesta per importare.' } );
    }

    let decks = readDecks();
    const sourceDeck = decks.find( d => d.id === deckId && d.isPublic === true );
    if ( !sourceDeck ) {
      return res.status( 404 ).json( { error: 'Mazzo pubblico non trovato.' } );
    }

    if ( ( sourceDeck.creator || '' ).trim().toLowerCase() === requester.toLowerCase() ) {
      return res.status( 403 ).json( { error: 'Non puoi importare un tuo mazzo.' } );
    }

    const existingNames = new Set(
      decks
        .filter( d => ( d.creator || '' ).toLowerCase() === requester.toLowerCase() )
        .map( d => ( d.name || '' ).trim().toLowerCase() )
    );

    let importedName = `${sourceDeck.name} (importato)`;
    let suffix = 2;
    while ( existingNames.has( importedName.trim().toLowerCase() ) ) {
      importedName = `${sourceDeck.name} (importato ${suffix})`;
      suffix++;
    }

    const importedDeck = normalizeDeck( {
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
    } );

    sourceDeck.importsCount = ( sourceDeck.importsCount || 0 ) + 1;
    sourceDeck.updatedAt = Date.now();

    decks.push( importedDeck );
    writeDecks( decks );

    res.json( { importedDeck } );
  } catch ( error ) {
    console.error( 'Errore import mazzo:', error );
    res.status( 500 ).json( { error: 'Errore import mazzo' } );
  }
} );

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
      const existingDeck = decks.find( d => d.id === newDeck.id );
      const mergedDeck = normalizeDeck( {
        ...existingDeck,
        ...newDeck,
        createdAt: existingDeck?.createdAt || newDeck.createdAt || Date.now(),
        updatedAt: Date.now(),
        votes: existingDeck?.votes || [],
        importsCount: existingDeck?.importsCount || 0
      } );
      decks = decks.map( d => d.id === newDeck.id ? mergedDeck : d );
      writeDecks( decks );
      return res.json( mergedDeck );
    } else {
      // Nuovo mazzo
      const normalizedDeck = normalizeDeck( {
        ...newDeck,
        id: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        votes: [],
        importsCount: 0
      } );
      decks.push( normalizedDeck );
      writeDecks( decks );
      return res.json( normalizedDeck );
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

    writeDecks( decks );
    res.json( { message: 'Mazzo eliminato con successo.' } );
  } catch ( error ) {
    res.status( 500 ).json( { error: 'Errore eliminazione mazzo' } );
  }
} );

app.delete( '/api/decks/user/:username', ( req, res ) => {
  try {
    const { username } = req.params;
    let decks = readDecks();
    decks = decks.filter( d => d.creator !== username );
    writeDecks( decks );

    res.json( { message: `Tutti i mazzi di ${username} rimossi con successo.` } );
  } catch ( error ) {
    res.status( 500 ).json( { error: 'Errore durante la pulizia dei dati mazzi' } );
  }
} );


const PORT = process.env.PORT || 3000;
app.listen( PORT, '0.0.0.0', () => {
  console.log( `[Punto Zero] Backend Server in ascolto sulla porta ${PORT}` );
} );
