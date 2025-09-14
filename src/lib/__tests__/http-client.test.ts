import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpClient } from '../http-client';
import { ApiException } from '@/types/api';

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_API_BASE_URL: 'http://localhost:3000/api/v1',
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AbortSignal.timeout for older environments
if (!AbortSignal.timeout) {
  AbortSignal.timeout = vi.fn().mockImplementation((ms: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  });
}

// Mock URL API for file download tests
Object.defineProperty(window.URL, 'createObjectURL', {
  value: vi.fn(),
  writable: true,
});
Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true,
});

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let mockResponse: any;

  beforeEach(() => {
    vi.clearAllMocks();
    httpClient = new HttpClient();
    
    mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ success: true, data: {} }),
    };
    mockFetch.mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const client = new HttpClient();
      expect(client.getToken()).toBeNull();
    });

    it('should initialize with custom config', () => {
      const client = new HttpClient({
        baseURL: 'https://api.example.com',
        timeout: 5000,
      });
      expect(client).toBeInstanceOf(HttpClient);
    });

    it('should load token from localStorage on initialization', () => {
      const mockToken = 'saved-token-123';
      localStorageMock.getItem.mockReturnValue(mockToken);
      
      const client = new HttpClient();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');
      expect(client.getToken()).toBe(mockToken);
    });
  });

  describe('token management', () => {
    it('should set and get token', () => {
      const token = 'test-token-123';
      httpClient.setToken(token);
      
      expect(httpClient.getToken()).toBe(token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', token);
    });

    it('should clear token when set to null', () => {
      httpClient.setToken('some-token');
      httpClient.setToken(null);
      
      expect(httpClient.getToken()).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const responseData = { success: true, data: { id: 1, name: 'Test' } };
      mockResponse.json.mockResolvedValue(responseData);
      
      const result = await httpClient.get('/test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
        })
      );
      expect(result).toEqual(responseData);
    });

    it('should include query parameters in URL', async () => {
      const params = { page: 1, per_page: 10, status: 'active' };
      await httpClient.get('/projects', params);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/projects?page=1&per_page=10&status=active',
        expect.any(Object)
      );
    });

    it('should include authorization header when token is set', async () => {
      const token = 'bearer-token-123';
      httpClient.setToken(token);
      
      await httpClient.get('/protected');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          }),
        })
      );
    });

    it('should filter out empty query parameters', async () => {
      const params = { page: 1, empty: '', nullValue: null, undefinedValue: undefined };
      await httpClient.get('/test', params);
      
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe('http://localhost:3000/api/v1/test?page=1');
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with data', async () => {
      const requestData = { name: 'New Project', description: 'Test project' };
      const responseData = { success: true, data: { id: 1, ...requestData } };
      mockResponse.json.mockResolvedValue(responseData);
      
      const result = await httpClient.post('/projects', requestData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/projects',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('PATCH requests', () => {
    it('should make successful PATCH request', async () => {
      const updateData = { status: 'completed' };
      const responseData = { success: true, data: { id: 1, ...updateData } };
      mockResponse.json.mockResolvedValue(responseData);
      
      const result = await httpClient.patch('/projects/1', updateData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/projects/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const updateData = { name: 'Updated Project', description: 'Updated description' };
      await httpClient.put('/projects/1', updateData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const responseData = { success: true, message: 'Project deleted' };
      mockResponse.json.mockResolvedValue(responseData);
      
      const result = await httpClient.delete('/projects/1');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/projects/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('error handling', () => {
    it('should handle 401 Unauthorized and clear token', async () => {
      httpClient.setToken('invalid-token');
      mockResponse.ok = false;
      mockResponse.status = 401;
      mockResponse.json.mockResolvedValue({
        success: false,
        message: 'Unauthorized',
      });
      
      await expect(httpClient.get('/protected')).rejects.toThrow(ApiException);
      expect(httpClient.getToken()).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should handle 404 Not Found', async () => {
      mockResponse.ok = false;
      mockResponse.status = 404;
      mockResponse.json.mockResolvedValue({
        success: false,
        message: 'Not found',
      });
      
      await expect(httpClient.get('/nonexistent')).rejects.toThrow(ApiException);
    });

    it('should handle 422 Validation Error', async () => {
      mockResponse.ok = false;
      mockResponse.status = 422;
      mockResponse.json.mockResolvedValue({
        success: false,
        message: 'Validation failed',
        errors: ['Name is required', 'Description too short'],
      });
      
      try {
        await httpClient.post('/projects', {});
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).errors).toEqual(['Name is required', 'Description too short']);
      }
    });

    it('should handle 429 Rate Limit', async () => {
      mockResponse.ok = false;
      mockResponse.status = 429;
      mockResponse.json.mockResolvedValue({
        success: false,
        message: 'Too many requests',
      });
      
      try {
        await httpClient.get('/projects');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).message).toBe('Rate limit exceeded. Please try again later.');
      }
    });

    it('should handle 500 Server Error', async () => {
      mockResponse.ok = false;
      mockResponse.status = 500;
      mockResponse.json.mockResolvedValue({
        success: false,
        message: 'Internal server error',
      });
      
      try {
        await httpClient.get('/projects');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).message).toBe('Server error. Please try again later.');
      }
    });

    it('should handle API-level errors (success: false)', async () => {
      mockResponse.json.mockResolvedValue({
        success: false,
        message: 'Operation failed',
        errors: ['Specific error details'],
      });
      
      try {
        await httpClient.get('/projects');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).message).toBe('Operation failed');
        expect((error as ApiException).errors).toEqual(['Specific error details']);
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
      
      try {
        await httpClient.get('/projects');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).message).toBe('Network error. Please check your connection.');
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      mockFetch.mockRejectedValue(timeoutError);
      
      try {
        await httpClient.get('/projects');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).message).toBe('Request timeout. Please try again.');
      }
    });

    it('should handle non-JSON responses', async () => {
      mockResponse.headers = new Headers({ 'content-type': 'text/plain' });
      mockResponse.text = vi.fn().mockResolvedValue('Plain text error');
      
      try {
        await httpClient.get('/projects');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect(mockResponse.text).toHaveBeenCalled();
      }
    });
  });

  describe('file download', () => {
    it('should download file successfully', async () => {
      const mockBlob = new Blob(['CSV content'], { type: 'text/csv' });
      const mockUrl = 'blob:http://localhost/test';
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });
      
      vi.spyOn(window.URL, 'createObjectURL').mockReturnValue(mockUrl);
      vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      
      await httpClient.downloadFile('/export', 'test.csv', { format: 'csv' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/export?format=csv',
        expect.any(Object)
      );
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.href).toBe(mockUrl);
      expect(mockLink.download).toBe('test.csv');
      expect(mockLink.click).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    it('should handle download errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
      
      await expect(
        httpClient.downloadFile('/export', 'test.csv')
      ).rejects.toThrow(ApiException);
    });
  });

  describe('URL building', () => {
    it('should handle absolute URLs', async () => {
      await httpClient.get('https://external-api.com/data');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://external-api.com/data',
        expect.any(Object)
      );
    });

    it('should build relative URLs with base URL', async () => {
      await httpClient.get('/projects');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/projects',
        expect.any(Object)
      );
    });
  });

  describe('custom headers', () => {
    it('should merge custom headers with default headers', async () => {
      const customHeaders = { 'X-Custom-Header': 'custom-value' };
      await httpClient.get('/test', {}, { headers: customHeaders });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });
  });
});