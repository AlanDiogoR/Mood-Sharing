import {apiClient} from '../utils/api';
import {storage} from '../utils/storage';
import {LoginCredentials, RegisterData, User, AuthTokens, ApiResponse} from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<{user: User; tokens: AuthTokens}>> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8bb25667-25ae-441d-ae7c-2d3a6dd7c850',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:6',message:'login called',data:{email:credentials.email,hasPassword:!!credentials.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const response = await apiClient.post<{user: User; tokens: AuthTokens}>('/auth/login', credentials);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8bb25667-25ae-441d-ae7c-2d3a6dd7c850',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authService.ts:8',message:'login response received',data:{success:response.success,hasData:!!response.data,error:response.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
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
      await apiClient.post('/auth/logout');
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

  async linkPartner(partnerEmail: string): Promise<ApiResponse<User>> {
    return await apiClient.post<User>('/auth/link-partner', {partnerEmail});
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
