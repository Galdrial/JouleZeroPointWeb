const path = require( 'path' );
require( 'dotenv' ).config( { path: path.join( __dirname, '.env' ) } );
const express = require( 'express' );
const cors = require( 'cors' );
const logger = require( './config/logger' );

const helmet = require( 'helmet' );
const mongoSanitize = require( 'express-mongo-sanitize' );
const hpp = require( 'hpp' );
const rateLimit = require( 'express-rate-limit' );

const app = express();

/**
 * --- INFRASTRUCTURE CONFIGURATION ---
 * Trust Proxy is required for cloud deployments (Render, Heroku, Railway) 
 * to correctly identify client IP addresses for Rate Limiting.
 */
app.set( 'trust proxy', 1 );

/**
 * --- CORE MIDDLEWARE CONFIGURATION ---
 * Configures Cross-Origin Resource Sharing (CORS) and standard JSON body parsing.
 */
const allowedOrigins = [
  process.env.FRONTEND_URL,                             // Dominio da variabile d'ambiente
  'https://www.joulezeropoint.com',                     // Versione con www
  'https://joulezeropoint.com',                         // Versione senza www
  'http://localhost:5173',                              // Dev locale
  'http://localhost:5174'                               // Dev locale alternativo
];

app.use( cors( {
  origin: function ( origin, callback ) {
    if ( !origin || allowedOrigins.includes( origin ) ) {
      callback( null, true );
    } else {
      callback( new Error( 'Non autorizzato dalla politica CORS di Joule.' ) );
    }
  },
  credentials: true
} ) );
app.use( express.json() );

/**
 * --- 1. SECURITY ARMOR (Express 5 Synchronized) ---
 * Implements a multi-layered security strategy to protect the Atlas Core.
 */

// Helmet: Security headers orchestration and Content Security Policy (CSP) enforcement.
app.use( helmet( {
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https:*"], // Allow remote card imagery
      "script-src": ["'self'", "'unsafe-inline'"], // Allow required inline execution
    },
  },
} ) );

/**
 * Custom NoSQL Sanitization Middleware.
 * Recursively purges '$' prefixed keys from request data to prevent NoSQL injection attacks.
 */
app.use( ( req, res, next ) => {
  const deepSanitize = ( obj ) => {
    if ( obj && typeof obj === 'object' ) {
      Object.keys( obj ).forEach( key => {
        if ( key.startsWith( '$' ) ) {
          delete obj[key];
        } else if ( obj[key] && typeof obj[key] === 'object' ) {
          // Limited recursion to optimize performance on large datasets
          deepSanitize( obj[key] );
        }
      } );
    }
    return obj;
  };

  // Sanitize lightweight inputs (query and params)
  if ( req.query ) deepSanitize( req.query );
  if ( req.params ) deepSanitize( req.params );
  // Sanitize payload body if present and of reasonable size
  if ( req.body && Object.keys( req.body ).length < 1000 ) {
    deepSanitize( req.body );
  }
  next();
} );

// HTTP Parameter Pollution (HPP) protection
app.use( hpp() );

// Keep-Alive ping: fuori dal rate limiter (UptimeRobot → ogni 5 min)
app.get( '/ping', ( req, res ) => {
  logger.info('[MATRIX] Pulsazione Keep-Alive rilevata (Root).');
  res.status( 200 ).send( 'pong' );
} );

app.get( '/api/v1/ping', ( req, res ) => {
  logger.info('[MATRIX] Pulsazione Keep-Alive rilevata (API v1).');
  res.status( 200 ).send( 'pong' );
} );

/**
 * Rate Limiter: Brute-force and Denial-of-Service (DoS) mitigation.
 * Limits each unique IP identifier to 100 requests per 15-minute window.
 */
const limiter = rateLimit( {
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Troppe richieste dalle tue coordinate galattiche (IP). Prego riprovare tra 15 minuti.' },
  standardHeaders: true,
  legacyHeaders: false,
} );

app.use( '/api', limiter );

/**
 * Auth Rate Limiter: Enhanced protection for authentication endpoints.
 * Strict limits (10 reqs / 15 mins) to prevent brute-force attacks on identity credentials.
 */
const authLimiter = rateLimit( {
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Troppi tentativi di autenticazione. Il tuo portale di accesso è stato temporaneamente bloccato per proteggere i tuoi dati.' },
  standardHeaders: true,
  legacyHeaders: false,
} );

app.use( '/api/v1/auth/login', authLimiter );
app.use( '/api/v1/auth/register', authLimiter );
app.use( '/api/v1/auth/forgot-password', authLimiter );
app.use( '/api/v1/auth/resend-verification', authLimiter );

/**
 * Healthy Check Sensor (Operational Synchronia).
 * Exposes a heartbeat endpoint to monitor service availability.
 */
app.get( '/api/v1/health', ( req, res ) => {
  res.status( 200 ).json( {
    status: 'OPERATIVO',
    timestamp: new Date().toISOString(),
    service: 'nucleo-punto-zero'
  } );
} );

/**
 * Request Logging.
 * Captures method and path metadata during development for diagnostic tracing.
 */
if ( process.env.NODE_ENV === 'development' ) {
  app.use( ( req, res, next ) => {
    logger.debug( `${req.method} ${req.url}` );
    next();
  } );
}

/**
 * --- 2. ROUTE ORCHESTRATION (V1 Matrix) ---
 * Mounts operational modules for authentication, news, decks, and card database.
 */
const authRoutes = require( './routes/authRoutes' );
const newsRoutes = require( './routes/newsRoutes' );
const deckRoutes = require( './routes/deckRoutes' );
const cardRoutes = require( './routes/cardRoutes' );
const terminalRoutes = require( './routes/terminalRoutes' );
const rulesRoutes = require( './routes/rulesRoutes' );

app.use( '/api/v1/auth', authRoutes );
app.use( '/api/v1/news', newsRoutes );
app.use( '/api/v1/decks', deckRoutes );
app.use( '/api/v1/cards', cardRoutes );
app.use( '/api/v1/terminal', terminalRoutes );
app.use( '/api/v1/rules', rulesRoutes );

/**
 * --- STATIC ASSETS SERVING ---
 * Facilitates access to user-uploaded news imagery from the Matrix storage.
 */
app.use( '/news', ( req, res, next ) => {
  res.setHeader( 'Cross-Origin-Resource-Policy', 'cross-origin' );
  next();
}, express.static( path.join( __dirname, 'public/news' ) ) );

/**
 * --- 3. GLOBAL ERROR HANDLER ---
 * Final safety net to capture unhandled exceptions and return consistent JSON error objects.
 */
app.use( ( err, req, res, next ) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  logger.error( `SYSTEM_ERROR: ${err.message}\n${err.stack}` );

  res.status( statusCode ).json( {
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? 'Ø' : err.stack,
  } );
} );

module.exports = app;
