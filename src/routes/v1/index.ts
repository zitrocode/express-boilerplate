import { Router } from 'express';
import httpStatus from 'http-status';

import type { Response } from 'express';

import httpMessage from '@/shared/utils/http-message';

import authRouter from './auth.route';
import userRouter from './user.route';

// Confiure router for /v1
const router: Router = Router();

router.get('/', (_req, res: Response) => {
  res.status(httpStatus.OK).json({
    code: httpStatus.OK,
    message: httpMessage(httpStatus.OK),
    timestamp: new Date().toISOString()
  });
});

// Mount other routers
router.use('/auth', authRouter);
router.use('/users', userRouter);

export default router;
