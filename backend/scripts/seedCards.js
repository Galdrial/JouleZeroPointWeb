const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Detect environment: Docker production vs local development
const isDocker = __dirname.includes('/app/scripts');
const basePath = isDocker ? '../dist' : '..';

// Load modules with compatibility for TypeScript default exports
const cardSyncModule = require(`${basePath}/services/cardSyncService`);
const loggerModule = require(`${basePath}/config/logger`);

const syncCards = cardSyncModule.syncCards || (cardSyncModule.default && cardSyncModule.default.syncCards);
const logger = loggerModule.default || loggerModule;

/**
 * Manual Seeding Script.
 * Centralized tool to populate the database with core game cards.
 * Designed to work seamlessly in containerized environments.
 */
const seed = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not defined in .env file.');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('SEED_SCRIPT: Quantum Channel established for manual seeding.');

        if (typeof syncCards !== 'function') {
            throw new Error('syncCards function not found in services.');
        }

        const result = await syncCards();
        
        logger.info(`SEED_SCRIPT: Manual synchronization successful. Updated/Modified: ${result.updated}/${result.total}`);
        process.exit(0);
    } catch (error) {
        if (logger && logger.error) {
            logger.error(`SEED_SCRIPT_FAILURE: ${error.message}`);
        } else {
            console.error(`SEED_SCRIPT_FAILURE: ${error.message}`);
        }
        process.exit(1);
    }
};

seed();
