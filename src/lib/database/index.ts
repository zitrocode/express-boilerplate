import mongoose from 'mongoose';
import type { ConnectOptions } from 'mongoose';

import config from '@/config/config';
import logger from '@/lib/logger';

// Mongoose client options for connecting to the database
const clientOptions: ConnectOptions = {
  dbName: 'ortizoscar-db',
  appName: 'Ortiz Oscar API',
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true
  },
  ...config.mongoose.options
};

/**
 * Establishes a connection to the MongoDb database using Mongoose.
 * If an error occurs during the connection process, it throws an error with a descriptive message.
 *
 * - Uses `Mongo_URI` as the connection string.
 * - `clienteOptions` contains additional configuration for Mongoose.
 * - Errors are properly handled and rethrown for better debugging.
 */

export const connectToDatabase = async (): Promise<void> => {
  if (!config.mongoose.url) {
    throw new Error('Mongo_URI is not defined in the environment variables.');
  }

  try {
    await mongoose.connect(config.mongoose.url, clientOptions);
    logger.info('Connected to the database successfully.');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    logger.error('Error connecting to the database:', error);
  }
};

/**
 * Disconnects from the MongoDB database using Mongoose.
 *
 * This function attempts to disconect from the database asynchronously.
 * If the disconnection is successful, a success message is logged.
 * If an error occurs, it is either re-thrown as a new Error (if it's a instance of Error)
 * or logged to the console
 */

export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from the database successfully.', {
      uri: config.mongoose.url,
      options: clientOptions
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    logger.error('Error disconnecting from the database:', error);
  }
};
