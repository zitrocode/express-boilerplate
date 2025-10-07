/* eslint-disable no-underscore-dangle */
import { Types } from 'mongoose';
import moment from 'moment';

import config from '@/config/config';

import TOKEN from '@/enums/token.enum';
import * as tokenService from '@/services/token.service';

import { usersFixture, adminsFixture } from '@tests/fixtures/user.fixture';

const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
export const userAccessToken = tokenService.generateToken(
  usersFixture[0]._id as Types.ObjectId,
  accessTokenExpires,
  TOKEN.ACCESS,
  config.jwt.secret
);
export const adminAccessToken = tokenService.generateToken(
  adminsFixture[0]._id as Types.ObjectId,
  accessTokenExpires,
  TOKEN.ACCESS,
  config.jwt.secret
);
