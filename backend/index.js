const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const initCleanupTask = require('./tasks/cleanupTask');
const mongoose = require('mongoose');

// --- 1. VALIDAZIONE AMBIENTALE ---
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'NODE_ENV'];
const missingEnv = REQUIRED_ENV.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
  logger.error(`CRITICAL_FAILURE: Variabili d'ambiente mancanti nel segnale: ${missingEnv.join(', ')}`);
  process.exit(1);
}

// Inizializza Database
connectDB();

// Inizializza Task di Bonifica
initCleanupTask();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`[PUNTO ZERO] Nucleo Operativo stabile sulla porta ${PORT} [Mode: ${process.env.NODE_ENV}]`);
});

// --- 2. GRACEFUL SHUTDOWN (Protocollo Ibernazione) ---
const shutdown = async (signal) => {
  logger.info(`${signal} RILEVATO: Avvio protocollo di ibernazione professionale...`);
  
  server.close(() => {
    logger.info('[PUNTO ZERO] Flusso API interrotto. Chiusura connessione database...');
    
    mongoose.connection.close(false).then(() => {
      logger.info('[PUNTO ZERO] Canale Quantico con MongoDB chiuso. Matrice spenta.');
      process.exit(0);
    });
  });

  // Forza lo spegnimento dopo 10 secondi se non si chiude correttamente
  setTimeout(() => {
    logger.error('[PUNTO ZERO] Spegnimento forzato: Time-out superato.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

