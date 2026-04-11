const express = require('express');
const router = express.Router();
const { downloadRules } = require('../controllers/rulesController');

/**
 * @route   GET /api/v1/rules/download
 * @desc    Export the official game rules to a PDF document
 * @access  Public
 */
router.get('/download', downloadRules);

module.exports = router;
