const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware di base
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// --- 1. CORAZZATURA SECURITY (Sincronizzata per Express 5) ---
// Helmet: Nasconde header e attiva CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https:*"], // Permette immagini esterne (Carte)
      "script-src": ["'self'", "'unsafe-inline'"], // Permette script inline necessari
    },
  },
}));

// Custom NoSQL Sanitize per Express 5 (Sincronizzazione Atomica)
app.use((req, res, next) => {
  const deepSanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (key.startsWith('$')) {
          delete obj[key];
        } else if (obj[key] && typeof obj[key] === 'object') {
          // Ricorsione limitata per prevenire stack overflow su dataset giganti
          deepSanitize(obj[key]);
        }
      });
    }
    return obj;
  };
  
  // Sanifichiamo prima gli ingressi leggeri (query e params)
  if (req.query) deepSanitize(req.query);
  if (req.params) deepSanitize(req.params);
  // Sanifichiamo il body solo se presente (es. salvataggio mazzo)
  if (req.body && Object.keys(req.body).length < 1000) {
    deepSanitize(req.body);
  }
  next();
});

app.use(hpp()); 

// Rate Limiter: 100 richieste ogni 15 minuti per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Troppe richieste dalla tua posizione galattica (IP). Riprova tra 15 minuti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Healthy Check Sensor (Sintonia Operativa)
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ 
    status: 'OPERATIVO', 
    timestamp: new Date().toISOString(),
    service: 'punto-zero-core'
  });
});

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
