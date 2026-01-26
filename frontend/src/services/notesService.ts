import { apiClient } from '../utils/api';
import { ApiResponse, SharedNote } from '../types';

export const notesService = {
  async list(): Promise<ApiResponse<SharedNote[]>> {
    return await apiClient.get<SharedNote[]>('/notes');
  },

  async create(content: string): Promise<ApiResponse<SharedNote>> {
    return await apiClient.post<SharedNote>('/notes', { content });
  },

  async update(id: string, content: string): Promise<ApiResponse<SharedNote>> {
    return await apiClient.put<SharedNote>(`/notes/${id}`, { content });
  },

  async remove(id: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/notes/${id}`);
  },
};
