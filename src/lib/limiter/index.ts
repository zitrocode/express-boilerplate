import { rateLimit } from 'express-rate-limit';
import httpStatus from 'http-status';
import httpMessage from '@/shared/utils/http-message';

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  limit: 60, // limit each IP to 60 requests per windowMs
  standardHeaders: 'draft-8', // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: httpMessage(httpStatus.TOO_MANY_REQUESTS) }
});

export default limiter;
