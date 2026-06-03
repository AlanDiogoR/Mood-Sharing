import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';
import {AuthTokens, User} from '../types';

const STORAGE_KEYS = {
  // Chaves legadas no AsyncStorage (mantidas apenas para migração dos tokens)
  LEGACY_ACCESS_TOKEN: '@mood_app:access_token',
  LEGACY_REFRESH_TOKEN: '@mood_app:refresh_token',
  USER_DATA: '@mood_app:user_data',
  IS_LOCKED: '@mood_app:is_locked',
  LAST_ACTIVITY: '@mood_app:last_activity',
  LAST_UPLOADED_PHOTO_URI: '@mood_app:last_uploaded_photo_uri',
  WORKOUT_SUMMARY_PREFIX: '@mood_app:workout_summary:',
  WORKOUT_SESSION_PREFIX: '@mood_app:workout_session:',
  WORKOUT_YEAR_LOG_PREFIX: '@mood_app:workout_year_log:',
};

// SecureStore só aceita chaves com [A-Za-z0-9._-], então não usamos o prefixo "@mood_app:".
const SECURE_KEYS = {
  ACCESS_TOKEN: 'mood_app_access_token',
  REFRESH_TOKEN: 'mood_app_refresh_token',
};

// SecureStore (Keychain/Keystore) não existe na web; nesse caso usamos AsyncStorage.
const useSecureStore = Platform.OS !== 'web';

const secureSet = async (key: string, value: string): Promise<void> => {
  if (useSecureStore) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
};

const secureGet = async (key: string): Promise<string | null> => {
  if (useSecureStore) {
    return await SecureStore.getItemAsync(key);
  }
  return await AsyncStorage.getItem(key);
};

const secureDelete = async (key: string): Promise<void> => {
  if (useSecureStore) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
};

// Migra um token que ficou guardado em texto puro no AsyncStorage para o SecureStore.
const migrateLegacyToken = async (legacyKey: string, secureKey: string): Promise<string | null> => {
  try {
    const legacyValue = await AsyncStorage.getItem(legacyKey);
    if (legacyValue) {
      await secureSet(secureKey, legacyValue);
      await AsyncStorage.removeItem(legacyKey);
      return legacyValue;
    }
  } catch {
    // Ignora falhas de migração e segue sem token.
  }
  return null;
};

export const storage = {
  async setTokens(tokens: AuthTokens): Promise<void> {
    await Promise.all([
      secureSet(SECURE_KEYS.ACCESS_TOKEN, tokens.accessToken),
      secureSet(SECURE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    const token = await secureGet(SECURE_KEYS.ACCESS_TOKEN);
    if (token) {
      return token;
    }
    return await migrateLegacyToken(STORAGE_KEYS.LEGACY_ACCESS_TOKEN, SECURE_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    const token = await secureGet(SECURE_KEYS.REFRESH_TOKEN);
    if (token) {
      return token;
    }
    return await migrateLegacyToken(STORAGE_KEYS.LEGACY_REFRESH_TOKEN, SECURE_KEYS.REFRESH_TOKEN);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      secureDelete(SECURE_KEYS.ACCESS_TOKEN),
      secureDelete(SECURE_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.LEGACY_ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.LEGACY_REFRESH_TOKEN),
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
    await storage.clearTokens();
  },
};
