import moment from 'moment';
import passport from 'passport';
import status from 'http-status';
import httpMocks from 'node-mocks-http';

import type { Types } from 'mongoose';

import config from '@/config/config';
import * as tokenService from '@/services/token.service';
import TOKEN from '@/enums/token.enum';
import authorize from '@/middlewares/authorize.middleware';

import ROLE_RIGHTS from '@/constants/role-rights.constant';
import httpMessage from '@/shared/utils/http-message';
import AppError from '@/shared/errors/AppError';

import { adminAccessToken, userAccessToken } from '@tests/fixtures/token.fixture';
import { adminsFixture, insertUser, usersFixture } from '@tests/fixtures/user.fixture';
import setupTestDB from '@tests/utils/setupTest';

setupTestDB();

describe('Authorize middleware', () => {
  beforeAll(() => {
    passport.use(
      'jwt',
      new (class extends passport.Strategy {
        authenticate(req: import('express').Request) {
          const authHeader = req.headers.authorization;
          if (authHeader === `Bearer ${userAccessToken}`) {
            return this.success(usersFixture[0]);
          }
          return this.fail('Unauthorized', 401);
        }
      })()
    );
  });

  test('should call next with no errors if access token is valid', async () => {
    await insertUser([usersFixture[0]]);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userAccessToken}` } });
    const next = jest.fn();

    await authorize()(req, httpMocks.createResponse(), next);

    // Type assertion to tell TypeScript that req.user exists
    const { user } = req as typeof req & { user: (typeof usersFixture)[0] };

    expect(next).toHaveBeenCalledWith();
    expect(user._id as Types.ObjectId).toEqual(usersFixture[0]._id);
  });

  test('should call next unauthorized error if access token is not found in header', async () => {
    await insertUser([usersFixture[0]]);
    const req = httpMocks.createRequest();
    const next = jest.fn();

    await authorize()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: status.UNAUTHORIZED, message: httpMessage(status.UNAUTHORIZED) })
    );
  });

  test('should call next with unauthorized error if access token is not valid (JWT TOKEN)', async () => {
    await insertUser([usersFixture[0]]);
    const req = httpMocks.createRequest({ headers: { Authorization: 'Bearer randomToken' } });
    const next = jest.fn();

    await authorize()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: status.UNAUTHORIZED, message: httpMessage(status.UNAUTHORIZED) })
    );
  });

  test('should call next with unauthorized error if the token is not an access token', async () => {
    await insertUser([usersFixture[0]]);
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const refreshToken = tokenService.generateToken(usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH);

    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${refreshToken}` } });
    const next = jest.fn();

    await authorize()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: status.UNAUTHORIZED, message: httpMessage(status.UNAUTHORIZED) })
    );
  });

  test('should call next with unaunthorized errror if access token is generated with different secret', async () => {
    await insertUser([usersFixture[0]]);
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = tokenService.generateToken(
      usersFixture[0]._id as Types.ObjectId,
      expires,
      TOKEN.ACCESS,
      'differentSecret'
    );

    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await authorize()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: status.UNAUTHORIZED, message: httpMessage(status.UNAUTHORIZED) })
    );
  });

  test('should call next with unauthorized error if access token is expired', async () => {
    await insertUser([usersFixture[0]]);
    const expires = moment().subtract(1, 'minutes');
    const accessToken = tokenService.generateToken(usersFixture[0]._id as Types.ObjectId, expires, TOKEN.ACCESS);

    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await authorize()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: status.UNAUTHORIZED, message: httpMessage(status.UNAUTHORIZED) })
    );
  });

  test('should call next with unauthorized error if user is not found', async () => {
    const expires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = tokenService.generateToken(usersFixture[1]._id as Types.ObjectId, expires, TOKEN.ACCESS);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await authorize()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: status.UNAUTHORIZED, message: httpMessage(status.UNAUTHORIZED) })
    );
  });

  test('should call next with forbidden error if user does not have required permissions', async () => {
    await insertUser([usersFixture[0]]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userAccessToken}` }
    });
    const next = jest.fn();

    await authorize(...ROLE_RIGHTS.admin)(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: status.FORBIDDEN, message: httpMessage(status.FORBIDDEN) })
    );
  });

  test('should call next with no errors if user does not have required permissions but is accessing their own resource', async () => {
    await insertUser([usersFixture[0]]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${userAccessToken}` },
      params: { userId: String(usersFixture[0]._id) }
    });
    const next = jest.fn();

    await authorize(...ROLE_RIGHTS.user)(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  test('should call next with no errors if user has required permissions', async () => {
    await insertUser([adminsFixture[0]]);
    const req = httpMocks.createRequest({
      headers: { Authorization: `Bearer ${adminAccessToken}` },
      params: { userId: String(adminsFixture[0]._id) }
    });
    const next = jest.fn();

    await authorize(...ROLE_RIGHTS.admin)(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalled();
  });
});
