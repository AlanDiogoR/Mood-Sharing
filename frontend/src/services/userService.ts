import { apiClient } from '../utils/api';
import { ApiResponse, UserProfile } from '../types';

interface PhotoResponse {
  photoUrl: string;
  photoUploadedAt?: string;
}

export const userService = {
  async getUserById(userId: string): Promise<ApiResponse<UserProfile>> {
    return await apiClient.get<UserProfile>(`/users/${userId}`);
  },
  async getMyPhoto(): Promise<ApiResponse<PhotoResponse>> {
    return await apiClient.get<PhotoResponse>('/users/me/photo');
  },

  async uploadMyPhoto(
    uri: string,
    mimeType: string,
    filename: string
  ): Promise<ApiResponse<PhotoResponse>> {
    const formData = new FormData();
    formData.append('photo', {
      uri,
      type: mimeType,
      name: filename,
    } as any);

    return await apiClient.post<PhotoResponse>('/users/me/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
