import httpStatus from 'http-status';

import type { Request, Response } from 'express';
import type { Types } from 'mongoose';

import * as userService from '@/services/user.service';

import pick from '@/shared/utils/pick.util';
import catchAsync from '@/shared/utils/catch-async';
import parseShort from '@/shared/utils/parse-short';
import getHttpMessage from '@/shared/utils/http-message';
import AppError from '@/shared/errors/AppError';

import type { QueryOptions } from '@/shared/types/query-options.types';

const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'role']);
  const rawOptions = pick(req.query, ['sort', 'limit', 'page']);

  // Parse sort if it's in "field:order" format
  const options: QueryOptions = {};
  options.sort = parseShort(rawOptions.sort as string);

  if (rawOptions.page) options.page = Number(rawOptions.page);
  if (rawOptions.limit) options.limit = Number(rawOptions.limit);

  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.userId as unknown as Types.ObjectId;
  const user = await userService.getUserById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, getHttpMessage(httpStatus.NOT_FOUND));
  }
  res.send(user);
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.userId as unknown as Types.ObjectId;

  const user = await userService.updateUserById(id, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.userId as unknown as Types.ObjectId;
  await userService.deleteUserById(id);
  res.status(httpStatus.NO_CONTENT).send();
});

export { createUser, getUsers, getUser, updateUser, deleteUser };
