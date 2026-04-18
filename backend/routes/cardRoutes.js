const express = require('express');
const router = express.Router();
const { getAllCards } = require('../controllers/cardController');
const { syncCards } = require('../services/cardSyncService');
const { clearCache } = require('../services/cardService');
const logger = require('../config/logger');

/**
 * @route   GET /api/v1/cards
 * @desc    Retrieve the full card database matrix
 * @access  Public
 * @protocol Interacts with the card controller and its internal caching layer.
 */
router.get('/', getAllCards);

/**
 * @route   POST /api/v1/cards/sync-webhook
 * @desc    Triggers a manual synchronization between Google Sheets and MongoDB Atlas
 * @access  Private (Admin Key Required)
 */
router.post('/sync-webhook', async (req, res) => {
    const adminKey = req.headers['x-admin-key'];

    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
        logger.warn('SYNC_WEBHOOK_WARNING: Unauthorized synchronization attempt blocked.');
        return res.status(401).json({ success: false, message: 'Invalid Admin Key' });
    }

    try {
        const result = await syncCards();
        clearCache(); // Purge cache to reflect changes immediately
        res.json({ 
            success: true, 
            message: 'Synchronization protocol completed successfully.',
            details: result 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
