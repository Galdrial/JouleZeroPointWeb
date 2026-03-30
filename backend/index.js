const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');

// Inizializza Database
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`[PUNTO ZERO] Nucleo Operativo stabile sulla porta ${PORT} [Mode: ${process.env.NODE_ENV}]`);
});
