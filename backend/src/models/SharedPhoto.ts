import mongoose, { Schema, Document } from 'mongoose';

export interface ISharedPhoto extends Document {
  pairKey: string;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  photoUrl: string;
  photoFilename: string;
  createdAt: Date;
  updatedAt: Date;
}

const SharedPhotoSchema = new Schema<ISharedPhoto>(
  {
    pairKey: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    photoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    photoFilename: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

SharedPhotoSchema.index({ pairKey: 1, createdAt: -1 });
SharedPhotoSchema.index({ receiverId: 1, createdAt: -1 });

SharedPhotoSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return { ...rest, id: _id };
  },
});

export const SharedPhoto = mongoose.model<ISharedPhoto>('SharedPhoto', SharedPhotoSchema);
