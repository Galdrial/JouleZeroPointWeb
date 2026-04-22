import winston from 'winston';

/**
 * Enterprise Logging Engine (TypeScript).
 * 
 * Orchestrates a multi-channel logging system powered by Winston.
 * Implements differentiated outputs for production (File-based) 
 * and development (Colorized Console) to ensure auditability and debuggability.
 */

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Standard Formatting Protocol: Timestamp | Level | Message
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  silent: process.env.NODE_ENV === 'test',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Capture stack traces for anomalies
    logFormat
  ),
  transports: [
    // Persistence Layer: Error logs are archived for post-mortem analysis
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Full Audit Layer: Combined logs for system state monitoring
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Console Logging: Mandatory for Docker/Containerized environments (stdout)
logger.add(new winston.transports.Console({
  format: combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    logFormat
  ),
}));

export default logger;
