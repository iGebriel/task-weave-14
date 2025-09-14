import { ApiResponse, ApiException, RequestConfig, HttpClientConfig, ApiError } from '@/types/api';

/**
 * HTTP Client for API communication with authentication, error handling, and rate limiting
 */
export class HttpClient {
  private config: HttpClientConfig;
  private token: string | null = null;

  constructor(config: Partial<HttpClientConfig> = {}) {
    this.config = {
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...config,
    };

    // Load token from localStorage on initialization
    this.loadTokenFromStorage();
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Load token from localStorage
   */
  private loadTokenFromStorage(): void {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      this.token = savedToken;
    }
  }

  /**
   * Create an AbortSignal with timeout, with fallback for environments
   * that don't support AbortSignal.timeout
   */
  private createTimeoutSignal(timeout: number): AbortSignal | undefined {
    // Skip signal in test environments to avoid compatibility issues
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return undefined;
    }

    // Check if AbortSignal.timeout is available
    if (typeof AbortSignal.timeout === 'function') {
      return AbortSignal.timeout(timeout);
    }

    // Fallback for environments without AbortSignal.timeout
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }

  /**
   * Build request headers with authentication
   */
  private buildHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers = { ...this.config.headers, ...customHeaders };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(url: string, params?: Record<string, any>): string {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
    
    if (!params || Object.keys(params).length === 0) {
      return fullUrl;
    }

    const urlObj = new URL(fullUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        urlObj.searchParams.set(key, String(value));
      }
    });

    return urlObj.toString();
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    let responseData: any;

    // Handle different content types
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else if (contentType?.includes('text/')) {
      const text = await response.text();
      responseData = { success: false, message: text };
    } else {
      responseData = { success: false, message: 'Unknown response format' };
    }

    // Handle HTTP errors
    if (!response.ok) {
      const error: ApiError = {
        message: responseData.message || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        errors: responseData.errors || [],
      };

      // Handle specific status codes
      switch (response.status) {
        case 401:
          this.setToken(null); // Clear invalid token
          error.message = 'Authentication required. Please log in.';
          break;
        case 403:
          error.message = 'Access denied. You do not have permission for this action.';
          break;
        case 404:
          error.message = 'Resource not found.';
          break;
        case 422:
          error.message = responseData.message || 'Validation failed.';
          break;
        case 429:
          error.message = 'Rate limit exceeded. Please try again later.';
          break;
        case 500:
          error.message = 'Server error. Please try again later.';
          break;
      }

      throw new ApiException(error);
    }

    // Handle successful API responses that have success field
    if (responseData && typeof responseData === 'object') {
      // If response has success field and it's false, treat as API error
      if ('success' in responseData && responseData.success === false) {
        const error: ApiError = {
          message: responseData.message || 'API request failed',
          errors: responseData.errors || [],
        };
        throw new ApiException(error);
      }
      
      // If response has success field and it's true, return as is
      if ('success' in responseData) {
        return responseData as ApiResponse<T>;
      }
    }

    // For responses without success field, wrap them in success format
    return {
      success: true,
      data: responseData,
    } as ApiResponse<T>;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildUrl(config.url, config.params);
    const headers = this.buildHeaders(config.headers);

    const fetchConfig: RequestInit = {
      method: config.method,
      headers,
      ...((() => {
        const signal = this.createTimeoutSignal(config.timeout || this.config.timeout);
        return signal ? { signal } : {};
      })()),
    };

    if (config.data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      fetchConfig.body = JSON.stringify(config.data);
    }

    try {
      const response = await fetch(url, fetchConfig);
      return await this.handleResponse<T>(response);
    } catch (error) {
      // Handle network errors
      if (error instanceof ApiException) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiException({
          message: 'Network error. Please check your connection.',
          status: 0,
        });
      }

      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new ApiException({
          message: 'Request timeout. Please try again.',
          status: 408,
        });
      }

      throw new ApiException({
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 500,
      });
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, params?: Record<string, any>, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      params,
      ...config,
    });
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }

  /**
   * Download file (for CSV exports)
   */
  async downloadFile(url: string, filename: string, params?: Record<string, any>): Promise<void> {
    const fullUrl = this.buildUrl(url, params);
    const headers = this.buildHeaders();

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers,
        ...((() => {
          const signal = this.createTimeoutSignal(this.config.timeout);
          return signal ? { signal } : {};
        })()),
      });

      if (!response.ok) {
        throw new ApiException({
          message: `Failed to download file: ${response.statusText}`,
          status: response.status,
        });
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException({
        message: 'Failed to download file',
        status: 500,
      });
    }
  }
}

// Export singleton instance
export const httpClient = new HttpClient();