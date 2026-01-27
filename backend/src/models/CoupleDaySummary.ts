import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupleDaySummary extends Document {
  pairKey: string;
  dateKey: string;
  totalMinutesTogether: number;
  activeMinutesTogether: number;
  lastSeenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CoupleDaySummarySchema = new Schema<ICoupleDaySummary>(
  {
    pairKey: {
      type: String,
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    totalMinutesTogether: {
      type: Number,
      default: 0,
    },
    activeMinutesTogether: {
      type: Number,
      default: 0,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

CoupleDaySummarySchema.index({ pairKey: 1, dateKey: 1 }, { unique: true });

CoupleDaySummarySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return { ...rest, id: _id };
  },
});

export const CoupleDaySummary = mongoose.model<ICoupleDaySummary>(
  'CoupleDaySummary',
  CoupleDaySummarySchema
);
