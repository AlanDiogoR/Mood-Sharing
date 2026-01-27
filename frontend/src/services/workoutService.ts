import { apiClient } from '../utils/api';
import { ApiResponse, WeeklyWorkoutSummary, WorkoutSummaryEntry } from '../types';

export const workoutService = {
  async saveSummary(summary: WorkoutSummaryEntry): Promise<ApiResponse<WorkoutSummaryEntry>> {
    return await apiClient.post<WorkoutSummaryEntry>('/workouts/summary', summary);
  },

  async getWeeklySummary(start?: string): Promise<ApiResponse<WeeklyWorkoutSummary>> {
    const query = start ? `?start=${encodeURIComponent(start)}` : '';
    return await apiClient.get<WeeklyWorkoutSummary>(`/workouts/weekly${query}`);
  },
};
