import express from 'express';
import { check } from 'express-validator';
import { validate } from '../middleware/validatorMiddleware';
import { 
  getDecks, 
  getPublicDecks, 
  saveDeck, 
  deleteDeck, 
  voteDeck, 
  importDeck,
  deleteUserDecks,
  getDeckById
} from '../controllers/deckController';
import { protect, optionalProtect } from '../middleware/authMiddleware';

/**
 * Deck Routes (TypeScript).
 * 
 * Orchestrates the secure pathways for tactical deck management, 
 * covering personal registries, global sharing, community influence, 
 * and automated replication.
 */

const router = express.Router();

/**
 * Deck Configuration Validation Schema
 * Ensures structural integrity for user-designed deck artifacts.
 */
const saveDeckValidation = [
  check('name', 'Deck designation is mandatory.').notEmpty().trim(),
  check('cards', 'A deck must be an array of energy units (cards).').isArray(),
  check('costruttoreId', 'Architect ID is mandatory and must be a numeric value.').notEmpty().isNumeric(),
  validate
];

/**
 * @route   GET /api/v1/decks
 * @desc    Fetch decks with optional ownership filtering
 * @access  Private/Protected
 */
router.get('/', protect, getDecks);

/**
 * @route   GET /api/v1/decks/public
 * @desc    Retrieve all globally shared public decks
 * @access  Public
 */
router.get('/public', getPublicDecks);

/**
 * @route   GET /api/v1/decks/:id
 * @desc    Retrieve specific deck synchronization data
 * @access  Mixed (Optional Protection)
 */
router.get('/:id', optionalProtect, getDeckById);

/**
 * @route   POST /api/v1/decks
 * @desc    Persist or Update a deck entity
 * @access  Private/Protected
 */
router.post('/', protect, saveDeckValidation, saveDeck);

/**
 * @route   DELETE /api/v1/decks/:id
 * @desc    Decommission a specific deck artifact
 * @access  Private/Protected
 */
router.delete('/:id', protect, deleteDeck);

/**
 * @route   POST /api/v1/decks/:id/vote
 * @desc    Register engagement influence on a public deck
 * @access  Private/Protected
 */
router.post('/:id/vote', protect, voteDeck);

/**
 * @route   POST /api/v1/decks/:id/import
 * @desc    Replicate a public deck into personal registry
 * @access  Private/Protected
 */
router.post('/:id/import', protect, importDeck);

/**
 * @route   DELETE /api/v1/decks/user/:username
 * @desc    Wipe all deck artifacts attributed to a user registry
 * @access  Private/Protected
 */
router.delete('/user/:username', protect, deleteUserDecks);

export default router;
