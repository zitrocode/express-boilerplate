import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

import type { VerifiedCallback } from 'passport-jwt';

import config from '@/config/config';
import userModel from '@/models/user.model';
import TOKEN from '@/enums/token.enum';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jwtVerify = async (payload: any, done: VerifiedCallback): Promise<void> => {
  try {
    if (payload.type !== TOKEN.ACCESS) {
      throw new Error('Invalid token type');
    }
    const user = await userModel.findById(payload.sub);
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
export default jwtStrategy;
