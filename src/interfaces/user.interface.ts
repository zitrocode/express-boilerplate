import { Document } from 'mongoose';
import ROLES from '@/enums/role.enum';

export interface User {
  name: string;
  lastName: string;
  email: string;
  password: string;
  role: ROLES;
  avatar?: string;
}

export interface UserDocument extends User, Document {
  isActive?: boolean;
  lastLogin?: Date;
  emailVerified?: boolean;
  deleted?: boolean;
}

export type UserDocumentPartial = Partial<UserDocument>;
