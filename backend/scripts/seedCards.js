const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { syncCards } = require('../services/cardSyncService');
const logger = require('../config/logger');

/**
 * Manual Seeding Script.
 * Now leverages the centralized cardSyncService to ensure consistency across all sync triggers.
 */
const seed = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI non definita nel file .env.');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('SEED_SCRIPT: Quantum Channel established for manual seeding.');

        const result = await syncCards();
        
        logger.info(`SEED_SCRIPT: Manual synchronization successful. Updated/Modified: ${result.updated}/${result.total}`);
        process.exit(0);
    } catch (error) {
        logger.error(`SEED_SCRIPT_FAILURE: ${error.message}`);
        process.exit(1);
    }
};

seed();
