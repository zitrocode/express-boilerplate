import { model, Schema, SchemaTypes } from 'mongoose';

import TOKEN from '@/enums/token.enum';
import type { TokenDocument } from '@/interfaces/token.interface';

import { toJSON } from '@/models/plugins/toJSON.plugin';

const tokenSchema = new Schema<TokenDocument>(
  {
    token: { type: String, required: true, index: true },
    user: { type: SchemaTypes.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: Object.values(TOKEN).filter((value) => value !== TOKEN.ACCESS),
      required: true
    },
    expires: { type: Date, required: true },
    blacklisted: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

// add plugin that converts mongoose to json
tokenSchema.plugin(toJSON);

const tokenModel = model('Token', tokenSchema);
export default tokenModel;
