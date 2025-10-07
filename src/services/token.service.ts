import jwt from 'jsonwebtoken';
import moment from 'moment';
import httpStatus from 'http-status';

import type { Types } from 'mongoose';

import config from '@/config/config';
import TOKEN from '@/enums/token.enum';
import tokenModel from '@/models/token.model';
import AppError from '@/shared/errors/AppError';

import type { TokenDocument } from '@/interfaces/token.interface';
import type { UserDocument } from '@/interfaces/user.interface';

import * as userService from './user.service';

/**
 * Generate token
 *@param {ObjectId} userId
 *@param {Moment} expires
 *@param {string} type
 *@param {string} [secret]
 *@returns {string}
 */
const generateToken = (
  userId: Types.ObjectId,
  expires: moment.Moment,
  type: string,
  secret = config.jwt.secret
): string => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */

const saveToken = async (
  token: string,
  userId: Types.ObjectId,
  expires: moment.Moment,
  type: string,
  blacklisted: boolean = false
): Promise<TokenDocument> => {
  const tokenDoc = await tokenModel.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token: string, type: string): Promise<TokenDocument> => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await tokenModel.findOne({ token, type, user: payload.sub, blacklisted: false });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {UserDocument} user
 * @returns {Promise<object>}
 */
const generateAuthTokens = async (user: UserDocument): Promise<object> => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, TOKEN.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, TOKEN.REFRESH);
  await saveToken(refreshToken, user.id, refreshTokenExpires, TOKEN.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate()
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate()
    }
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email: string): Promise<string> => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user.id, expires, TOKEN.RESET_PASSWORD);
  await saveToken(resetPasswordToken, user.id, expires, TOKEN.RESET_PASSWORD);
  return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {UserDocument} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user: UserDocument): Promise<string> => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken(user.id, expires, TOKEN.VERIFY_EMAIL);
  await saveToken(verifyEmailToken, user.id, expires, TOKEN.VERIFY_EMAIL);
  return verifyEmailToken;
};

export {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken
};
