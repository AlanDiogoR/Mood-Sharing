import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  partnerId?: mongoose.Types.ObjectId;
  fcmToken?: string; // Token FCM ou Expo Push Token para notificações push
  photoUrl?: string;
  photoFilename?: string;
  photoUploadedAt?: Date;
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
    name: {
      type: String,
      required: true,
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
    const { _id, ...rest } = ret;
    return { ...rest, id: _id };
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);
