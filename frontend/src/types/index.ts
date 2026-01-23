export interface User {
  id: string;
  email: string;
  name: string;
  partnerId?: string;
  createdAt: string;
  updatedAt: string;
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
