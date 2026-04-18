const app = require( './app' );
const connectDB = require( './config/db' );
const logger = require( './config/logger' );
const initCleanupTask = require( './tasks/cleanupTask' );
const mongoose = require( 'mongoose' );

/**
 * --- 1. ENVIRONMENT VALIDATION ---
 * Verifies the presence of critical operational variables required for the system to function.
 */
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter( env => !process.env[env] );

if ( !process.env.NODE_ENV ) {
  process.env.NODE_ENV = 'production';
}

if ( missingEnv.length > 0 ) {
  logger.error( `CRITICAL_FAILURE: Missing core environment signals: ${missingEnv.join( ', ' )}` );
  process.exit( 1 );
}

// Initialize operational infrastructure
const startServer = async () => {
  try {
    // 1. Database Connection
    await connectDB();

    // 2. Data Synchronization (Bootstrap)
    const { syncCards } = require('./services/cardSyncService');
    await syncCards().catch(err => logger.error(`BOOTSTRAP_SYNC_ERROR: ${err.message}`));

    // 3. Automated Tasks
    initCleanupTask();

    // 4. Server Listener
    const PORT = process.env.PORT || 3000;
    const server = app.listen( PORT, '0.0.0.0', () => {
      logger.info( `[ZERO POINT] Operational Node stable on port ${PORT} [Mode: ${process.env.NODE_ENV}]` );
    } );

    /**
     * --- 3. GRACEFUL SHUTDOWN (Hibernation Protocol) ---
     */
    const shutdown = async ( signal ) => {
      logger.info( `${signal} DETECTED: Initiating professional hibernation protocol...` );

      server.close( () => {
        logger.info( '[ZERO POINT] API flow interrupted. Closing database connections...' );

        mongoose.connection.close( false ).then( () => {
          logger.info( '[ZERO POINT] Quantum Channel with MongoDB closed. Matrix offline.' );
          process.exit( 0 );
        } );
      } );

      setTimeout( () => {
        logger.error( '[ZERO POINT] Forced shutdown initiated: Time-out exceeded.' );
        process.exit( 1 );
      }, 10000 );
    };

    process.on( 'SIGTERM', () => shutdown( 'SIGTERM' ) );
    process.on( 'SIGINT', () => shutdown( 'SIGINT' ) );

  } catch (error) {
    logger.error(`BOOT_FAILURE: ${error.message}`);
    process.exit(1);
  }
};

startServer();

