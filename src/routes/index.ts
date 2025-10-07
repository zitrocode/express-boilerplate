import { Router } from 'express';
import v1Routes from './v1';

const router: Router = Router();

// Mount versioned routes on the main router
router.use('/v1', v1Routes);

export default router;
