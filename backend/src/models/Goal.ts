import mongoose, { Schema, Document } from 'mongoose';

export interface IGoalItem {
  id: string;
  title: string;
  category: string;
  completed: boolean;
}

export interface IGoalList extends Document {
  userId: mongoose.Types.ObjectId;
  items: IGoalItem[];
  createdAt: Date;
  updatedAt: Date;
}

const GoalItemSchema = new Schema<IGoalItem>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const GoalListSchema = new Schema<IGoalList>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      unique: true,
    },
    items: {
      type: [GoalItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

GoalListSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return { ...rest, id: _id };
  },
});

export const GoalList = mongoose.model<IGoalList>('GoalList', GoalListSchema);
