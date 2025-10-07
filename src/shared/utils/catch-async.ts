import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Utility to catch errors in async route handlers and pass them to Express error middleware.
 * @param fn - An async Express request handler
 * @returns A wrapped request handler with error catching
 */
const catchAsync =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default catchAsync;
