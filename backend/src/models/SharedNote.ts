import mongoose, { Schema, Document } from 'mongoose';

export interface ISharedNote extends Document {
  pairKey: string;
  authorId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const SharedNoteSchema = new Schema<ISharedNote>(
  {
    pairKey: {
      type: String,
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

SharedNoteSchema.index({ pairKey: 1, updatedAt: -1 });

SharedNoteSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return { ...rest, id: _id };
  },
});

export const SharedNote = mongoose.model<ISharedNote>('SharedNote', SharedNoteSchema);
