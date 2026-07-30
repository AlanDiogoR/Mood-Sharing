import axios, {AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig} from 'axios';
import {CONFIG} from '../constants/config';
import {storage} from './storage';
import {ApiResponse} from '../types';

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

type OnAuthExpiredCallback = () => void;

class ApiClient {
  private client: AxiosInstance;
  private onAuthExpired: OnAuthExpiredCallback | null = null;
  // Single-flight: com rotação de refresh token no backend, dois refresh
  // simultâneos invalidariam a sessão (o segundo usaria um token já revogado).
  private refreshPromise: Promise<string> | null = null;

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

  setOnAuthExpired(callback: OnAuthExpiredCallback): void {
    this.onAuthExpired = callback;
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
        const originalRequest = error.config as RetryableConfig;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.refreshTokens();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client(originalRequest);
          } catch {
            await storage.clearAll();
            this.onAuthExpired?.();
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private refreshTokens(): Promise<string> {
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        try {
          const refreshToken = await storage.getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token');
          }

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

          return tokenData.accessToken as string;
        } finally {
          this.refreshPromise = null;
        }
      })();
    }
    return this.refreshPromise;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError<T>(error: unknown): ApiResponse<T> {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.error || error.response.data?.message || 'Erro desconhecido',
          message: error.response.data?.message,
        };
      }
      if (error.request) {
        return {
          success: false,
          error: 'Sem resposta do servidor. Verifique sua conexão.',
        };
      }
    }

    const message = error instanceof Error ? error.message : 'Erro ao processar requisição';
    return { success: false, error: message };
  }
}

export const apiClient = new ApiClient();
