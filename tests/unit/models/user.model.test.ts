import { faker } from '@faker-js/faker';
import UserModel from '@/models/user.model';
import ROLES from '@/enums/role.enum';

interface User {
  name: string;
  lastName: string;
  role: ROLES;
  email: string;
  password: string;
}

describe('User model', () => {
  describe('User validation', () => {
    let newUser: User;
    beforeEach(() => {
      newUser = {
        name: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: ROLES.USER
      };
    });

    test('should correctly validate a valid user', async () => {
      await expect(new UserModel(newUser).validate()).resolves.toBeUndefined();
    });

    test('should throw a validation error if email is invalid', async () => {
      newUser.email = 'invalidEmail';
      await expect(new UserModel(newUser).validate()).rejects.toThrow();
    });

    test('should throw a validation error if password length is less than 8 characters', async () => {
      newUser.password = 'passwo1';
      await expect(new UserModel(newUser).validate()).rejects.toThrow();
    });

    test('should throw a validation error if password does not contain numbers', async () => {
      newUser.password = 'password';
      await expect(new UserModel(newUser).validate()).rejects.toThrow();
    });

    test('should throw a validation error if password does not contain letters', async () => {
      newUser.password = '11111111';
      await expect(new UserModel(newUser).validate()).rejects.toThrow();
    });

    test('should throw a validation error if role is unknown', async () => {
      // @ts-expect-error: testing invalid role
      newUser.role = 'invalid';
      await expect(new UserModel(newUser).validate()).rejects.toThrow();
    });
  });

  describe('User toJSON()', () => {
    test('should not return user password when toJSON is called', () => {
      const newUser = {
        name: faker.person.firstName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: ROLES.USER
      };
      expect(new UserModel(newUser).toJSON()).not.toHaveProperty('password');
    });
  });
});
