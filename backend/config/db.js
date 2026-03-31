const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info(`DATABASE_SYNC: Canale Quantico stabilito con MongoDB: ${conn.connection.host}`);

        mongoose.connection.on('disconnected', () => {
            logger.warn('DATABASE_WARNING: Sincronia Atlas persa. Tentativo di riconnessione...');
        });

        mongoose.connection.on('error', (err) => {
            logger.error(`DATABASE_CRITICAL: Errore nel Canale Quantico: ${err.message}`);
        });

    } catch (error) {
        logger.error(`ERRORE_DATABASE: Sincronizzazione fallita: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
