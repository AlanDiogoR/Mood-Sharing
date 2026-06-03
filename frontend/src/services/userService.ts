import { apiClient } from '../utils/api';
import { ApiResponse, UserProfile, User } from '../types';

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
  async updateProfile(payload: {
    name: string;
    partnerName?: string | null;
    themePrimary?: string | null;
    themeSecondary?: string | null;
  }): Promise<ApiResponse<User>> {
    return await apiClient.put<User>('/users/me', payload);
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

  async exportMyData(): Promise<ApiResponse<Record<string, unknown>>> {
    return await apiClient.get<Record<string, unknown>>('/users/me/export');
  },

  async deleteAccount(password: string): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.delete<{ message: string }>('/users/me', {
      data: { password },
    });
  },
};
