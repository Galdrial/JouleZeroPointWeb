const express = require('express');
const router = express.Router();
const { 
  getDecks, 
  getPublicDecks, 
  saveDeck, 
  deleteDeck, 
  voteDeck, 
  importDeck,
  deleteUserDecks,
  getDeckById,
  exportDeck
} = require('../controllers/deckController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

// Mixed access routes
router.get('/', optionalProtect, getDecks);
router.get('/public', getPublicDecks);
router.get('/:id', optionalProtect, getDeckById);
router.get('/:id/export', optionalProtect, exportDeck);

// Protected routes
router.post('/', protect, saveDeck);
router.delete('/:id', protect, deleteDeck);
router.post('/:id/vote', protect, voteDeck);
router.post('/:id/import', protect, importDeck);
router.delete('/user/:username', protect, deleteUserDecks);

module.exports = router;
