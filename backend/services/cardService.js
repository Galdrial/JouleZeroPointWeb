const Card = require('../models/Card');
const NodeCache = require('node-cache');
const logger = require('../config/logger');

// Cache strategy: TTL set to 600 seconds (10 minutes) for DB results.
const cardsCache = new NodeCache({ stdTTL: 600 });
const CACHE_KEY = 'all_cards_db';

/**
 * Enterprise Card Retrieval Service.
 * High-performance data access layer that balances MongoDB Atlas queries with the Quantum Cache.
 * 
 * @async
 * @returns {Promise<Array<Object>>} - The synchronized collection of cards from the database.
 */
const getCachedCards = async () => {
    const cachedData = cardsCache.get(CACHE_KEY);
    if (cachedData) {
        logger.debug('VIGIL_SYSTEM: Retrieving cards from database cache.');
        return cachedData;
    }

    try {
        logger.info('VIGIL_SYSTEM: Fetching master card records from MongoDB Atlas.');
        // Retrieve cards sorted by cardId for consistent UI presentation
        // Removed .lean() to allow virtuals (like 'id') to be computed correctly for the frontend
        const cards = await Card.find().sort({ cardId: 1 });
        
        cardsCache.set(CACHE_KEY, cards);
        return cards;
    } catch (error) {
        logger.error(`VIGIL_SYSTEM_ERROR: Database retrieval failure: ${error.message}`);
        throw new Error('Unable to retrieve cards from the master database.');
    }
};

module.exports = {
    getCachedCards,
    clearCache: () => {
        logger.info('VIGIL_SYSTEM: Quantum Cache purged (Manually triggered).');
        cardsCache.del(CACHE_KEY);
    }
};
