import type { Document, Types } from 'mongoose';
import TOKEN from '@/enums/token.enum';

export interface Token {
  user: Types.ObjectId;
  expires: Date;
}

export interface TokenDocument extends Token, Document {
  token: string;
  type: TOKEN;
  blacklisted: boolean;
}
