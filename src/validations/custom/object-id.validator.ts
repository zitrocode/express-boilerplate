import { Types } from 'mongoose';
import type { CustomHelpers } from 'joi';

const objectId = (value: string, helpers: CustomHelpers) => {
  if (!Types.ObjectId.isValid(value)) {
    return helpers.error('Invalid ObjectId');
  }
  return value;
};

export default objectId;
