import { Request, Response } from 'express';
import { getCachedCards } from '../services/cardService';
import logger from '../config/logger';

/**
 * Card Controller (TypeScript).
 * 
 * Manages the retrieval of the card catalog, leveraging the enterprise
 * caching service to ensure optimal performance and minimal latency.
 */

/**
 * @desc    Retrieve all cards using the internal caching service
 * @route   GET /api/v1/cards
 * @access  Public
 */
export const getAllCards = async (req: Request, res: Response) => {
  try {
    const cards = await getCachedCards();
    res.json(cards);
  } catch (error) {
    logger.error(`CARDS_LIST_ERROR: ${(error as Error).message}`);
    res.status(500).json({ error: 'Error during data matrix synchronization.' });
  }
};
