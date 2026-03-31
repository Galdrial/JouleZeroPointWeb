const express = require('express');
const router = express.Router();
const { getAllCards } = require('../controllers/cardController');

/**
 * @route   GET /api/v1/cards
 * @desc    Retrieve the full card database matrix
 * @access  Public
 * @protocol Interacts with the card controller and its internal caching layer.
 */
router.get('/', getAllCards);

module.exports = router;
