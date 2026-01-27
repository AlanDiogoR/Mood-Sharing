import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkoutSummary extends Document {
  userId: mongoose.Types.ObjectId;
  dateKey: string;
  durationMinutes: number;
  calories: number;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutSummarySchema = new Schema<IWorkoutSummary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    calories: {
      type: Number,
      required: true,
    },
    completedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

WorkoutSummarySchema.index({ userId: 1, dateKey: 1 }, { unique: true });

WorkoutSummarySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return { ...rest, id: _id };
  },
});

export const WorkoutSummary = mongoose.model<IWorkoutSummary>('WorkoutSummary', WorkoutSummarySchema);
