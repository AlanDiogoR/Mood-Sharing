export interface User {
  id: string;
  email: string;
  name: string;
  partnerId?: string;
  photoUrl?: string | null;
  photoUploadedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  photoUrl?: string | null;
  photoUploadedAt?: string | null;
}

export interface Mood {
  id: string;
  userId: string;
  type: MoodType;
  emoji: string;
  message?: string;
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
  title: string;
  type: MediaType;
  notes?: string | null;
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
