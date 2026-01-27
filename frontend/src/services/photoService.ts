import { apiClient } from '../utils/api';
import { ApiResponse, SharedPhoto } from '../types';

export const photoService = {
  async getLatestFromPartner(): Promise<ApiResponse<SharedPhoto | null>> {
    return await apiClient.get<SharedPhoto | null>('/photos/latest');
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
