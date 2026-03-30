const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');

const app = express();

// Middleware di base
app.use(cors());
app.use(express.json());

// Log delle richieste (Solo in sviluppo)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });
}

// Routes Import
const authRoutes = require('./routes/authRoutes');
const newsRoutes = require('./routes/newsRoutes');
const deckRoutes = require('./routes/deckRoutes');
const cardRoutes = require('./routes/cardRoutes');
const chatbotRoutes = require('./chatbot'); // Keeping this as a separate file but mounting on v1

// Mounting Routes (V1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/decks', deckRoutes);
app.use('/api/v1/cards', cardRoutes);
app.use('/api/v1/terminal', chatbotRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  logger.error(`ERRORE_SISTEMA: ${err.message}\n${err.stack}`);
  
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? 'Ø' : err.stack,
  });
});

module.exports = app;
