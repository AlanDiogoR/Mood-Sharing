import {apiClient} from '../utils/api';
import {storage} from '../utils/storage';
import {LoginCredentials, RegisterData, User, AuthTokens, ApiResponse} from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<{user: User; tokens: AuthTokens}>> {
    const response = await apiClient.post<{user: User; tokens: AuthTokens}>('/auth/login', credentials);

    if (response.success && response.data) {
      await storage.setTokens(response.data.tokens);
      await storage.setUserData(response.data.user);
    }
    
    return response;
  },

  async register(data: RegisterData): Promise<ApiResponse<{user: User; tokens: AuthTokens}>> {
    const response = await apiClient.post<{user: User; tokens: AuthTokens}>('/auth/register', data);
    
    if (response.success && response.data) {
      await storage.setTokens(response.data.tokens);
      await storage.setUserData(response.data.user);
    }
    
    return response;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await storage.getRefreshToken();
      await apiClient.post('/auth/logout', refreshToken ? {refreshToken} : undefined);
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      await storage.clearAll();
    }
  },

  async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available',
      };
    }

    const response = await apiClient.post<AuthTokens>('/auth/refresh', {refreshToken});
    
    if (response.success && response.data) {
      await storage.setTokens(response.data);
    }
    
    return response;
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return await apiClient.get<User>('/auth/me');
  },

  async verifyPassword(password: string): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.post<{ message: string }>('/auth/verify-password', { password });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return await apiClient.post<{ message: string }>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await storage.getAccessToken();
    return !!token;
  },
};
