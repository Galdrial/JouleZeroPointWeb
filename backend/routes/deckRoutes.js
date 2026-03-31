const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { validate } = require('../middleware/validatorMiddleware');
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

// Validazione Salvataggio Mazzi
const saveDeckValidation = [
  check('name', 'Il nome del mazzo è obbligatorio.').notEmpty().trim(),
  check('cards', 'Il mazzo deve essere un array di unità energetiche (carte).').isArray(),
  check('costruttoreId', 'L\'ID del costruttore deve essere un valore numerico.').isNumeric(),
  validate
];

// Mixed access routes
router.get('/', optionalProtect, getDecks);
router.get('/public', getPublicDecks);
router.get('/:id', optionalProtect, getDeckById);
router.get('/:id/export', optionalProtect, exportDeck);

// Protected routes
router.post('/', protect, saveDeckValidation, saveDeck);
router.delete('/:id', protect, deleteDeck);
router.post('/:id/vote', protect, voteDeck);
router.post('/:id/import', protect, importDeck);
router.delete('/user/:username', protect, deleteUserDecks);

module.exports = router;
