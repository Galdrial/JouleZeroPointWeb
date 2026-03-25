const express = require( 'express' );
const { OpenAI } = require( 'openai' );
const axios = require( 'axios' );
const router = express.Router();

const MAX_MESSAGE_LENGTH = Number( process.env.CHAT_MAX_MESSAGE_LENGTH || 1200 );
const RATE_LIMIT_WINDOW_MS = Number( process.env.CHAT_RATE_WINDOW_MS || 60_000 );
const RATE_LIMIT_MAX_REQUESTS = Number( process.env.CHAT_RATE_MAX_REQUESTS || 12 );
const chatRateBuckets = new Map();

const openai = new OpenAI( { apiKey: process.env.OPENAI_API_KEY } );
let ASSISTANT_ID = process.env.ASSISTANT_ID;

function getRateKey( req ) {
  const userHeader = ( req.headers['x-user'] || '' ).toString().trim().toLowerCase();
  if ( userHeader ) return `user:${userHeader}`;
  return `ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
}

function isRateLimited( req ) {
  const now = Date.now();
  const key = getRateKey( req );
  const bucket = chatRateBuckets.get( key );

  if ( !bucket || now - bucket.startedAt >= RATE_LIMIT_WINDOW_MS ) {
    chatRateBuckets.set( key, { startedAt: now, count: 1 } );
    return false;
  }

  if ( bucket.count >= RATE_LIMIT_MAX_REQUESTS ) {
    return true;
  }

  bucket.count += 1;
  return false;
}

function pruneRateBuckets() {
  const now = Date.now();
  for ( const [key, bucket] of chatRateBuckets.entries() ) {
    if ( now - bucket.startedAt >= RATE_LIMIT_WINDOW_MS ) {
      chatRateBuckets.delete( key );
    }
  }
}

// Estrazione carte precisa — ricerca per Nome, poi Tipo/Ruolo, poi statistiche numeriche
async function queryCardsFromDatabase( query ) {
  try {
    const response = await axios.get( `http://localhost:${process.env.PORT || 3000}/api/cards` );
    const cards = response.data;

    const q = query.toLowerCase().trim();
    const keywords = q.split( ' ' ).filter( k => k.length > 2 );

    // PASS 1: ricerca rigorosa per nome — tutte le parole devono comparire nel nome
    let results = cards.filter( c => {
      if ( !c.name ) return false;
      return keywords.every( k => c.name.toLowerCase().includes( k ) );
    } );

    // PASS 2: se nessuna carta trovata per nome, cerca per Tipo o Ruolo (es. "Anomalia", "Gas")
    if ( results.length === 0 ) {
      results = cards.filter( c => {
        const typeMatch = keywords.some( k => ( c.type || '' ).toLowerCase().includes( k ) );
        const roleMatch = keywords.some( k => ( c.role || '' ).toLowerCase().includes( k ) );
        return typeMatch || roleMatch;
      } );
    }

    // PASS 3: ricerca per statistiche numeriche (es. "pep 6", "rp 4", "costo 3", "et 5")
    if ( results.length === 0 ) {
      const numMatch = q.match( /(\d+)/ );
      const num = numMatch ? parseInt( numMatch[1] ) : null;
      if ( num !== null ) {
        const isPep = q.includes( 'pep' ) || q.includes( 'attacco' );
        const isRp = q.includes( ' rp' ) || q.includes( 'difesa' ) || q.includes( 'resistenza' );
        const isEt = q.includes( ' et' ) || q.includes( 'costo' ) || q.includes( 'energia' );
        results = cards.filter( c => {
          if ( isPep ) return c.pep === num;
          if ( isRp ) return c.rp === num;
          if ( isEt ) return c.cost_et === num;
          return false;
        } );
      }
    }

    // PASS 4: ricerca nel testo degli Effetti (es. "passato", "inversione", "it")
    if ( results.length === 0 ) {
      results = cards.filter( c => {
        const effect = ( c.effect || '' ).toLowerCase();
        return keywords.some( k => effect.includes( k ) );
      } );
    }

    if ( results.length === 0 ) return `ERRORE: Nessuna carta trovata per "${query}". Non inventare i valori, avvisa il Costruttore.`;

    const formatted = results.map( c => ( {
      Nome: c.name,
      Tipo: c.type,
      Stato: c.status,
      "Costo_ET": c.cost_et,
      "Attacco_PEP": c.pep,
      "Difesa_RP": c.rp,
      Effetto: c.effect
    } ) );
    return `TOTALE_TROVATE: ${results.length}\n` + JSON.stringify( formatted );
  } catch ( error ) {
    console.error( "Errore queryCardsFromDatabase:", error );
    return "Fallimento di rete locale. Database Frammenti irraggiungibile dal Terminale.";
  }
}

