import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { sendContactMessage } from '../services/emailService';
import logger from '../config/logger';

/**
 * Handles incoming contact form submissions from the frontend.
 */
export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Contact Form validation failed: ${JSON.stringify(errors.array())}`);
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { name, email, subject, message } = req.body;

  try {
    // Attempt to dispatch the email via the emailService
    await sendContactMessage(name, email, subject, message);
    
    res.status(200).json({ message: 'Segnale criptato trasmesso con successo.' });
  } catch (error) {
    logger.error(`Failed to process contact form submission: ${(error as Error).message}`);
    res.status(500).json({ error: 'Errore durante la trasmissione del segnale. Riprovare più tardi.' });
  }
};
