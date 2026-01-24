import axios, {AxiosInstance, AxiosError} from 'axios';
import {CONFIG} from '../constants/config';
import {storage} from './storage';
import {ApiResponse} from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8bb25667-25ae-441d-ae7c-2d3a6dd7c850',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:9',message:'ApiClient constructor',data:{baseURL:CONFIG.API_BASE_URL,timeout:CONFIG.API_TIMEOUT},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async config => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8bb25667-25ae-441d-ae7c-2d3a6dd7c850',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:24',message:'request interceptor',data:{url:config.url,method:config.method,baseURL:config.baseURL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const token = await storage.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8bb25667-25ae-441d-ae7c-2d3a6dd7c850',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:32',message:'request interceptor error',data:{errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle token refresh
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

              const {accessToken, refreshToken: newRefreshToken} = response.data.data;
              await storage.setTokens({
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn: response.data.data.expiresIn,
              });

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
    // #region agent log
    const fullUrl = `${CONFIG.API_BASE_URL}${url}`;
    fetch('http://127.0.0.1:7242/ingest/8bb25667-25ae-441d-ae7c-2d3a6dd7c850',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:82',message:'POST request starting',data:{url,fullUrl,hasData:!!data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      const response = await this.client.post(url, data, config);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8bb25667-25ae-441d-ae7c-2d3a6dd7c850',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:85',message:'POST request success',data:{url,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return response.data;
    } catch (error) {
      // #region agent log
      const errorData: any = {url,fullUrl};
      if (error && typeof error === 'object' && 'response' in error) {
        errorData.responseStatus = (error as any).response?.status;
        errorData.responseData = (error as any).response?.data;
      }
      if (error && typeof error === 'object' && 'request' in error) {
        errorData.hasRequest = true;
      }
      if (error && typeof error === 'object' && 'message' in error) {
        errorData.errorMessage = (error as any).message;
      }
      fetch('http://127.0.0.1:7242/ingest/8bb25667-25ae-441d-ae7c-2d3a6dd7c850',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:87',message:'POST request error',data:errorData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
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
