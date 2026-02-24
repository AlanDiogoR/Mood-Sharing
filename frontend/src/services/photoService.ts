import { apiClient } from '../utils/api';
import { ApiResponse, SharedPhoto } from '../types';

export interface PhotoGalleryResponse {
  data: SharedPhoto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const photoService = {
  async getLatestFromPartner(): Promise<ApiResponse<SharedPhoto | null>> {
    return await apiClient.get<SharedPhoto | null>('/photos/latest');
  },

  async getPartnerPhotos(page = 1, limit = 20): Promise<ApiResponse<PhotoGalleryResponse>> {
    return await apiClient.get<PhotoGalleryResponse>(`/photos?page=${page}&limit=${limit}`);
  },

  async sendToPartner(
    uri: string,
    mimeType: string,
    filename: string
  ): Promise<ApiResponse<SharedPhoto>> {
    const formData = new FormData();
    formData.append('photo', {
      uri,
      type: mimeType,
      name: filename,
    } as any);

    return await apiClient.post<SharedPhoto>('/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
