import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName?: string;
  bio?: string;
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  displayName: { type: String, trim: true },
  bio: { type: String, trim: true, maxlength: 280 },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, select: false },
  resetToken: { type: String, select: false },
  resetTokenExpiry: { type: Date, select: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = model<IUser>('User', userSchema);
