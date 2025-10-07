import mongoose from 'mongoose';
import httpStatus from 'http-status';

import type { Request, Response, NextFunction } from 'express';

import httpMessage from '@/shared/utils/http-message';
import ApiError from '@/shared/errors/AppError';

/**
 * Extended error type that may include additional fields
 * used by ApiError or other custom errors.
 */
type AppError = Error & {
  statusCode?: number;
  isOperational?: boolean;
  stack?: string;
};

/**
 * Middleware to convert any error into an ApiError instance.
 *
 * @param {AppError} err - The error object to be converted.
 * @param {Request} _req - Express request object (unused).
 * @param {Response} _res - Express response object (unused).
 * @param {NextFunction} next - Function to pass control to the next middleware.
 *
 * @example A Mongoose validation error will be converted into:
 * new ApiError(400, "Validation error", false, stack);
 */
const errorConverter = (err: AppError, _req: Request, _res: Response, next: NextFunction): void => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR);

    const message: string = error.message || httpMessage(statusCode);
    error = new ApiError(statusCode, message, false, err.stack);
  }

  next(error);
};

export default errorConverter;
