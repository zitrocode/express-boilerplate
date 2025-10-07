import config from '@/config/config';
import logger from '@/lib/logger';

import application from '@/application';
import { connectToDatabase, disconnectFromDatabase } from '@/lib/database';

/**
 * Immediately-invoked async function to start the server.
 * - Connects to the database.
 * - Starts the Express application on the configured port.
 * - Logs a message when the server is running.
 */
(async () => {
  try {
    await connectToDatabase();

    application.listen(config.port, () => {
      logger.info(`Server is running at http://localhost:${config.port}`);
    });
  } catch (err) {
    logger.error('Failed to start the server:', err);
    if (config.env !== 'production') {
      process.exit(1);
    }
  }
})();

/**
 * Gracefully shuts down the server by disconnecting from the database.
 * - Logs a success message if disconnection is successful.
 * - Logs an error if disconnection fails.
 * - Exits the process with status code 0 on success or 1 on failure.
 *
 * @async
 * @function handleServerShutdown
 * @returns {Promise<void>}
 */
const handleServerShutdown = async (): Promise<void> => {
  try {
    await disconnectFromDatabase();
    logger.info('Shutting down server...');
    process.exit(0);
  } catch (err) {
    logger.error('Error during server shutdown:', err);
    process.exit(1);
  }
};

/**
 * Registers listeners for termination signals to allow graceful shutdown.
 * - SIGTERM: Typically sent when stopping the process (e.g., 'kill' command or container shutdown).
 * - SIGINT: Triggered when the user interrupts the process (e.g., pressing Ctrl+C).
 */
process.on('SIGTERM', handleServerShutdown);
process.on('SIGINT', handleServerShutdown);

/**
 * Handles uncaught exceptions and unhandled promise rejections.
 * - Logs the error using the configured logger.
 * - Initiates a graceful shutdown by calling `handleServerShutdown`.
 *
 * @function unexpectedErrorHandler
 * @param {Error} error - The uncaught or unhandled error object.
 */
const unexpectedErrorHandler = (error: Error): void => {
  logger.error('Uncaught Exception:', error);
  handleServerShutdown();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);
