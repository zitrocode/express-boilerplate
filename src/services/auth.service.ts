import httpStatus from 'http-status';
import bcrypt from 'bcrypt';

import tokenModel from '@/models/token.model';
import TOKEN from '@/enums/token.enum';
import httpMessages from '@/shared/utils/http-message';
import AppError from '@/shared/errors/AppError';

import type { UserDocument } from '@/interfaces/user.interface';

import * as tokenService from './token.service';
import * as userService from './user.service';

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserDocument>}
 */
const loginUserWithEmailAndPassword = async (email: string, password: string): Promise<UserDocument> => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken: string): Promise<void> => {
  const refreshTokenDoc = await tokenModel.findOne({
    token: refreshToken,
    type: TOKEN.REFRESH,
    blacklisted: false
  });
  if (!refreshTokenDoc) {
    throw new AppError(httpStatus.NOT_FOUND, httpMessages(httpStatus.NOT_FOUND));
  }
  await refreshTokenDoc.deleteOne();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken: string): Promise<object> => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, TOKEN.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.deleteOne();
    return tokenService.generateAuthTokens(user);
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken: string, newPassword: string): Promise<void> => {
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, TOKEN.RESET_PASSWORD);
    const user = await userService.getUserById(resetPasswordTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await userService.updateUserById(user.id, { password: newPassword });
    await tokenModel.deleteOne({ user: user.id, type: TOKEN.RESET_PASSWORD });
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken: string): Promise<void> => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, TOKEN.VERIFY_EMAIL);
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await tokenModel.deleteMany({ user: user.id, type: TOKEN.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { emailVerified: true });
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

export { loginUserWithEmailAndPassword, logout, refreshAuth, resetPassword, verifyEmail };
