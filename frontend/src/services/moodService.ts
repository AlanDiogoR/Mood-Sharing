import {apiClient} from '../utils/api';
import {Mood, MoodType, Location, ApiResponse} from '../types';

export const moodService = {
  async getCurrentMood(userId: string): Promise<ApiResponse<Mood>> {
    return await apiClient.get<Mood>(`/moods/current/${userId}`);
  },

  async getPartnerMood(partnerId: string): Promise<ApiResponse<Mood>> {
    return await apiClient.get<Mood>(`/moods/partner/${partnerId}`);
  },

  async updateMood(
    type: MoodType,
    message?: string,
    location?: Location
  ): Promise<ApiResponse<Mood>> {
    return await apiClient.post<Mood>('/moods', {
      type,
      message,
      location,
    });
  },

  async updateMoodWithProximity(
    type: MoodType,
    location: Location,
    partnerLocation: Location
  ): Promise<ApiResponse<Mood>> {
    return await apiClient.post<Mood>('/moods/with-proximity', {
      type,
      location,
      partnerLocation,
    });
  },

  async getMoodHistory(userId: string, limit?: number): Promise<ApiResponse<Mood[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return await apiClient.get<Mood[]>(`/moods/history/${userId}${params}`);
  },
};
