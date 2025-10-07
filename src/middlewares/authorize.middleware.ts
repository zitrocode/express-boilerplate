import passport from 'passport';
import httpStatus from 'http-status';
import { Request, Response, NextFunction } from 'express';

import ROLE_RIGHTS from '@/constants/role-rights.constant';

import expandPermissions from '@/shared/utils/permissions';
import httpMessage from '@/shared/utils/http-message';
import AppError from '@/shared/errors/AppError';

const verifyCallback =
  (req: Request, resolve: () => void, reject: (err: Error) => void, requiredPermissions: string[]) =>
  async (err: Error | null, user: { id: string; role: string } | false | null, info: unknown): Promise<void> => {
    if (err || info || !user) {
      return reject(new AppError(httpStatus.UNAUTHORIZED, httpMessage(httpStatus.UNAUTHORIZED)));
    }

    req.user = user;

    if (requiredPermissions.length) {
      const roleKey = user.role as keyof typeof ROLE_RIGHTS;
      const rolePerms: string[] = ROLE_RIGHTS[roleKey] || [];

      // Expand implied permissions (like manager_users -> read_users, update_users, etc)
      const userPermissions = expandPermissions(rolePerms);

      // Check if user has all required permissions
      const hasRequiredPermissions = requiredPermissions.every((perm) => userPermissions.includes(perm));

      // if user lacks permissions and is not accessing their own resource
      if (!hasRequiredPermissions && req.params.userId !== String(user.id)) {
        return reject(new AppError(httpStatus.FORBIDDEN, httpMessage(httpStatus.FORBIDDEN)));
      }
    }

    return resolve();
  };

/**
 * Middleware of authorization
 * - Use Passport to authenticate JWT tokens
 * - Verify role permissions
 */
const authorize =
  (...requiredPermissions: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    return new Promise<void>((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredPermissions))(
        req,
        res,
        next
      );
    })
      .then(() => next())
      .catch((err) => next(err));
  };

export default authorize;
