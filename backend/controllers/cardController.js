const { getCachedCards } = require('../services/cardService');
const logger = require('../config/logger');

// @desc    Get all cards (Cached)
// @route   GET /api/v1/cards
// @access  Public
const getAllCards = async (req, res) => {
  try {
    const cards = await getCachedCards();
    res.json(cards);
  } catch (error) {
    logger.error(`ERRORE_CARDS_LIST: ${error.message}`);
    res.status(500).json({ error: 'Errore durante la sincronizzazione della Matrice Dati.' });
  }
};

module.exports = {
  getAllCards,
};
