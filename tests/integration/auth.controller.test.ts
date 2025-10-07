/* eslint-disable no-underscore-dangle */
import moment from 'moment';
import supertest from 'supertest';
import httpStatus from 'http-status';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

import type { Types } from 'mongoose';

import config from '@/config/config';
import application from '@/application';

import tokenModel from '@/models/token.model';
import userModel from '@/models/user.model';

import * as emailService from '@/services/email.service';
import * as tokenService from '@/services/token.service';

import TOKEN from '@/enums/token.enum';

import { userAccessToken } from '@tests/fixtures/token.fixture';
import { usersFixture, insertUser } from '@tests/fixtures/user.fixture';
import setupTestDB from '@tests/utils/setupTest';

setupTestDB();

interface User {
  name: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

describe('Authorization Controller', () => {
  describe('POST /api/v1/auth/register - Register user', () => {
    let newUser: User;

    beforeEach(() => {
      const password = faker.internet.password({ length: 10 });
      newUser = {
        name: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        password,
        confirmPassword: password
      };
    });

    test('should return 201 and register user successfully', async () => {
      await supertest(application)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect(httpStatus.CREATED)
        .then(async (res) => {
          expect(res.body.user).not.toHaveProperty('password');
          expect(res.body).toMatchObject({
            user: {
              id: expect.anything(),
              name: newUser.name,
              lastName: newUser.lastName,
              email: newUser.email,
              role: 'user',
              emailVerified: false
            }
          });

          const dbUser = await userModel.findById(res.body.user.id);
          expect(dbUser).toBeDefined();
          expect(dbUser?.password).not.toBe(newUser.password);
          expect(dbUser).toMatchObject({
            name: newUser.name,
            email: newUser.email,
            role: 'user',
            emailVerified: false
          });

          expect(res.body.tokens).toEqual({
            access: { token: expect.anything(), expires: expect.anything() },
            refresh: { token: expect.anything(), expires: expect.anything() }
          });
        });
    });

    test('should return 400 if name is missing', async () => {
      const userWithoutName: Partial<User> = { ...newUser };
      delete userWithoutName.name;

      await supertest(application).post('/api/v1/auth/register').send(userWithoutName).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is invalid', async () => {
      newUser.email = 'invalidEmail';
      await supertest(application).post('/api/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is already used', async () => {
      insertUser([usersFixture[1]]);
      newUser.email = usersFixture[1].email as string;
      await supertest(application).post('/api/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if password is less than 8 characters', async () => {
      newUser.password = 'pass';
      newUser.confirmPassword = newUser.password;
      await supertest(application).post('/api/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if password and confirmPassword do not match', async () => {
      newUser.confirmPassword = 'differentPassword';
      await supertest(application).post('/api/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if password does not contain both letters and numbers', async () => {
      newUser.password = 'abcdefgh'; // No numbers
      await supertest(application).post('/api/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);

      newUser.password = '12345678'; // No letters
      await supertest(application).post('/api/v1/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/v1/auth/login - Login user', () => {
    test('should return 200 and login user successfully', async () => {
      await insertUser([usersFixture[0]]);
      const loginData = {
        email: usersFixture[0].email,
        password: usersFixture[0].password
      };

      await supertest(application)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.user).not.toHaveProperty('password');
          expect(res.body.user).toMatchObject({
            id: expect.anything(),
            name: usersFixture[0].name,
            email: usersFixture[0].email,
            role: 'user',
            emailVerified: false
          });

          expect(res.body.tokens).toEqual({
            access: { token: expect.anything(), expires: expect.anything() },
            refresh: { token: expect.anything(), expires: expect.anything() }
          });
        });
    });

    test('should return 401 if email is not registered', async () => {
      const loginData = {
        email: faker.internet.email().toLowerCase(),
        password: usersFixture[0].password
      };

      await supertest(application)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body).toMatchObject({
            code: httpStatus.UNAUTHORIZED,
            message: 'Incorrect email or password'
          });
        });
    });

    test('should return 401 if password is incorrect', async () => {
      await insertUser([usersFixture[0]]);
      const loginData = {
        email: usersFixture[0].email,
        password: 'wrongPassword'
      };

      await supertest(application)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(httpStatus.UNAUTHORIZED)
        .then((res) => {
          expect(res.body).toMatchObject({
            code: httpStatus.UNAUTHORIZED,
            message: 'Incorrect email or password'
          });
        });
    });
  });
  describe('POST /api/v1/auth/logout - Logout user', () => {
    test('should return 204 if refresh token is valid', async () => {
      await insertUser([usersFixture[0]]);

      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH);
      await tokenService.saveToken(refreshToken, usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH);

      await supertest(application).post('/api/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NO_CONTENT);

      const dbRefreshToken = await tokenModel.findOne({ token: refreshToken });
      expect(dbRefreshToken).toBeNull();
    });

    test('should return 400 error if refresh token is missing', async () => {
      await supertest(application).post('/api/v1/auth/logout').send({}).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if refresh token is not found in db', async () => {
      await insertUser([usersFixture[0]]);

      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH);

      await supertest(application).post('/api/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);
    });

    test('should returrn 404 if refresh token is blacklisted', async () => {
      await insertUser([usersFixture[0]]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH);
      await tokenService.saveToken(refreshToken, usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH, true);

      await supertest(application).post('/api/v1/auth/logout').send({ refreshToken }).expect(httpStatus.NOT_FOUND);
    });
  });

  describe('POST /api/v1/auth/refresh-tokens - Refresh tokens', () => {
    test('should return 200 and new auth tokens if refresh token is valid', async () => {
      await insertUser([usersFixture[1]]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(usersFixture[1]._id as Types.ObjectId, expires, TOKEN.REFRESH);
      await tokenService.saveToken(refreshToken, usersFixture[1]._id as Types.ObjectId, expires, TOKEN.REFRESH);

      const res = await supertest(application)
        .post('/api/v1/auth/refresh-tokens')
        .send({ refreshToken })
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        access: { token: expect.anything(), expires: expect.anything() },
        refresh: { token: expect.anything(), expires: expect.anything() }
      });

      const dbRefreshTokenDoc = await tokenModel.findOne({ token: res.body.refresh.token });
      expect(dbRefreshTokenDoc).toMatchObject({
        type: TOKEN.REFRESH,
        user: usersFixture[1]._id,
        blacklisted: false
      });

      const dbRefreshTokenCount = await tokenModel.countDocuments();
      expect(dbRefreshTokenCount).toBe(1);
    });

    test('should return 400 error if refresh token is missing', async () => {
      await supertest(application).post('/api/v1/auth/refresh-tokens').send({}).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 401 error if refresh token is signed with different secret', async () => {
      await insertUser([usersFixture[0]]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.REFRESH,
        'differentSecret'
      );
      await tokenService.saveToken(refreshToken, usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH);

      await supertest(application)
        .post('/api/v1/auth/refresh-tokens')
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is not found in db', async () => {
      await insertUser([usersFixture[0]]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH);

      await supertest(application)
        .post('/api/v1/auth/refresh-tokens')
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is blacklisted', async () => {
      await insertUser([usersFixture[0]]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH);
      await tokenService.saveToken(refreshToken, usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH, true);

      await supertest(application)
        .post('/api/v1/auth/refresh-tokens')
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is expired', async () => {
      await insertUser([usersFixture[0]]);
      const expires = moment().subtract(1, 'minutes');
      const refreshToken = tokenService.generateToken(usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH);
      await tokenService.saveToken(refreshToken, usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH);

      await supertest(application)
        .post('/api/v1/auth/refresh-tokens')
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if user is not found', async () => {
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH);
      await tokenService.saveToken(refreshToken, usersFixture[0]._id as Types.ObjectId, expires, TOKEN.REFRESH);

      await supertest(application)
        .post('/api/v1/auth/refresh-tokens')
        .send({ refreshToken })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/auth/forgot-password - Forgot password', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue({} as any);
    });

    test('should return 204 and send reset password email to the user', async () => {
      await insertUser([usersFixture[0]]);
      const sendResetPasswordEmailSpy = jest.spyOn(emailService, 'sendResetPasswordEmail');

      await supertest(application)
        .post('/api/v1/auth/forgot-password')
        .send({ email: usersFixture[0].email })
        .expect(httpStatus.NO_CONTENT);

      expect(sendResetPasswordEmailSpy).toHaveBeenCalledWith(usersFixture[0].email, expect.any(String));
      const resetPasswordToken = sendResetPasswordEmailSpy.mock.calls[0][1];
      const dbResetPasswordTokenDoc = await tokenModel.findOne({
        token: resetPasswordToken,
        user: usersFixture[0]._id
      });
      expect(dbResetPasswordTokenDoc).toBeDefined();
    });

    test('should return 400 if email is missing', async () => {
      await insertUser([usersFixture[0]]);

      await supertest(application).post('/api/v1/auth/forgot-password').send({}).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 if email does not belong to any user', async () => {
      await supertest(application)
        .post('/api/v1/auth/forgot-password')
        .send({ email: usersFixture[0].email })
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('POST /api/v1/auth/reset-password - Reset password', () => {
    test('Should return 204 and reset the password', async () => {
      await insertUser([usersFixture[0]]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.RESET_PASSWORD
      );
      await tokenService.saveToken(
        resetPasswordToken,
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.RESET_PASSWORD
      );

      await supertest(application)
        .post('/api/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await userModel.findById(usersFixture[0]._id);
      const isPasswordMatch = await bcrypt.compare('password2', dbUser!.password);
      expect(isPasswordMatch).toBe(true);

      const dbResetPasswordTokenCount = await tokenModel.countDocuments({
        user: usersFixture[0]._id,
        type: TOKEN.RESET_PASSWORD
      });
      expect(dbResetPasswordTokenCount).toBe(0);
    });

    test('should return 400 if reset password token is missing', async () => {
      await insertUser([usersFixture[1]]);

      await supertest(application)
        .post('/api/v1/auth/reset-password')
        .query({})
        .send({ password: 'password2' })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('Should return 401 if reset password token is blacklisted', async () => {
      await insertUser([usersFixture[0]]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.RESET_PASSWORD
      );
      await tokenService.saveToken(
        resetPasswordToken,
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.RESET_PASSWORD,
        true
      );

      await supertest(application)
        .post('/api/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('Should return 401 if reset password token is expired', async () => {
      await insertUser([usersFixture[0]]);
      const expires = moment().subtract(1, 'minutes');
      const resetPasswordToken = tokenService.generateToken(
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.RESET_PASSWORD
      );
      await tokenService.saveToken(
        resetPasswordToken,
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.RESET_PASSWORD
      );

      await supertest(application)
        .post('/api/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('Should return 401 if user is not found', async () => {
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.RESET_PASSWORD
      );
      await tokenService.saveToken(
        resetPasswordToken,
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.RESET_PASSWORD
      );

      await supertest(application)
        .post('/api/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'password2' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('Should return 400 if password is missing or invalid', async () => {
      await insertUser([usersFixture[0]]);
      const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
      const resetPasswordToken = tokenService.generateToken(
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.RESET_PASSWORD
      );
      await tokenService.saveToken(
        resetPasswordToken,
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.RESET_PASSWORD
      );

      await supertest(application)
        .post('/api/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send()
        .expect(httpStatus.BAD_REQUEST);

      await supertest(application)
        .post('/api/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'short1' })
        .expect(httpStatus.BAD_REQUEST);

      await supertest(application)
        .post('/api/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: 'allletters' })
        .expect(httpStatus.BAD_REQUEST);

      await supertest(application)
        .post('/api/v1/auth/reset-password')
        .query({ token: resetPasswordToken })
        .send({ password: '12345678' })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /api/v1/auth/send-verification-email - Send verification email', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(emailService.transport, 'sendMail').mockResolvedValue({} as any);
    });

    test('should return 204 and send verification email to the user', async () => {
      await insertUser([usersFixture[0]]);
      const sendVerificationEmailSpy = jest.spyOn(emailService, 'sendVerificationEmail');

      await supertest(application)
        .post('/api/v1/auth/send-verification-email')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      expect(sendVerificationEmailSpy).toHaveBeenCalledWith(usersFixture[0].email, expect.any(String));
      const verifyEmailToken = sendVerificationEmailSpy.mock.calls[0][1];
      const dbVerifyEmailToken = await tokenModel.findOne({ token: verifyEmailToken, user: usersFixture[0]._id });

      expect(dbVerifyEmailToken).toBeDefined();
    });

    test('should return 401 error if access token is missing', async () => {
      await insertUser([usersFixture[1]]);
      await supertest(application).post('/api/v1/auth/send-verification-email').send().expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/auth/verify-email - Verify email', () => {
    test('should return 204 and verify the email', async () => {
      await insertUser([usersFixture[0]]);
      const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
      const verifyEmailToken = tokenService.generateToken(
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.VERIFY_EMAIL
      );
      await tokenService.saveToken(
        verifyEmailToken,
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.VERIFY_EMAIL
      );

      await supertest(application)
        .post('/api/v1/auth/verify-email')
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await userModel.findById(usersFixture[0]._id);

      expect(dbUser?.emailVerified).toBe(true);

      const dbVerifyEmailToken = await tokenModel.countDocuments({
        user: usersFixture[0]._id,
        type: TOKEN.VERIFY_EMAIL
      });
      expect(dbVerifyEmailToken).toBe(0);
    });

    test('should return 401 if verify email token is missing', async () => {
      await insertUser([usersFixture[1]]);
      await supertest(application).post('/api/v1/auth/verify-email').send().expect(httpStatus.BAD_REQUEST);
    });

    test('should return 401 if verify email token is blacklisted', async () => {
      await insertUser([usersFixture[0]]);
      const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
      const verifyEmailToken = tokenService.generateToken(
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.VERIFY_EMAIL
      );
      await tokenService.saveToken(
        verifyEmailToken,
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.VERIFY_EMAIL,
        true
      );

      await supertest(application)
        .post('/api/v1/auth/verify-email')
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if verify email token is expired', async () => {
      await insertUser([usersFixture[1]]);
      const expires = moment().subtract(1, 'minutes');
      const verifyEmailToken = tokenService.generateToken(
        usersFixture[1]._id as Types.ObjectId,
        expires,
        TOKEN.VERIFY_EMAIL
      );
      await tokenService.saveToken(
        verifyEmailToken,
        usersFixture[1]._id as Types.ObjectId,
        expires,
        TOKEN.VERIFY_EMAIL
      );

      await supertest(application)
        .post('/api/v1/auth/verify-email')
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if user is not found', async () => {
      const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
      const verifyEmailToken = tokenService.generateToken(
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.VERIFY_EMAIL
      );
      await tokenService.saveToken(
        verifyEmailToken,
        usersFixture[0]._id as Types.ObjectId,
        expires,
        TOKEN.VERIFY_EMAIL
      );

      await supertest(application)
        .post('/api/v1/auth/verify-email')
        .query({ token: verifyEmailToken })
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});
