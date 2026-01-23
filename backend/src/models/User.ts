import mongoose, {Schema, Document} from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  partnerId?: mongoose.Types.ObjectId;
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
  },
  {
    timestamps: true,
  }
);

// Índices (email já tem unique: true que cria índice automaticamente)
UserSchema.index({partnerId: 1});

export const User = mongoose.model<IUser>('User', UserSchema);