router.post( '/chat', async ( req, res ) => {
  pruneRateBuckets();
  if ( isRateLimited( req ) ) {
    return res.status( 429 ).json( { error: 'Troppe richieste ravvicinate. Attendi qualche secondo.' } );
  }

  const { message, threadId } = req.body;

  if ( typeof message !== 'string' || !message.trim() ) {
    return res.status( 400 ).json( { error: 'Messaggio non valido.' } );
  }

  if ( message.length > MAX_MESSAGE_LENGTH ) {
    return res.status( 400 ).json( { error: `Messaggio troppo lungo (max ${MAX_MESSAGE_LENGTH} caratteri).` } );
  }

  if ( threadId && typeof threadId !== 'string' ) {
    return res.status( 400 ).json( { error: 'Thread non valido.' } );
  }

  // Reload ASSISTANT_ID in case it was written to .env after the server started
  if ( !ASSISTANT_ID ) {
    require( 'dotenv' ).config();
    ASSISTANT_ID = process.env.ASSISTANT_ID;
  }

  if ( !ASSISTANT_ID ) {
    return res.status( 500 ).json( { error: "SISTEMA OFFLINE: Terminale non ancora inizializzato (ASSISTANT_ID mancante)." } );
  }

  try {
    let currentThreadId = threadId;

    // Gestione della sessione di chat aperta
    if ( !currentThreadId ) {
      const thread = await openai.beta.threads.create();
      currentThreadId = thread.id;
    }

    // Aggiungi il messaggio dell'utente
    await openai.beta.threads.messages.create( currentThreadId, {
      role: "user",
      content: message
    } );

    // Avvia l'esecuzione analitica dell'Oracolo
    let run = await openai.beta.threads.runs.createAndPoll( currentThreadId, {
      assistant_id: ASSISTANT_ID
    } );

    // Loop per intercettare le Tool Calls (Ad esempio: `search_cards`)
    while ( run.status === 'requires_action' ) {
      const toolOutputs = [];
      const requiredActions = run.required_action.submit_tool_outputs.tool_calls;

      for ( const action of requiredActions ) {
        if ( action.function.name === 'search_cards' ) {
          let args = {};
          try {
            args = JSON.parse( action.function.arguments || '{}' );
          } catch {
            args = {};
          }
          console.log( `[Terminale AI] L'IA richiede un accesso diretto al DB in ricerca di: "${args.query}"` );
          const safeQuery = typeof args.query === 'string' ? args.query.slice( 0, 200 ) : '';
          const resultData = await queryCardsFromDatabase( safeQuery );

          toolOutputs.push( {
            tool_call_id: action.id,
            output: resultData
          } );
        }
      }

      // Invia alla rete Neurale i referti estratti dal Database Node.js Live
      run = await openai.beta.threads.runs.submitToolOutputsAndPoll( run.id, {
        thread_id: run.thread_id,
        tool_outputs: toolOutputs
      } );
    }

    if ( run.status === 'completed' ) {
      const messages = await openai.beta.threads.messages.list( currentThreadId );
      const lastMessage = messages.data.filter( m => m.role === 'assistant' )[0];
      const assistantReply = lastMessage.content[0].text.value;

      res.json( {
        reply: assistantReply,
        threadId: currentThreadId
      } );
    } else {
      console.error( "DEBUG FATALE - Run non completata. Stato:", run.status, "Errore:", run.last_error );
      res.status( 500 ).json( { error: `Anomalia fatale Oracolo (Status: ${run.status})` } );
    }

  } catch ( error ) {
    console.error( "Errore AI API Endpoint:", error );
    res.status( 500 ).json( { error: "Interferenza Quantica. L'Oracolo Temporale non risponde." } );
  }
} );

module.exports = router;
