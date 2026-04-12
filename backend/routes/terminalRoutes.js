/**
 * Terminal Routes: HTTP handler for the Punto Zero Terminal.
 * 
 * Exclusive responsibility: HTTP request/response handling, authentication,
 * data retrieval from the database, SSE formatting, and message persistence.
 * 
 * AI logic (prompting, OpenAI calls, tool calling) is fully delegated
 * to the aiService module, preserving separation of concerns.
 */

const express = require( 'express' );
const router = express.Router();
const Card = require( '../models/Card' );
const Message = require( '../models/Message' );
const User = require( '../models/User' );
const logger = require( '../config/logger' );
const { isLikelyInjection, buildPromptMessages, streamChat } = require( '../services/aiService' );

// Operational limits for incoming transmissions
const MAX_MESSAGE_LENGTH = Number( process.env.CHAT_MAX_MESSAGE_LENGTH || 1200 );

/**
 * POST /chat — AI dialogue endpoint.
 * 
 * Request lifecycle:
 * 1. Input validation and sanitization
 * 2. Optional user authentication and history retrieval
 * 3. Delegation to AI service for prompt building and streaming
 * 4. Response formatting as Server-Sent Events (SSE)
 * 5. Conversation persistence for authenticated users
 */
router.post( '/chat', async ( req, res ) => {
  const { message, gameState } = req.body;
  const usernameHeader = req.headers['x-user'];

  // --- 1. Input validation ---
  if ( !message ) {
    return res.status( 400 ).json( { error: 'Direttiva di input mancante.' } );
  }

  if ( message.length > MAX_MESSAGE_LENGTH ) {
    return res.status( 400 ).json( { error: `Direttiva troppo lunga (max ${MAX_MESSAGE_LENGTH} caratteri).` } );
  }

  // --- 2. SSE protocol initialization ---
  res.setHeader( 'Content-Type', 'text/event-stream' );
  res.setHeader( 'Cache-Control', 'no-cache' );
  res.setHeader( 'Connection', 'keep-alive' );

  // --- 3. Security: Prompt injection detection ---
  if ( isLikelyInjection( message ) ) {
    logger.warn( `INJECTION_BLOCKED: IP=${req.ip} | Input="${message.substring( 0, 80 )}..."` );
    res.write( `data: ${JSON.stringify( { type: 'content', content: "⚠️ Anomalia rilevata nel flusso temporale. Accesso alle funzioni di sistema negato. Sono l'Assistente Joule e sono qui per spiegare le regole del gioco." } )}\n\n` );
    res.write( `data: ${JSON.stringify( { type: 'done' } )}\n\n` );
    return res.end();
  }

  try {
    // --- 4. Authentication and user context ---
    let userRecord = null;
    let userIdentity = "Costruttore Ignoto";
    let historyMessages = [];

    const totalCards = await Card.countDocuments();

    if ( usernameHeader ) {
      const normalizedUsername = usernameHeader.trim().toLowerCase();
      userRecord = await User.findOne( { username: normalizedUsername } );

      if ( userRecord ) {
        userIdentity = userRecord.usernameDisplay || userRecord.username;

        // Retrieve and sanitize history
        const history = await Message.find( { userId: userRecord._id } )
          .sort( { timestamp: -1 } )
          .limit( 15 );

        const filteredHistory = history.filter( m =>
          !m.content.includes( "Anomalia rilevata" ) &&
          !m.content.includes( "Accesso alle funzioni di sistema negato" ) &&
          !m.content.includes( "non posso ricordare" )
        ).slice( 0, 8 );

        historyMessages = filteredHistory.reverse().map( m => ( {
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        } ) );
      }
    }

    // --- 5. Delegate to AI service ---
    // The route handler builds context; the AI service manages prompting and provider calls
    const promptMessages = buildPromptMessages( {
      userMessage: message,
      userRecord,
      userIdentity,
      historyMessages,
      totalCards,
      gameState
    } );

    // --- 6. SSE streaming ---
    // The route handler maps AI service callbacks to SSE events for the frontend
    const fullContent = await streamChat(
      promptMessages,
      // onDelta: each text chunk is sent as an SSE event
      ( delta ) => {
        res.write( `data: ${JSON.stringify( { type: 'content', content: delta } )}\n\n` );
      },
      // onDone: notify the client that streaming is complete
      () => {
        res.write( `data: ${JSON.stringify( { type: 'done' } )}\n\n` );
      },
      // onError: send a structured error to the client
      ( errorObj ) => {
        res.write( `data: ${JSON.stringify( {
          type: 'error',
          category: errorObj.category,
          message: errorObj.message
        } )}\n\n` );
      }
    );

    // --- 7. Conversation persistence ---
    if ( userRecord && fullContent ) {
      await Message.create( [
        { userId: userRecord._id, role: 'user', content: message },
        { userId: userRecord._id, role: 'assistant', content: fullContent }
      ] );
    }

    res.end();

  } catch ( error ) {
    logger.error( `TERMINAL_HANDLER_ERROR: ${error.message}` );
    res.write( `data: ${JSON.stringify( { type: 'error', message: "Canale di comunicazione interrotto." } )}\n\n` );
    res.end();
  }
} );

module.exports = router;
