import mongoose, { Schema, Document } from 'mongoose';

export type PartnerInviteStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface IPartnerInvite extends Document {
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  status: PartnerInviteStatus;
  respondedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerInviteSchema = new Schema<IPartnerInvite>(
  {
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
      index: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// No máximo um convite pendente por par (em cada direção).
PartnerInviteSchema.index(
  { fromUserId: 1, toUserId: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

PartnerInviteSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const { _id, __v, ...rest } = ret;
    return { ...rest, id: _id };
  },
});

export const PartnerInvite = mongoose.model<IPartnerInvite>('PartnerInvite', PartnerInviteSchema);
