# RESTful API Node Server Boilerplate

A boilerplate/starter project for quickly building RESTful APIs using Node.js, Express, and Mongoose.

By running a single command, you will get a production-ready Node.js app installed and fully configured on your machine. The app comes with many built-in features, such as authentication using JWT, request validation, unit and integration tests, continuous integration, docker support, API documentation, pagination, etc. For more details, check the features list below.

## Quick Start

Clone the repo:

```bash
git clone --depth 1 https://github.com/zitrocode/express-boilerplate.git
cd node-express-boilerplate
npx rimraf ./.git
```

Install the dependencies:

```bash
yarn install
```

Set the environment variables:

```bash
cp .env.example .env

# open .env and modify the environment variables (if needed)
```

## Table of Contents

- [Features](#features)
- [Commands](#commands)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Error Handling](#error-handling)
- [Validation](#validation)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Logging](#logging)
- [Custom Mongoose Plugins](#custom-mongoose-plugins)
- [Linting](#linting)
- [Contributing](#contributing)

## Features

- **NoSQL database**: [MongoDB](https://www.mongodb.com) object data modeling using [Mongoose](https://mongoosejs.com)
- **Authentication and authorization**: using [passport](http://www.passportjs.org)
- **Validation**: request data validation using [Joi](https://github.com/hapijs/joi)
- **Logging**: using [winston](https://github.com/winstonjs/winston) and [morgan](https://github.com/expressjs/morgan)
- **Testing**: unit and integration tests using [Jest](https://jestjs.io)
- **Error handling**: centralized error handling mechanism
- **Process management**: advanced production process management using [PM2](https://pm2.keymetrics.io)
- **Dependency management**: with [Yarn](https://yarnpkg.com)
- **Environment variables**: using [dotenv](https://github.com/motdotla/dotenv) and [cross-env](https://github.com/kentcdodds/cross-env#readme)
- **Security**: set security HTTP headers using [helmet](https://helmetjs.github.io)
- **CORS**: Cross-Origin Resource-Sharing enabled using [cors](https://github.com/expressjs/cors)
- **Compression**: gzip compression with [compression](https://github.com/expressjs/compression)
- **Linting**: with [ESLint](https://eslint.org) and [Prettier](https://prettier.io)

## Commands

Running locally:

```bash
yarn dev
```

Running in production:

```bash
yarn start
```

Testing:

```bash
# run all tests
yarn test

# run all tests in watch mode
yarn test:watch
```

Linting:

```bash
# run ESLint
yarn lint

# fix ESLint errors
yarn lint:fix

# run prettier
yarn prettier

# fix prettier errors
yarn prettier:fix
```

## Environment Variables

The environment variables can be found and modified in the `.env` file. They come with these default values:

```bash
# Port number
PORT=3000

# URL of the Mongo DB
MONGODB_URL=mongodb://127.0.0.1:27017/node-boilerplate

# JWT
# JWT secret key
JWT_SECRET=thisisasamplesecret
# Number of minutes after which an access token expires
JWT_ACCESS_EXPIRATION_MINUTES=30
# Number of days after which a refresh token expires
JWT_REFRESH_EXPIRATION_DAYS=30

# SMTP configuration options for the email service
# For testing, you can use a fake SMTP service like Ethereal: https://ethereal.email/create
SMTP_HOST=email-server
SMTP_PORT=587
SMTP_USERNAME=email-server-username
SMTP_PASSWORD=email-server-password
EMAIL_FROM=support@yourapp.com
```

## Project Structure

```
src/
 ├─ config/             # Configuration files and environment variables
 ├─ constants/          # Application-wide constants
 ├─ controllers/        # Route controllers (handles request/response logic)
 ├─ Interfaces/         # TypeScript interfaces and type definitions
 ├─ lib/                # Library utilities and external integrations
 ├─ middlewares/        # Custom Express middlewares
 ├─ models/             # Mongoose models (data layer)
 ├─ routes/             # API route definitions
 ├─ services/           # Business logic and service layer
 ├─ utils/              # General utility functions and helpers
 ├─ validations/        # Data Transfer Objects / request validation schemas
 ├─ application.ts      # Express app initialization
 ├─ index.ts            # Server entry point
```

## API Documentation

Currently, the API documentation is not available.

Once implemented, it will provide detailed information about the available endpoints, request/response formats, and authentication requirements. Future documentation will likely be generated automatically using Swagger from comments in the route files.

### API Endpoints

List of available routes:

**Auth routes**:\
`POST /api/v1/auth/register` - register\
`POST /api/v1/auth/login` - login\
`POST /api/v1/auth/refresh-tokens` - refresh auth tokens\
`POST /api/v1/auth/forgot-password` - send reset password email\
`POST /api/v1/auth/reset-password` - reset password\
`POST /api/v1/auth/send-verification-email` - send verification email\
`POST /api/v1/auth/verify-email` - verify email

**User routes**:\
`POST /api/v1/users` - create a user\
`GET /api/v1/users` - get all users\
`GET /api/v1/users/:userId` - get user\
`PATCH /api/v1/users/:userId` - update user\
`DELETE /api/v1/users/:userId` - delete user

## Error Handling

The app has a centralized error handling mechanism.

Controllers should try to catch the errors and forward them to the error handling middleware (by calling `next(error)`). For convenience, you can also wrap the controller inside the catchAsync utility wrapper, which forwards the error.

```typescript
const catchAsync = require('@/shared/utils/catch-async');

const controller = catchAsync(async (res: Request, res: Respose): void => {
  // this error will be forwarded to the error handling middleware
  throw new Error('Something wrong happened');
});
```

The error handling middleware sends an error response, which has the following format:

```json
{
  "code": 404,
  "message": "The server could not find the requested resource."
}
```

When running in development mode, the error response also contains the error stack.

The app has a utility ApiError class to which you can attach a response code and a message, and then throw it from anywhere (catchAsync will catch it).

For example, if you are trying to get a user from the DB who is not found, and you want to send a 404 error, the code should look something like:

```typescript
import httpStatus from 'http-status';
import userModel from '@/models/user.model';
import httpMessage from '@utils/http-message';
import AppError from '@/utils/AppError';

const getUser = async (userId: Types.ObjectId): Promise<UserDocument> => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, httpMessage(httpStatus.NOT_FOUND));
  }
};
```

## Validation

Request data is validated using [Joi](https://joi.dev/). Check the [documentation](https://joi.dev/api/) for more details on how to write Joi validation schemas.

The validation schemas are defined in the `src/validations` directory and are used in the routes by providing them as parameters to the `validate` middleware.

```typescript
import express from 'express';
import validate from '@/middlewares/validate';
import userValidation from '@/validations/user.validation';
import userController from '@/controllers/user.controller';

const router = express.Router();

router.post('/users', validate(userValidation.createUser), userController.createUser);
```

## Authentication

To require authentication for certain routes, you can use the `auth` middleware.

```javascript
import express from 'express';
import auth from '@/middlewares/auth';
import userController from '@/controllers/user.controller';

const router = express.Router();

router.post('/users', auth(), userController.createUser);
```

These routes require a valid JWT access token in the Authorization request header using the Bearer schema. If the request does not contain a valid access token, an Unauthorized (401) error is thrown.

**Generating Access Tokens**:

An access token can be generated by making a successful call to the register (`POST /api/v1/auth/register`) or login (`POST /api/v1/auth/login`) endpoints. The response of these endpoints also contains refresh tokens (explained below).

An access token is valid for 30 minutes. You can modify this expiration time by changing the `JWT_ACCESS_EXPIRATION_MINUTES` environment variable in the .env file.

**Refreshing Access Tokens**:

After the access token expires, a new access token can be generated, by making a call to the refresh token endpoint (`POST /api/v1/auth/refresh-tokens`) and sending along a valid refresh token in the request body. This call returns a new access token and a new refresh token.

A refresh token is valid for 30 days. You can modify this expiration time by changing the `JWT_REFRESH_EXPIRATION_DAYS` environment variable in the .env file.

## Authorization

The `auth` middleware can also be used to require certain rights/permissions to access a route.

```typescript
import express from 'express';
import authorize from '@/middlewares/authorize.middleware';
import userController from '@/controllers/user.controller';

const router = express.Router();

router.post('/users', authorize(PERMISSIONS.CREATE_USERS), userController.createUser);
```

In the example above, an authenticated user can access this route only if that user has the `manage_users` permission.

The permissions are role-based. You can view the permissions/rights of each role in the `src/config/roles.ts` file.

If the user making the request does not have the required permissions to access this route, a Forbidden (403) error is thrown.

## Logging

Import the logger from `src/lib/logger.ts`. It is using the [Winston](https://github.com/winstonjs/winston) logging library.

Logging should be done according to the following severity levels (ascending order from most important to least important):

```typescript
import logger from '@/lib/logger';

logger.error('message'); // level 0
logger.warn('message'); // level 1
logger.info('message'); // level 2
logger.http('message'); // level 3
logger.verbose('message'); // level 4
logger.debug('message'); // level 5
```

In development mode, log messages of all severity levels will be printed to the console.

In production mode, only `info`, `warn`, and `error` logs will be printed to the console.\
It is up to the server (or process manager) to actually read them from the console and store them in log files.\
This app uses pm2 in production mode, which is already configured to store the logs in log files.

Note: API request information (request url, response code, timestamp, etc.) are also automatically logged (using [morgan](https://github.com/expressjs/morgan)).

## Custom Mongoose Plugins

The app also contains 2 custom mongoose plugins that you can attach to any mongoose model schema. You can find the plugins in `src/models/plugins`.

```typescript
import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import toJSON from '@/models/plugins/toJSON.plugin';

const userSchema = new Schema<UserDocument>(
  {
    /* schema definition here */
  },
  { timestamps: true }
);

userSchema.plugin(toJSON);
userSchema.plugin(paginate);

const userModel = model<UserDocument>('User', userSchema);
```

### toJSON

The toJSON plugin applies the following changes in the toJSON transform call:

- removes \_\_v, createdAt, updatedAt, and any schema path that has private: true
- replaces \_id with id

### paginate

The paginate plugin adds the `paginate` static method to the mongoose schema.

Adding this plugin to the `userModel` model schema will allow you to do the following:

```typescript
const queryUsers = async (
  filter: FilterQuery<UserDocument>,
  options: PaginateOptions
): Promise<PaginateResult<UserDocument>> => {
  const users = await userModel.paginate(filter, options);
  return users;
};
```

The `filter` param is a regular mongo filter.

The `options` param can have the following (optional) fields:

```typescript
const options = {
  sort: 'name:desc', // sort order
  limit: 5, // maximum results per page
  page: 2 // page number
};
```

The plugin also supports sorting by multiple criteria (separated by a comma): `sort: name:desc,role:asc`

The `paginate` method returns a Promise, which fulfills with an object having the following properties:

```json
{
  "docs": [],
  "page": 2,
  "limit": 5,
  "totalDocs": 10,
  "totalResults": 48
}
```

## Linting

Linting is done using [ESLint](https://eslint.org/) and [Prettier](https://prettier.io).

In this app, ESLint is configured to follow the [Airbnb JavaScript style guide](https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb-base) with some modifications. It also extends [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier) to turn off all rules that are unnecessary or might conflict with Prettier.

To modify the ESLint configuration, update the `.eslintrc.json` file. To modify the Prettier configuration, update the `.prettierrc.json` file.

To prevent a certain file or directory from being linted, add it to `.eslintignore` and `.prettierignore`.

## Contributing

Contributions are more than welcome! Please check out the [contributing guide](CONTRIBUTING.md).

## Acknowledgements

This project was inspired by the original work of hagopj13/node-express-boilerplate.
Key ideas like project structure, authentication flow, and testing setup were adapted from that repository.

However, this boilerplate has been rewritten and extended in TypeScript, adding improvements such as strict typing, consistent error handling, and permission-based access control.

Thanks to the original creator for the solid foundation; this repository also reflects my own approach and adaptations for scalable, production-ready Express applications.

## License

[MIT](LICENSE)
