import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';

import compression from 'compression';
import status from 'http-status';
import helmet from 'helmet';
import cors from 'cors';
import passport from 'passport';

import type { NextFunction } from 'express';

import corsOptions from '@/config/cors';
import config from '@/config/config';

import limiter from '@/lib/limiter';
import * as morgan from '@/lib/morgan';
import jwtStrategy from '@/lib/passport';

import httpMessage from '@/shared/utils/http-message';
import AppError from '@/shared/errors/AppError';
import errorConverter from '@/middlewares/error/error-converter';
import errorHandler from '@/middlewares/error/error-hanlder';

import globalRouter from '@/routes';

const application = express();

// Use morgan for logging HTTP requests in development environment
if (config.env === 'development') {
  application.use(morgan.successHandler);
  application.use(morgan.errorHandler);
}

// Enable CORS with specified options
application.use(cors(corsOptions));

// Parse incoming request bodies in JSON and URL-encoded formats
application.use(express.json({ limit: '10kb' }));
application.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanatize request data to prevent NoSQL injection attacks
application.use(mongoSanitize());

// Enable response compression to reduce playload size and improve performance
application.use(
  compression({
    threshold: 1024 // Compress responses only if the response body is larger than 1KB
  })
);

// Use helmet to set various HTTP headers for security
application.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: true
  })
);

// Apply rate limiting middleware to prevent excessive requests and enhance security
application.use(limiter);

// Jwt authentication
application.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// Register API routes
application.use('/api', globalRouter);

// Send back a 404 error for any unknown API requests
application.use((_req, _res, next: NextFunction) => {
  next(new AppError(status.NOT_FOUND, httpMessage(status.NOT_FOUND)));
});

// Convert errors to ApiError, if needed
application.use(errorConverter);
application.use(errorHandler);

export default application;
