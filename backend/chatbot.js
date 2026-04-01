/**
 * Terminal Routes: HTTP Handler per il Terminale Punto Zero.
 * 
 * Responsabilità esclusiva: gestione richieste/risposte HTTP, autenticazione,
 * recupero dati dal database, formattazione SSE e persistenza dei messaggi.
 * 
 * La logica AI (prompt, chiamate OpenAI, tool calling) è delegata interamente
 * al servizio aiService, rispettando la separazione delle responsabilità.
 */

const express = require('express');
const router = express.Router();
const Card = require('./models/Card');
const Message = require('./models/Message');
const User = require('./models/User');
const logger = require('./config/logger');
const { isLikelyInjection, buildPromptMessages, streamChat } = require('./services/aiService');

// Limiti operativi per le trasmissioni in ingresso
const MAX_MESSAGE_LENGTH = Number(process.env.CHAT_MAX_MESSAGE_LENGTH || 1200);

/**
 * POST /chat — Endpoint di dialogo con l'IA.
 * 
 * Ciclo di vita della richiesta:
 * 1. Validazione input e sanificazione
 * 2. Autenticazione utente (opzionale) e recupero history
 * 3. Delega al servizio AI per costruzione prompt e streaming
 * 4. Formattazione risposta come Server-Sent Events (SSE)
 * 5. Persistenza della conversazione per utenti autenticati
 */
router.post('/chat', async (req, res) => {
    const { message, gameState } = req.body;
    const usernameHeader = req.headers['x-user'];

    // --- 1. Validazione Input ---
    if (!message) {
        return res.status(400).json({ error: 'Direttiva di input mancante.' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({ error: `Direttiva troppo lunga (max ${MAX_MESSAGE_LENGTH} caratteri).` });
    }

    // --- 2. Inizializzazione protocollo SSE ---
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // --- 3. Sicurezza: Rilevamento Prompt Injection ---
    if (isLikelyInjection(message)) {
        logger.warn(`INJECTION_BLOCKED: IP=${req.ip} | Input="${message.substring(0, 80)}..."`);
        res.write(`data: ${JSON.stringify({ type: 'content', content: "⚠️ Anomalia rilevata nel flusso temporale. Accesso alle funzioni di sistema negato. Sono l'Assistente Joule e sono qui per spiegare le regole del gioco." })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        return res.end();
    }

    try {
        // --- 4. Autenticazione e Contesto Utente ---
        let userRecord = null;
        let userIdentity = "Costruttore Ignoto";
        let historyMessages = [];

        const totalCards = await Card.countDocuments();

        if (usernameHeader) {
            const normalizedUsername = usernameHeader.trim().toLowerCase();
            userRecord = await User.findOne({ username: normalizedUsername });
            
            if (userRecord) {
                userIdentity = userRecord.usernameDisplay || userRecord.username;

                // Recupero history con sanitizzazione
                const history = await Message.find({ userId: userRecord._id })
                    .sort({ timestamp: -1 })
                    .limit(15);
                
                const filteredHistory = history.filter(m => 
                    !m.content.includes("Anomalia rilevata") && 
                    !m.content.includes("Accesso alle funzioni di sistema negato") &&
                    !m.content.includes("non posso ricordare")
                ).slice(0, 8);

                historyMessages = filteredHistory.reverse().map(m => ({ 
                    role: m.role === 'assistant' ? 'assistant' : 'user', 
                    content: m.content 
                }));
            }
        }

        // --- 5. Delega al Servizio AI ---
        // Il route handler costruisce il contesto, il servizio AI gestisce il prompt e il provider
        const promptMessages = buildPromptMessages({
            userMessage: message,
            userRecord,
            userIdentity,
            historyMessages,
            totalCards,
            gameState
        });

        // --- 6. Streaming SSE ---
        // Il route handler traduce i callback del servizio AI in eventi SSE per il frontend
        const fullContent = await streamChat(
            promptMessages,
            // onDelta: ogni frammento di testo viene inviato come evento SSE
            (delta) => {
                res.write(`data: ${JSON.stringify({ type: 'content', content: delta })}\n\n`);
            },
            // onDone: segnala al client che lo stream è completato
            () => {
                res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            },
            // onError: invia un errore strutturato al client
            (errorMsg) => {
                res.write(`data: ${JSON.stringify({ type: 'error', message: errorMsg })}\n\n`);
            }
        );

        // --- 7. Persistenza Conversazione ---
        if (userRecord && fullContent) {
            await Message.create([
                { userId: userRecord._id, role: 'user', content: message },
                { userId: userRecord._id, role: 'assistant', content: fullContent }
            ]);
        }

        res.end();

    } catch (error) {
        logger.error(`TERMINAL_HANDLER_ERROR: ${error.message}`);
        res.write(`data: ${JSON.stringify({ type: 'error', message: "Canale di comunicazione interrotto." })}\n\n`);
        res.end();
    }
});

module.exports = router;
