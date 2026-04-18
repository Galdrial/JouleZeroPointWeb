import Card, { ICard } from '../models/Card';
import NodeCache from 'node-cache';
import logger from '../config/logger';

/**
 * Enterprise Card Retrieval Service (TypeScript).
 * 
 * High-performance data access layer that balances MongoDB Atlas queries 
 * with a reliable caching strategy to ensure minimal latency for card discovery.
 */

// Cache strategy: TTL set to 600 seconds (10 minutes) for DB results.
const cardsCache = new NodeCache({ stdTTL: 600 });
const CACHE_KEY = 'all_cards_db';

/**
 * Retrieves all card records, utilizing the cache to reduce database load.
 * 
 * @async
 * @returns A promise resolving to the collection of cards.
 */
export const getCachedCards = async (): Promise<ICard[]> => {
    const cachedData = cardsCache.get<ICard[]>(CACHE_KEY);
    if (cachedData) {
        logger.debug('VIGIL_SYSTEM: Retrieving cards from database cache.');
        return cachedData;
    }

    try {
        logger.info('VIGIL_SYSTEM: Fetching master card records from MongoDB Atlas.');
        // Retrieve cards sorted by cardId for consistent UI presentation
        const cards = await Card.find().sort({ cardId: 1 });
        
        cardsCache.set(CACHE_KEY, cards);
        return cards;
    } catch (error) {
        logger.error(`VIGIL_SYSTEM_ERROR: Database retrieval failure: ${(error as Error).message}`);
        throw new Error('Unable to retrieve cards from the master database.');
    }
};

/**
 * Purges the card cache manually.
 */
export const clearCache = (): void => {
    logger.info('VIGIL_SYSTEM: Card cache purged manually.');
    cardsCache.del(CACHE_KEY);
};
