import { Router } from 'express';

import routers from '@/config/routers';
import type { APIVersion } from '@/shared/types/route.type';

const router: Router = Router();

// Register all routes
(Object.keys(routers) as APIVersion[]).forEach((version) => {
  routers[version].forEach((r) => {
    router.use(`/api/${version}${r.path}`, r.route);
  });
});

export default router;
