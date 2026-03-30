const express = require('express');
const router = express.Router();
const { getAllCards } = require('../controllers/cardController');

// Public routes
router.get('/', getAllCards);

module.exports = router;
