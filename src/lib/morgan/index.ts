import morgan, { StreamOptions } from 'morgan';
import type { Request, Response } from 'express';

import config from '@/config/config';
import logger from '@/lib/logger';

// Custom token to log error messages from res.locals
morgan.token('message', (_req: Request, res: Response) => res.locals?.errorMessage || '');

// Conditional IP format for production
const getIpFormat = (): string => (config.env === 'production' ? ':remote-addr - ' : '');

// Log format strings
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

// Stream objects with correct typing
const successStream: StreamOptions = { write: (message: string) => logger.info(message.trim()) };
const errorStream: StreamOptions = { write: (message: string) => logger.error(message.trim()) };

// Morgan middleware
export const successHandler = morgan(successResponseFormat, {
  skip: (_req: Request, res: Response) => res.statusCode >= 400,
  stream: successStream
});

export const errorHandler = morgan(errorResponseFormat, {
  skip: (_req: Request, res: Response) => res.statusCode < 400,
  stream: errorStream
});
