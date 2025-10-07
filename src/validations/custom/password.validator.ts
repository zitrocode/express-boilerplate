import { type CustomHelpers } from 'joi';

const password = (value: string, helpers: CustomHelpers) => {
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.error('password must contain at least 1 letter and 1 number');
  }

  return value;
};

export default password;
