import { IHttpService, RequestConfig } from '../interfaces';
import { httpClient } from '@/lib/http-client';

/**
 * HTTP service implementation that wraps the existing HTTP client
 */
export class HttpService implements IHttpService {
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await httpClient.get<T>(url, config?.params, {
      headers: config?.headers,
      timeout: config?.timeout,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'GET request failed');
    }
    
    return response.data as T;
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await httpClient.post<T>(url, data, {
      headers: config?.headers,
      params: config?.params,
      timeout: config?.timeout,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'POST request failed');
    }
    
    return response.data as T;
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await httpClient.put<T>(url, data, {
      headers: config?.headers,
      params: config?.params,
      timeout: config?.timeout,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'PUT request failed');
    }
    
    return response.data as T;
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await httpClient.patch<T>(url, data, {
      headers: config?.headers,
      params: config?.params,
      timeout: config?.timeout,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'PATCH request failed');
    }
    
    return response.data as T;
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await httpClient.delete<T>(url, {
      headers: config?.headers,
      params: config?.params,
      timeout: config?.timeout,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'DELETE request failed');
    }
    
    return response.data as T;
  }
}