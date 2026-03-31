const { getCachedCards } = require('../services/cardService');
const logger = require('../config/logger');

/**
 * @desc    Retrieve all cards using the internal caching service
 * @route   GET /api/v1/cards
 * @access  Public
 * @protocol Streamlined data extraction to minimize database hits for optimal performance.
 */
const getAllCards = async (req, res) => {
  try {
    const cards = await getCachedCards();
    res.json(cards);
  } catch (error) {
    logger.error(`CARDS_LIST_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Error during data matrix synchronization.' });
  }
};

module.exports = {
  getAllCards,
};
