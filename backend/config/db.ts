import mongoose from 'mongoose';
import logger from './logger';

/**
 * Database Infrastructure Layer.
 * 
 * Orchestrates the connection to MongoDB Atlas using Mongoose.
 * Implements a resilient connection logic with logging and process exit on critical failure.
 */

const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from environment variables.');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    logger.info(`VIGIL_SYSTEM: Neural connection established with MongoDB Atlas: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`VIGIL_SYSTEM_FAILURE: Database connection lost: ${(error as Error).message}`);
    // Severe anomaly: Exit process to trigger container restart orchestrator
    process.exit(1);
  }
};

export default connectDB;
