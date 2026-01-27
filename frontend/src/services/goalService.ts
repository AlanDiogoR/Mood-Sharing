import { apiClient } from '../utils/api';
import { ApiResponse, GoalItem } from '../types';

export const goalService = {
  async list(): Promise<ApiResponse<GoalItem[]>> {
    return await apiClient.get<GoalItem[]>('/goals');
  },

  async update(items: GoalItem[]): Promise<ApiResponse<GoalItem[]>> {
    return await apiClient.put<GoalItem[]>('/goals', { items });
  },
};
