import httpStatus from 'http-status';

import type { FilterQuery, PaginateOptions, PaginateResult, Types } from 'mongoose';

import userModel from '@/models/user.model';
import httpMessage from '@/shared/utils/http-message';
import AppError from '@/shared/errors/AppError';

import type { User, UserDocument, UserDocumentPartial } from '@/interfaces/user.interface';

/**
 * Create a new user
 * @param userData - Data for the new user
 * @returns {Promise<User>} The created user
 * @throws ApiError if email is already taken
 */

const createUser = async (body: User): Promise<UserDocument> => {
  if (await userModel.isEmailTaken(body.email)) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return userModel.create(body);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sort] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<PaginateResult<UserDocument>>} - Paginated results
 */
const queryUsers = async (
  filter: FilterQuery<UserDocument>,
  options: PaginateOptions
): Promise<PaginateResult<UserDocument>> => {
  const users = await userModel.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<UserDocument | null>}
 */
const getUserById = async (id: Types.ObjectId): Promise<UserDocument | null> => {
  return (await userModel.findById(id)) || null;
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<UserDocument | null>}
 */
const getUserByEmail = async (email: string): Promise<UserDocument | null> => {
  return (await userModel.findOne({ email })) || null;
};

/**
 * Update user by id
 * @param {ObjectId} id
 * @param {UserDocumentPartial} body
 * @returns {Promise<UserDocument>}
 */
const updateUserById = async (id: Types.ObjectId, body: UserDocumentPartial): Promise<UserDocument> => {
  const user = await getUserById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, httpMessage(httpStatus.NOT_FOUND));
  }
  if (body.email && (await userModel.isEmailTaken(body.email, id))) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, body);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} id
 * @returns {Promise<UserDocument>}
 */
const deleteUserById = async (id: Types.ObjectId): Promise<UserDocument> => {
  const user = await getUserById(id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, httpMessage(httpStatus.NOT_FOUND));
  }
  await user.deleteOne();
  return user;
};

export { createUser, queryUsers, getUserById, getUserByEmail, updateUserById, deleteUserById };
