import httpStatus from 'http-status';

import type { Request, Response, NextFunction } from 'express';

import config from '@/config/config';
import logger from '@/lib/logger';
import httpMessage from '@/shared/utils/http-message';
import AppError from '@/shared/errors/AppError';

/**
 * Middleware to handle errors and send a standardized response.
 *
 * @param {AppError} err - The error object (converted or raw).
 * @param {Request} _req - Express request object (unused).
 * @param {Response} res - Express response object.
 * @param {NextFunction} _next - Function to pass control (unused).
 *
 * @returns {void}
 *
 * @example Response in development:
 * {
 *   "code": 500,
 *   "message": "Internal Server Error",
 *   "stack": "Error stack trace..."
 * }
 *
 *  @example Response in production:
 * {
 *   "code": 500,
 *   "message": "Internal Server Error"
 * }
 */
const errorHandler = (err: AppError, _req: Request, res: Response, _next?: NextFunction): void => {
  let { statusCode, message } = err;

  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpMessage(httpStatus.INTERNAL_SERVER_ERROR);
  }

  // Store error message in res.locals for Morgan logging
  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
    timestamp: (err as AppError).timestamp || new Date().toISOString()
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode || 500).send(response);
};

export default errorHandler;
