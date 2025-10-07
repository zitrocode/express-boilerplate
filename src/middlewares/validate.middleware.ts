import { Request, Response, NextFunction } from 'express';
import Joi, { Schema } from 'joi';
import httpStatus from 'http-status';

import pick from '@/shared/utils/pick.util';
import httpMessage from '@/shared/utils/http-message';
import AppError from '@/shared/errors/AppError';

type SchemaMap = {
  params?: Schema;
  query?: Schema;
  body?: Schema;
};

const validate = (schema: SchemaMap) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object: Partial<Record<keyof SchemaMap, unknown>> = {};

    if (validSchema.params) object.params = req.params;
    if (validSchema.query) object.query = req.query;
    if (validSchema.body) object.body = req.body ?? {};

    const { value, error } = Joi.compile(validSchema)
      .prefs({ errors: { label: 'key' }, abortEarly: false })
      .validate(object);

    if (error) {
      return next(new AppError(httpStatus.BAD_REQUEST, httpMessage(httpStatus.BAD_REQUEST)));
    }

    if (value.params) Object.assign(req.params, value.params);
    if (value.query) Object.assign(req.query, value.query);
    if (value.body) req.body = value.body;

    return next();
  };
};

export default validate;
