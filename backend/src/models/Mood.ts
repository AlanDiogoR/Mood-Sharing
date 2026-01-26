import mongoose, {Schema, Document} from 'mongoose';

export enum MoodType {
  HAPPY = 'happy',
  SAD = 'sad',
  ANXIOUS = 'anxious',
  CALM = 'calm',
  EXCITED = 'excited',
  TIRED = 'tired',
  ANGRY = 'angry',
  LOVE = 'love',
  PARANOICA = 'paranoica',
}

export interface ILocation {
  latitude: number;
  longitude: number;
}

export interface IMood extends Document {
  userId: mongoose.Types.ObjectId;
  type: MoodType;
  emoji: string;
  message?: string;
  location?: ILocation;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    latitude: {type: Number, required: true},
    longitude: {type: Number, required: true},
  },
  {_id: false}
);

const MoodSchema = new Schema<IMood>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(MoodType),
      required: true,
    },
    emoji: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
    location: {
      type: LocationSchema,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
MoodSchema.index({userId: 1, createdAt: -1});
MoodSchema.index({userId: 1, updatedAt: -1});

export const Mood = mongoose.model<IMood>('Mood', MoodSchema);
