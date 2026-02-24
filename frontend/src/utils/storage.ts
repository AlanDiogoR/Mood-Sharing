import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthTokens, User} from '../types';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@mood_app:access_token',
  REFRESH_TOKEN: '@mood_app:refresh_token',
  USER_DATA: '@mood_app:user_data',
  IS_LOCKED: '@mood_app:is_locked',
  LAST_ACTIVITY: '@mood_app:last_activity',
  LAST_UPLOADED_PHOTO_URI: '@mood_app:last_uploaded_photo_uri',
  WORKOUT_SUMMARY_PREFIX: '@mood_app:workout_summary:',
  WORKOUT_SESSION_PREFIX: '@mood_app:workout_session:',
  WORKOUT_YEAR_LOG_PREFIX: '@mood_app:workout_year_log:',
};

export const storage = {
  async setTokens(tokens: AuthTokens): Promise<void> {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken],
      [STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken],
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
    ]);
  },

  async setUserData(userData: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  },

  async getUserData(): Promise<User | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },

  async clearUserData(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  async setIsLocked(isLocked: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.IS_LOCKED, JSON.stringify(isLocked));
  },

  async getIsLocked(): Promise<boolean> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOCKED);
    return data ? JSON.parse(data) : false;
  },

  async setLastActivity(timestamp: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, timestamp.toString());
  },

  async getLastActivity(): Promise<number | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    return data ? parseInt(data, 10) : null;
  },

  async setLastUploadedPhotoUri(uri: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_UPLOADED_PHOTO_URI, uri);
  },

  async getLastUploadedPhotoUri(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPLOADED_PHOTO_URI);
  },

  async getWorkoutSummary(dateKey: string): Promise<{
    dateKey: string;
    durationMinutes: number;
    calories: number;
    completedAt: number;
  } | null> {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.WORKOUT_SUMMARY_PREFIX}${dateKey}`);
    return data ? JSON.parse(data) : null;
  },

  async setWorkoutSummary(
    dateKey: string,
    summary: {dateKey: string; durationMinutes: number; calories: number; completedAt: number}
  ): Promise<void> {
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.WORKOUT_SUMMARY_PREFIX}${dateKey}`,
      JSON.stringify(summary)
    );
  },

  async setWorkoutSession(dateKey: string, startTime: number): Promise<void> {
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.WORKOUT_SESSION_PREFIX}${dateKey}`,
      startTime.toString()
    );
  },

  async getWorkoutSession(dateKey: string): Promise<number | null> {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.WORKOUT_SESSION_PREFIX}${dateKey}`);
    return data ? parseInt(data, 10) : null;
  },

  async clearWorkoutSession(dateKey: string): Promise<void> {
    await AsyncStorage.removeItem(`${STORAGE_KEYS.WORKOUT_SESSION_PREFIX}${dateKey}`);
  },

  async getWorkoutYearDays(year: number): Promise<string[]> {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.WORKOUT_YEAR_LOG_PREFIX}${year}`);
    return data ? JSON.parse(data) : [];
  },

  async addWorkoutDay(year: number, dateKey: string): Promise<number> {
    const current = await storage.getWorkoutYearDays(year);
    if (!current.includes(dateKey)) {
      const next = [...current, dateKey];
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.WORKOUT_YEAR_LOG_PREFIX}${year}`,
        JSON.stringify(next)
      );
      return next.length;
    }
    return current.length;
  },

  async getWorkoutYearCount(year: number): Promise<number> {
    const days = await storage.getWorkoutYearDays(year);
    return days.length;
  },

  async clearAll(): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys();
    const appKeys = allKeys.filter(k => k.startsWith('@mood_app:'));
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
    }
  },
};
