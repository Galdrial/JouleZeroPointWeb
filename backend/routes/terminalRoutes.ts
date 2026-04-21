import express, { Request, Response } from 'express';
import Card from '../models/Card';
import Message from '../models/Message';
import logger from '../config/logger';
import { optionalProtect } from '../middleware/authMiddleware';
import { isLikelyInjection, buildPromptMessages, streamChat } from '../services/aiService';

/**
 * Terminal Routes (TypeScript).
 * 
 * Orchestrates the secure pathways for the Punto Zero Terminal (AI Assistant).
 * Manages SSE streaming, prompt injection detection, and conversation persistence.
 */

const router = express.Router();

// Operational limits for incoming transmissions
const MAX_MESSAGE_LENGTH = Number(process.env.CHAT_MAX_MESSAGE_LENGTH || 1200);

/**
 * POST /chat — AI dialogue endpoint.
 * 
 * Response formatting: Server-Sent Events (SSE).
 */
router.post('/chat', optionalProtect, async (req: Request, res: Response) => {
  const { message, gameState } = req.body;

  // --- 1. Input validation ---
  if (!message) {
    return res.status(400).json({ error: 'Direttiva di input mancante.' });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Direttiva troppo lunga (max ${MAX_MESSAGE_LENGTH} caratteri).` });
  }

  // --- 2. SSE protocol initialization ---
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // --- 3. Security: Prompt injection detection ---
  if (isLikelyInjection(message)) {
    logger.warn(`INJECTION_BLOCKED: IP=${req.ip} | Input="${message.substring(0, 80)}..."`);
    res.write(`data: ${JSON.stringify({ type: 'content', content: "⚠️ Anomalia rilevata nel flusso temporale. Accesso alle funzioni di sistema negato. Sono l'Assistente Joule e sono qui per spiegare le regole del gioco." })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    return res.end();
  }

  try {
    // --- 4. User context (optional: anonymous users get a default identity) ---
    const userRecord = req.user || null;
    const userIdentity = userRecord
      ? (userRecord.usernameDisplay || userRecord.username)
      : 'Costruttore Ignoto';

    const totalCards = await Card.countDocuments();

    let historyMessages: { role: 'user' | 'assistant', content: string }[] = [];

    if (userRecord) {
      // Retrieve and sanitize history (Last 15 messages)
      const history = await Message.find({ userId: userRecord._id })
        .sort({ timestamp: -1 })
        .limit(15);

      // Filter out system warnings and specific AI limitations from context
      const filteredHistory = history.filter(m =>
        !m.content.includes("Anomalia rilevata") &&
        !m.content.includes("Accesso alle funzioni di sistema negato") &&
        !m.content.includes("non posso ricordare")
      ).slice(0, 8);

      historyMessages = filteredHistory.reverse().map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));
    }

    // --- 5. Delegate to AI service ---
    const promptMessages = buildPromptMessages({
      userMessage: message,
      userRecord,
      userIdentity,
      historyMessages,
      totalCards,
      gameState
    });

    // --- 6. SSE streaming ---
    const fullContent = await streamChat(
      promptMessages,
      (delta) => {
        res.write(`data: ${JSON.stringify({ type: 'content', content: delta })}\n\n`);
      },
      () => {
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      },
      (errorObj) => {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          category: errorObj.category,
          message: errorObj.message
        })}\n\n`);
      }
    );

    // --- 7. Conversation persistence (only for authenticated users) ---
    if (userRecord && fullContent) {
      await Message.create([
        { userId: userRecord._id, role: 'user', content: message },
        { userId: userRecord._id, role: 'assistant', content: fullContent }
      ]);
    }

    res.end();

  } catch (error) {
    logger.error(`TERMINAL_HANDLER_ERROR: ${(error as Error).message}`);
    res.write(`data: ${JSON.stringify({ type: 'error', message: "Canale di comunicazione interrotto." })}\n\n`);
    res.end();
  }
});

export default router;
