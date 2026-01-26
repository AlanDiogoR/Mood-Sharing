import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthTokens} from '../types';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@mood_app:access_token',
  REFRESH_TOKEN: '@mood_app:refresh_token',
  USER_DATA: '@mood_app:user_data',
  IS_LOCKED: '@mood_app:is_locked',
  LAST_ACTIVITY: '@mood_app:last_activity',
  LAST_UPLOADED_PHOTO_URI: '@mood_app:last_uploaded_photo_uri',
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

  async setUserData(userData: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  },

  async getUserData(): Promise<any | null> {
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

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  },
};
