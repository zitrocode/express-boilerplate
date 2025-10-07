import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

import userModel from '@/models/user.model';
import type { UserDocument } from '@/interfaces/user.interface';
import ROLES from '@/enums/role.enum';

type PartialUser = Pick<UserDocument, '_id' | 'email' | 'name' | 'lastName' | 'password' | 'role' | 'emailVerified'>;

const password = 'user123456';
const hashedPassword = bcrypt.hashSync(password, 8);

export const usersFixture: PartialUser[] = [
  {
    _id: new mongoose.Types.ObjectId(),
    email: faker.internet.email().toLowerCase(),
    name: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password,
    role: ROLES.USER,
    emailVerified: false
  },
  {
    _id: new mongoose.Types.ObjectId(),
    email: faker.internet.email().toLowerCase(),
    name: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password,
    role: ROLES.USER,
    emailVerified: false
  }
];

export const adminsFixture: PartialUser[] = [
  {
    _id: new mongoose.Types.ObjectId(),
    email: faker.internet.email().toLowerCase(),
    name: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password,
    role: ROLES.ADMIN,
    emailVerified: false
  },
  {
    _id: new mongoose.Types.ObjectId(),
    email: faker.internet.email().toLowerCase(),
    name: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password,
    role: ROLES.EDITOR,
    emailVerified: false
  },
  {
    _id: new mongoose.Types.ObjectId(),
    email: faker.internet.email().toLowerCase(),
    name: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password,
    role: ROLES.MODERATOR,
    emailVerified: false
  }
];

export const insertUser = async (users: PartialUser[]): Promise<void> => {
  await userModel.insertMany(users.map((user) => ({ ...user, password: hashedPassword })));
};
