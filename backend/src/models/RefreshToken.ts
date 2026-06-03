import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  // jti (JWT ID) do refresh token; é o identificador usado para revogação/rotação.
  jti: string;
  userId: mongoose.Types.ObjectId;
  revoked: boolean;
  // Quando rotacionado, aponta para o jti que substituiu este token (auditoria).
  replacedBy?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    replacedBy: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL: o MongoDB remove automaticamente os documentos após a expiração do token.
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
