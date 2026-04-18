import express from 'express';
import { downloadRules } from '../controllers/rulesController';

/**
 * Rules Routes (TypeScript).
 * 
 * Orchestrates the public-facing pathway for downloading the official
 * game ruleset as a synthesized PDF artifact.
 */

const router = express.Router();

/**
 * @route   GET /api/v1/rules/download
 * @desc    Export the official game rules to a PDF document
 * @access  Public
 */
router.get('/download', downloadRules);

export default router;
