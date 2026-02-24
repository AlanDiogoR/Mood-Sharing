import axios, {AxiosInstance, AxiosError} from 'axios';
import {CONFIG} from '../constants/config';
import {storage} from './storage';
import {ApiResponse} from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: CONFIG.API_BASE_URL,
      timeout: CONFIG.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      async config => {
        const token = await storage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = await storage.getRefreshToken();
            if (refreshToken) {
              const response = await axios.post(`${CONFIG.API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              const tokenData = response.data?.data;
              if (!tokenData?.accessToken) {
                throw new Error('Invalid refresh response');
              }
              await storage.setTokens({
                accessToken: tokenData.accessToken,
                refreshToken: tokenData.refreshToken,
                expiresIn: tokenData.expiresIn,
              });
              const accessToken = tokenData.accessToken;

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            await storage.clearAll();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse<any> {
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error || error.response.data?.message || 'Erro desconhecido',
        message: error.response.data?.message,
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'Sem resposta do servidor. Verifique sua conexão.',
      };
    } else {
      return {
        success: false,
        error: error.message || 'Erro ao processar requisição',
      };
    }
  }
}

export const apiClient = new ApiClient();
