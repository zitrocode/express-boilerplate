import { Router } from 'express';

import validate from '@/middlewares/validate.middleware';
import authorize from '@/middlewares/authorize.middleware';

import * as userController from '@/controllers/user.controller';
import * as userValidation from '@/validations/user.validation';

const router: Router = Router();

router
  .route('/')
  .post(authorize('manage_users'), validate(userValidation.createUser), userController.createUser)
  .get(authorize('read_users'), validate(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(authorize('read_users'), validate(userValidation.getUser), userController.getUser)
  .patch(authorize('manage_users'), validate(userValidation.updateUser), userController.updateUser)
  .delete(authorize('manage_users'), validate(userValidation.deleteUser), userController.deleteUser);

export default router;
