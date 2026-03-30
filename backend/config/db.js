const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Options are simplified in modern Mongoose (v6+)
        });

        logger.info(`DATABASE_SYNC: Canale Quantico stabilito con MongoDB: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`ERRORE_DATABASE: Sincronizzazione fallita: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
