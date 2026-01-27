import { apiClient } from '../utils/api';
import { ApiResponse, WeeklyMeetingSummary, CoupleDaySummary } from '../types';

export const meetingService = {
  async recordProximity(timestamp?: number): Promise<ApiResponse<CoupleDaySummary>> {
    return await apiClient.post<CoupleDaySummary>('/meetings/record', {
      timestamp,
    });
  },

  async getWeeklySummary(start?: string): Promise<ApiResponse<WeeklyMeetingSummary>> {
    const params = start ? `?start=${encodeURIComponent(start)}` : '';
    return await apiClient.get<WeeklyMeetingSummary>(`/meetings/weekly${params}`);
  },
};
