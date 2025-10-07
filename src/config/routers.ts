import type { Routers } from '@/shared/types/route.type';

import authRoute from '@/routes/v1/auth.route';
import userRoute from '@/routes/v1/user.route';

// Define the routers object with proper typing
const routers: Routers = {
  v1: [
    { path: '/auth', route: authRoute },
    { path: '/users', route: userRoute }
  ]
};

export default routers;
