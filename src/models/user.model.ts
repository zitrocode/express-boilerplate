import { model, Schema, Types } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import validator from 'validator';
import bcrypt from 'bcrypt';

import type { CallbackWithoutResultAndOptionalError, PaginateModel } from 'mongoose';
import type { UserDocument } from '@/interfaces/user.interface';

import ROLES from '@/enums/role.enum';
import { toJSON } from '@/models/plugins/toJSON.plugin';

interface UserModel extends PaginateModel<UserDocument> {
  isEmailTaken(email: string, excludeUserId?: Types.ObjectId): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, maxLength: 20 },
    lastName: { type: String, required: true, trim: true, maxLength: 20 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxLength: 50,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email format');
        }
      }
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
      trim: true,
      validate(value: string) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true // used by the toJSON plugin
    },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER, lowercase: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    emailVerified: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function isEmailTaken(
  email: string,
  excludeUserId: Schema.Types.ObjectId
): Promise<boolean> {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.pre('save', async function isEmailTaken(next: CallbackWithoutResultAndOptionalError): Promise<void> {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

const userModel = model<UserDocument, UserModel>('User', userSchema);
export default userModel;
