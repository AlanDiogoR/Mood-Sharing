import mongoose, { Schema, Document } from 'mongoose';

export type MediaType = 'movie' | 'series';

export interface IMediaItem extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  type: MediaType;
  notes?: string;
  orderIndex?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const MediaItemSchema = new Schema<IMediaItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['movie', 'series'],
      required: true,
      index: true,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
    },
    orderIndex: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

MediaItemSchema.index({ userId: 1, createdAt: 1 });
MediaItemSchema.index({ userId: 1, orderIndex: 1 });

MediaItemSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
  },
});

export const MediaItem = mongoose.model<IMediaItem>('MediaItem', MediaItemSchema);
