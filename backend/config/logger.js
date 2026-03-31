const winston = require('winston');
const path = require('path');

/**
 * winston.js: Global Monitoring System
 * Orchestrates event registration across the Matrix.
 * Configured for JSON output in production and colorized simple output in development.
 * Persists errors to dedicated logs and combined sectors for post-mortem analysis.
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'punto-zero-backend' },
  transports: [
    // Signal Capture: Persistent error logging
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error' 
    }),
    // Signal Capture: Combined operational registry
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log') 
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

module.exports = logger;
