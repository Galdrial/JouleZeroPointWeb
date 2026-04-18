import express, { Request, Response } from 'express';
import { getAllCards } from '../controllers/cardController';
import { syncCards } from '../services/cardSyncService';
import { clearCache } from '../services/cardService';
import logger from '../config/logger';

/**
 * Card Routes (TypeScript).
 * 
 * Orchestrates the secure pathways for card catalog retrieval and
 * administrative synchronization with the external Data Matrix.
 */

const router = express.Router();

/**
 * @route   GET /api/v1/cards
 * @desc    Retrieve the full card database matrix
 * @access  Public
 */
router.get('/', getAllCards);

/**
 * @route   POST /api/v1/cards/sync-webhook
 * @desc    Triggers a manual synchronization between Google Sheets and MongoDB Atlas
 * @access  Private (Admin Key Required)
 */
router.post('/sync-webhook', async (req: Request, res: Response) => {
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
        res.status(500).json({ success: false, message: (error as Error).message });
    }
});

export default router;
