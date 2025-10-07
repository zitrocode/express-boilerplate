import Joi from 'joi';

import ROLES from '@/enums/role.enum';
import { password, objectId } from '@/validations/custom';

import type {
  CreateUserDto,
  DeleteUserParamsDto,
  GetUserParamsDto,
  GetUsersQueryDto,
  UpdateUserBodyDto
} from '@/dtos/user.dto';

export const createUser = {
  body: Joi.object<CreateUserDto>().keys({
    name: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password).min(8),
    role: Joi.string()
      .valid(...Object.values(ROLES))
      .default(ROLES.USER)
  })
};

export const getUsers = {
  query: Joi.object<GetUsersQueryDto>().keys({
    name: Joi.string(),
    role: Joi.string(),
    sort: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

export const getUser = {
  params: Joi.object<GetUserParamsDto>().keys({
    userId: Joi.string().custom(objectId)
  })
};

export const updateUser = {
  params: Joi.object<GetUserParamsDto>().keys({
    userId: Joi.required().custom(objectId)
  }),
  body: Joi.object<UpdateUserBodyDto>()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password).min(8),
      name: Joi.string()
    })
    .min(1)
};

export const deleteUser = {
  params: Joi.object<DeleteUserParamsDto>().keys({
    userId: Joi.string().custom(objectId)
  })
};
