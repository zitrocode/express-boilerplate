/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import supertest from 'supertest';
import { faker } from '@faker-js/faker';
import httpStatus from 'http-status';

import application from '@/application';
import userModel from '@/models/user.model';
import ROLES from '@/enums/role.enum';

import { usersFixture, adminsFixture, insertUser } from '@tests/fixtures/user.fixture';
import { userAccessToken, adminAccessToken } from '@tests/fixtures/token.fixture';
import setupTestDB from '@tests/utils/setupTest';

setupTestDB();

interface User {
  name: string;
  lastName: string;
  role: ROLES;
  email: string;
  password: string;
}

describe('User Controller', () => {
  describe('POST /api/v1/users - Create user', () => {
    let newUser: User;

    beforeEach(() => {
      newUser = {
        name: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        role: ROLES.USER,
        password: 'password1'
      };
    });

    test('should return 201 and successfully create new user if request data is ok', async () => {
      await insertUser([adminsFixture[0]]);
      const res = await supertest(application)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toMatchObject({
        id: expect.anything(),
        name: newUser.name,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role
      });

      const dbUser = await userModel.findById(res.body.id);
      expect(dbUser).toBeDefined();
      expect(dbUser?.password).not.toBe(newUser.password);
      expect(dbUser).toMatchObject({
        name: newUser.name,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role
      });
    });

    test('should be able to create an admin as well', async () => {
      await insertUser([adminsFixture[0]]);
      newUser.role = ROLES.ADMIN;
      const res = await supertest(application)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body.role).toBe('admin');

      const dbUser = await userModel.findById(res.body.id);
      expect(dbUser?.role).toBe('admin');
    });

    test('should return 401 error if access token is missing', async () => {
      await supertest(application).post('/api/v1/users').send(newUser).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if logged in user is not admin', async () => {
      await insertUser([usersFixture[0]]);

      await supertest(application)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(newUser)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 400 error if email is invalid', async () => {
      await insertUser([adminsFixture[0]]);
      newUser.email = 'invalidEmail';

      await supertest(application)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if email is already used', async () => {
      await insertUser([adminsFixture[0], usersFixture[0]]);
      newUser.email = usersFixture[0].email as string;

      await supertest(application)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      await insertUser([adminsFixture[0]]);
      newUser.password = 'pass1';

      await supertest(application)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password does not contain both letters and numbers', async () => {
      await insertUser([adminsFixture[0]]);
      newUser.password = 'password';

      await supertest(application)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);

      newUser.password = '11111111';

      await supertest(application)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if role is neither user nor admin', async () => {
      await insertUser([adminsFixture[0]]);
      // @ts-ignore
      newUser.role = 'invalidRole';

      await supertest(application)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/v1/users - Get users', () => {
    test('should return 200 and apply the default query options', async () => {
      await insertUser([...usersFixture, adminsFixture[0]]);

      const res = await supertest(application)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        docs: expect.any(Array),
        page: 1,
        limit: 10,
        totalDocs: 3,
        totalPages: 1
      });

      expect(res.body.docs).toHaveLength(3);
      expect(res.body.docs[0]).toMatchObject({
        id: String(usersFixture[0]._id),
        name: usersFixture[0].name,
        lastName: usersFixture[0].lastName,
        email: usersFixture[0].email,
        role: usersFixture[0].role
      });
    });

    test('should return 401 if access token is missing', async () => {
      await insertUser([...usersFixture, adminsFixture[0]]);
      await supertest(application).get('/api/v1/users').send().expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 a non-admin is trying to access all users', async () => {
      await insertUser([...usersFixture, adminsFixture[0]]);
      await supertest(application)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should correctly apply filter on name field', async () => {
      await insertUser([...usersFixture, adminsFixture[0]]);

      const res = await supertest(application)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ name: usersFixture[0].name })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        docs: expect.any(Array),
        page: 1,
        limit: 10,
        totalDocs: 1,
        totalPages: 1
      });

      expect(res.body.docs).toHaveLength(1);
      expect(res.body.docs[0].id).toBe(String(usersFixture[0]._id));
    });

    test('should correctly apply filter on role field', async () => {
      await insertUser([...usersFixture, adminsFixture[0]]);

      const res = await supertest(application)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ role: 'user' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        docs: expect.any(Array),
        page: 1,
        limit: 10,
        totalDocs: 2,
        totalPages: 1
      });

      expect(res.body.docs).toHaveLength(2);
      expect(res.body.docs[0].id).toBe(String(usersFixture[0]._id));
      expect(res.body.docs[1].id).toBe(String(usersFixture[1]._id));
    });

    test('should correctly sort the returned array if descending sort param is specified', async () => {
      await insertUser([...usersFixture, adminsFixture[0]]);

      const res = await supertest(application)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ sort: 'role:desc' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        docs: expect.any(Array),
        page: 1,
        limit: 10,
        totalDocs: 3,
        totalPages: 1
      });

      expect(res.body.docs).toHaveLength(3);
      expect(res.body.docs[0].id).toBe(String(usersFixture[0]._id));
      expect(res.body.docs[1].id).toBe(String(usersFixture[1]._id));
      expect(res.body.docs[2].id).toBe(String(adminsFixture[0]._id));
    });

    test('should correctly sort the returned array if ascending sort param is specified', async () => {
      await insertUser([...usersFixture, adminsFixture[0]]);

      const res = await supertest(application)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ sort: 'role:asc' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        docs: expect.any(Array),
        page: 1,
        limit: 10,
        totalDocs: 3,
        totalPages: 1
      });

      expect(res.body.docs).toHaveLength(3);
      expect(res.body.docs[0].id).toBe(String(adminsFixture[0]._id));
      expect(res.body.docs[1].id).toBe(String(usersFixture[0]._id));
      expect(res.body.docs[2].id).toBe(String(usersFixture[1]._id));
    });

    test('should correctly sort the returned array if multiple sort params are specified', async () => {
      await insertUser([...usersFixture, adminsFixture[0]]);

      const res = await supertest(application)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ sort: 'role:asc,name:desc' })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        docs: expect.any(Array),
        page: 1,
        limit: 10,
        totalDocs: 3,
        totalPages: 1
      });

      expect(res.body.docs).toHaveLength(3);
      const expectedOrder = [...usersFixture, adminsFixture[0]].sort((a, b) => {
        if (a.role < b.role) return -1;
        if (a.role > b.role) return 1;
        return a.name < b.name ? 1 : -1;
      });

      expectedOrder.forEach((user, index) => {
        expect(res.body.docs[index].id).toBe(String(user._id));
      });
    });

    test('should limit returned array if limit param is specified', async () => {
      await insertUser([...usersFixture, adminsFixture[0]]);

      const res = await supertest(application)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ limit: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        docs: expect.any(Array),
        page: 1,
        limit: 2,
        totalDocs: 3,
        totalPages: 2
      });

      expect(res.body.docs).toHaveLength(2);
      expect(res.body.docs[0].id).toBe(String(usersFixture[0]._id));
      expect(res.body.docs[1].id).toBe(String(usersFixture[1]._id));
    });

    test('should return the correct page if page param is specified', async () => {
      await insertUser([...usersFixture, adminsFixture[0]]);

      const res = await supertest(application)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ limit: 2, page: 2 })
        .send()
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({
        docs: expect.any(Array),
        page: 2,
        limit: 2,
        totalDocs: 3,
        totalPages: 2
      });

      expect(res.body.docs).toHaveLength(1);
      expect(res.body.docs[0].id).toBe(String(adminsFixture[0]._id));
    });
  });

  describe('GET /api/v1/users/:userId - Get user', () => {
    test('should return 200 and the user object if data is ok', async () => {
      await insertUser([usersFixture[0], adminsFixture[0]]);

      const res = await supertest(application)
        .get(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send()
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toMatchObject({
        id: String(usersFixture[0]._id),
        name: usersFixture[0].name,
        lastName: usersFixture[0].lastName,
        email: usersFixture[0].email,
        role: usersFixture[0].role
      });
    });

    test('should return 401 if access token is missing', async () => {
      await insertUser([usersFixture[0]]);
      await supertest(application).get(`/api/v1/users/${usersFixture[0]._id}`).send().expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user is trying to get another user', async () => {
      await insertUser(usersFixture);

      await supertest(application)
        .get(`/api/v1/users/${usersFixture[1]._id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 200 and the user object if admin is trying to get another user', async () => {
      await insertUser([usersFixture[0], adminsFixture[0]]);

      await supertest(application)
        .get(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.OK);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await insertUser([adminsFixture[0]]);

      await supertest(application)
        .get('/api/v1/users/invalidId')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if user is not found', async () => {
      await insertUser([adminsFixture[0]]);

      await supertest(application)
        .get(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /api/v1/users/:userId - Delete user', () => {
    test('should return 204 if data is ok', async () => {
      await insertUser([usersFixture[0]]);

      await supertest(application)
        .delete(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await userModel.findById(usersFixture[0]._id);
      expect(dbUser).toBeNull();
    });

    test('should return 401 error if access token is missing', async () => {
      await insertUser([usersFixture[0]]);

      await supertest(application)
        .delete(`/api/v1/users/${usersFixture[0]._id}`)
        .send()
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if user is trying to delete another user', async () => {
      await insertUser(usersFixture);

      await supertest(application)
        .delete(`/api/v1/users/${usersFixture[1]._id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send()
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 204 if admin is trying to delete another user', async () => {
      await insertUser([...usersFixture, adminsFixture[0]]);

      await supertest(application)
        .delete(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NO_CONTENT);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await insertUser([adminsFixture[0]]);

      await supertest(application)
        .delete('/api/v1/users/invalidId')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if user already is not found', async () => {
      await insertUser([adminsFixture[0]]);

      await supertest(application)
        .delete(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send()
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /api/v1/users/:userId', () => {
    test('should return 200 and successfully update user if data is ok', async () => {
      await insertUser([usersFixture[0]]);
      const updateBody = {
        name: faker.person.firstName(),
        email: faker.internet.email().toLowerCase(),
        password: 'newPassword1'
      };

      const res = await supertest(application)
        .patch(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toMatchObject({
        id: String(usersFixture[0]._id),
        name: updateBody.name,
        email: updateBody.email,
        role: 'user',
        emailVerified: false
      });

      const dbUser = await userModel.findById(usersFixture[0]._id);
      expect(dbUser).toBeDefined();
      expect(dbUser?.password).not.toBe(updateBody.password);
      expect(dbUser).toMatchObject({ name: updateBody.name, email: updateBody.email, role: 'user' });
    });

    test('should return 401 error if access token is missing', async () => {
      await insertUser([usersFixture[0]]);
      const updateBody = { name: faker.person.firstName() };

      await supertest(application)
        .patch(`/api/v1/users/${usersFixture[0]._id}`)
        .send(updateBody)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if user is updating another user', async () => {
      await insertUser(usersFixture);
      const updateBody = { name: faker.person.firstName() };

      await supertest(application)
        .patch(`/api/v1/users/${usersFixture[1]._id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 200 and successfully update user if admin is updating another user', async () => {
      await insertUser([usersFixture[0], adminsFixture[0]]);
      const updateBody = { name: faker.person.firstName() };

      await supertest(application)
        .patch(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test('should return 404 if admin is updating another user that is not found', async () => {
      await insertUser([adminsFixture[0]]);
      const updateBody = { name: faker.person.firstName() };

      await supertest(application)
        .patch(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await insertUser([adminsFixture[0]]);
      const updateBody = { name: faker.person.firstName() };

      await supertest(application)
        .patch(`/api/v1/users/invalidId`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is invalid', async () => {
      await insertUser([usersFixture[0]]);
      const updateBody = { email: 'invalidEmail' };

      await supertest(application)
        .patch(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is already taken', async () => {
      await insertUser(usersFixture);
      const updateBody = { email: usersFixture[1].email };

      await supertest(application)
        .patch(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should not return 400 if email is my email', async () => {
      await insertUser([usersFixture[0]]);
      const updateBody = { email: usersFixture[0].email };

      await supertest(application)
        .patch(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);
    });

    test('should return 400 if password length is less than 8 characters', async () => {
      await insertUser([usersFixture[0]]);
      const updateBody = { password: 'passwo1' };

      await supertest(application)
        .patch(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if password does not contain both letters and numbers', async () => {
      await insertUser([usersFixture[0]]);
      const updateBody = { password: 'password' };

      await supertest(application)
        .patch(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);

      updateBody.password = '11111111';

      await supertest(application)
        .patch(`/api/v1/users/${usersFixture[0]._id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
