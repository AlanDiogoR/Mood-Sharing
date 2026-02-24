import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  partnerName?: string;
  partnerId?: mongoose.Types.ObjectId;
  fcmToken?: string;
  photoUrl?: string;
  photoFilename?: string;
  photoUploadedAt?: Date;
  themePrimary?: string;
  themeSecondary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    partnerName: {
      type: String,
      default: null,
      trim: true,
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fcmToken: {
      type: String,
      default: null,
      index: true,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    photoFilename: {
      type: String,
      default: null,
    },
    photoUploadedAt: {
      type: Date,
      default: null,
    },
    themePrimary: {
      type: String,
      default: null,
      trim: true,
    },
    themeSecondary: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices (email já tem unique: true que cria índice automaticamente)
UserSchema.index({ partnerId: 1 });

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const { _id, password, __v, ...rest } = ret;
    return { ...rest, id: _id };
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);
