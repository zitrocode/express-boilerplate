import winston from 'winston';
import config from '@/config/config';

const { combine, timestamp, errors, printf, colorize, align, json } = winston.format;

// Function to create console transport
const createConsoleTransport = () =>
  new winston.transports.Console({
    format: combine(
      colorize({ all: config.env !== 'production' }), // colored logs only in dev
      timestamp({ format: 'YYYY-MM-DD hh:mm:ss A' }),
      align(),
      printf(({ timestamp: logTimestamp, level, message, ...meta }) => {
        const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `[${logTimestamp}] ${level.toUpperCase()}: ${message} ${metaString}`;
      })
    ),
    stderrLevels: ['error'] // send errors to stderr
  });

// Always have at least one transport (prevents PM2 warning)
const transports: winston.transport[] = [createConsoleTransport()];

// Create logger instance
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: combine(errors({ stack: true }), timestamp(), json()), // JSON for structured logs
  transports,
  silent: config.env === 'test' // disable logs in test
});

export default logger;
