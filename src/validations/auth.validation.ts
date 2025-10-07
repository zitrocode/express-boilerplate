import Joi from 'joi';

import { password } from '@/validations/custom';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ResetPasswordQuery,
  VerifyEmailQuery,
  type LoginUserDto,
  type RefreshTokenDto,
  type RegisterUserDto
} from '@/dtos/auth.dto';

export const register = {
  body: Joi.object<RegisterUserDto>().keys({
    name: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    confirmPassword: Joi.string().required().valid(Joi.ref('password'))
  })
};

export const login = {
  body: Joi.object<LoginUserDto>().keys({
    email: Joi.string().required(),
    password: Joi.string().required()
  })
};

export const logout = {
  body: Joi.object<RefreshTokenDto>().keys({
    refreshToken: Joi.string().required()
  })
};

export const refreshTokens = {
  body: Joi.object<RefreshTokenDto>().keys({
    refreshToken: Joi.string().required()
  })
};

export const forgotPassword = {
  body: Joi.object<ForgotPasswordDto>().keys({
    email: Joi.string().email().required()
  })
};

export const resetPassword = {
  query: Joi.object<ResetPasswordQuery>().keys({
    token: Joi.string().required()
  }),
  body: Joi.object<ResetPasswordDto>().keys({
    password: Joi.string().required().custom(password).min(8)
  })
};

export const verifyEmail = {
  query: Joi.object<VerifyEmailQuery>().keys({
    token: Joi.string().required()
  })
};
