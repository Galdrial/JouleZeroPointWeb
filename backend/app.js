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

/**
 * --- CORE MIDDLEWARE CONFIGURATION ---
 * Configures Cross-Origin Resource Sharing (CORS) and standard JSON body parsing.
 */
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

/**
 * --- 1. SECURITY ARMOR (Express 5 Synchronized) ---
 * Implements a multi-layered security strategy to protect the Atlas Core.
 */

// Helmet: Security headers orchestration and Content Security Policy (CSP) enforcement.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https:*"], // Allow remote card imagery
      "script-src": ["'self'", "'unsafe-inline'"], // Allow required inline execution
    },
  },
}));

/**
 * Custom NoSQL Sanitization Middleware.
 * Recursively purges '$' prefixed keys from request data to prevent NoSQL injection attacks.
 */
app.use((req, res, next) => {
  const deepSanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (key.startsWith('$')) {
          delete obj[key];
        } else if (obj[key] && typeof obj[key] === 'object') {
          // Limited recursion to optimize performance on large datasets
          deepSanitize(obj[key]);
        }
      });
    }
    return obj;
  };
  
  // Sanitize lightweight inputs (query and params)
  if (req.query) deepSanitize(req.query);
  if (req.params) deepSanitize(req.params);
  // Sanitize payload body if present and of reasonable size
  if (req.body && Object.keys(req.body).length < 1000) {
    deepSanitize(req.body);
  }
  next();
});

// HTTP Parameter Pollution (HPP) protection
app.use(hpp()); 

/**
 * Rate Limiter: Brute-force and Denial-of-Service (DoS) mitigation.
 * Limits each unique IP identifier to 100 requests per 15-minute window.
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from your galactic coordinate (IP). Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

/**
 * Healthy Check Sensor (Operational Synchronia).
 * Exposes a heartbeat endpoint to monitor service availability.
 */
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ 
    status: 'OPERATIONAL', 
    timestamp: new Date().toISOString(),
    service: 'zero-point-core'
  });
});

/**
 * Request Logging.
 * Captures method and path metadata during development for diagnostic tracing.
 */
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });
}

/**
 * --- 2. ROUTE ORCHESTRATION (V1 Matrix) ---
 * Mounts operational modules for authentication, news, decks, and card database.
 */
const authRoutes = require('./routes/authRoutes');
const newsRoutes = require('./routes/newsRoutes');
const deckRoutes = require('./routes/deckRoutes');
const cardRoutes = require('./routes/cardRoutes');
const chatbotRoutes = require('./chatbot'); 

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/decks', deckRoutes);
app.use('/api/v1/cards', cardRoutes);
app.use('/api/v1/terminal', chatbotRoutes);

/**
 * --- 3. GLOBAL ERROR HANDLER ---
 * Final safety net to capture unhandled exceptions and return consistent JSON error objects.
 */
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  logger.error(`SYSTEM_ERROR: ${err.message}\n${err.stack}`);
  
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? 'Ø' : err.stack,
  });
});

module.exports = app;
