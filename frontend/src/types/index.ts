export interface User {
  id: string;
  email: string;
  name: string;
  partnerName?: string | null;
  partnerId?: string;
  photoUrl?: string | null;
  photoUploadedAt?: string | null;
  themePrimary?: string | null;
  themeSecondary?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  partnerName?: string | null;
  photoUrl?: string | null;
  photoUploadedAt?: string | null;
  themePrimary?: string | null;
  themeSecondary?: string | null;
}

export interface Mood {
  id: string;
  userId: string;
  type: MoodType;
  emoji: string;
  message?: string;
  extraEmoji?: string | null;
  extraLabel?: string | null;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
}

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

export interface MoodOption {
  type: MoodType;
  emoji: string;
  label: string;
  color: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  partnerEmail?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type MediaType = 'movie' | 'series';

export interface MediaItem {
  id: string;
  userId: string;
  pairKey?: string;
  title: string;
  type: MediaType;
  notes?: string | null;
  rating?: number | null;
  review?: string | null;
  completed?: boolean;
  orderIndex?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SharedNote {
  id: string;
  pairKey: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharedPhoto {
  id: string;
  pairKey: string;
  senderId: string;
  receiverId: string;
  photoUrl: string;
  photoFilename: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSummaryEntry {
  id?: string;
  dateKey: string;
  durationMinutes: number;
  calories: number;
  completedAt: number | string;
}

export interface WeeklyWorkoutSummary {
  startKey: string;
  endKey: string;
  entries: WorkoutSummaryEntry[];
  totals: {
    totalMinutes: number;
    totalCalories: number;
    totalDays: number;
  };
}

export interface CoupleDaySummary {
  id: string;
  pairKey: string;
  dateKey: string;
  totalMinutesTogether: number;
  activeMinutesTogether: number;
  lastSeenAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyMeetingSummary {
  startKey: string;
  endKey: string;
  entries: CoupleDaySummary[];
  totals: {
    totalMinutesTogether: number;
    activeMinutesTogether: number;
    totalDays: number;
  };
}
