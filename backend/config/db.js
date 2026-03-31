const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Atlas Database Connection Handler.
 * Orchestrates the persistent Quantum Channel with the MongoDB cluster.
 * Configures connection pooling and timeout thresholds for industrial-grade stability.
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info(`DATABASE_SYNC: Quantum Channel established with MongoDB at: ${conn.connection.host}`);

        // Runtime Lifecycle Monitoring: Intercept signal drops
        mongoose.connection.on('disconnected', () => {
            logger.warn('DATABASE_WARNING: Atlas synchronization lost. Attempting reconnection protocol...');
        });

        // Error Interception: Capture and log deep-channel anomalies
        mongoose.connection.on('error', (err) => {
            logger.error(`DATABASE_CRITICAL: Quantum Channel anomaly detected: ${err.message}`);
        });

    } catch (error) {
        // Critical Failure: System cannot operate without a valid data signal
        logger.error(`DATABASE_ERROR: Initial synchronization failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
