import type { CorsOptions } from 'cors';

import config from '@/config/config';
import logger from '@/lib/logger';

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || config.allowed_origins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    logger.warn(`CORS policy violation: Origin ${origin} is not allowed`);
    return callback(new Error('Not allowed by CORS'), false);
  }
};

export default corsOptions;
