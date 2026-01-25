import { apiClient } from '../utils/api';
import { ApiResponse, MediaItem, MediaType } from '../types';

export interface MediaPayload {
  title: string;
  type: MediaType;
  notes?: string;
}

export const mediaService = {
  async list(): Promise<ApiResponse<MediaItem[]>> {
    return await apiClient.get<MediaItem[]>('/media');
  },

  async create(payload: MediaPayload): Promise<ApiResponse<MediaItem>> {
    return await apiClient.post<MediaItem>('/media', payload);
  },

  async update(id: string, payload: Partial<MediaPayload>): Promise<ApiResponse<MediaItem>> {
    return await apiClient.put<MediaItem>(`/media/${id}`, payload);
  },

  async remove(id: string): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.delete<{ message: string }>(`/media/${id}`);
  },

  async reorder(orderedIds: string[]): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.post<{ message: string }>('/media/reorder', { orderedIds });
  },
};
