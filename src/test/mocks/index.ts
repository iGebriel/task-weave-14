// Import vi from vitest at the top level
import { vi } from 'vitest';

// Re-export all mocks from their respective files
export * from './services';
export * from './container';

// Toast mock for notifications
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  promise: vi.fn(),
  dismiss: vi.fn(),
  loading: vi.fn(),
};

// Storage mock for local storage interactions
export const mockStorage = {
  getItem: vi.fn((key: string) => {
    const storage = mockStorage._storage || {};
    return storage[key] || null;
  }),
  setItem: vi.fn((key: string, value: string) => {
    if (!mockStorage._storage) mockStorage._storage = {};
    mockStorage._storage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    if (mockStorage._storage) {
      delete mockStorage._storage[key];
    }
  }),
  clear: vi.fn(() => {
    mockStorage._storage = {};
  }),
  _storage: {} as Record<string, string>,
};

// Location mock for navigation
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  ancestorOrigins: [] as any,
};

// Navigate mock for React Router
export const mockNavigate = vi.fn();

// File mock for file operations
export const mockFile = (name: string, content: string, type = 'text/plain') => 
  new File([content], name, { type });

// Blob mock for blob operations
export const mockBlob = (content: string, type = 'text/plain') => 
  new Blob([content], { type });

// URL mock for URL operations
export const mockURL = {
  createObjectURL: vi.fn(() => 'mock-object-url'),
  revokeObjectURL: vi.fn(),
};

// Intersection Observer mock
export const mockIntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Resize Observer mock
export const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Clipboard API mock
export const mockClipboard = {
  writeText: vi.fn(() => Promise.resolve()),
  readText: vi.fn(() => Promise.resolve('mock clipboard content')),
};

// Geolocation mock
export const mockGeolocation = {
  getCurrentPosition: vi.fn((success) => 
    success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 1000,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    })
  ),
  watchPosition: vi.fn(() => 1),
  clearWatch: vi.fn(),
};

// Window match media mock
export const mockMatchMedia = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Drag and Drop DataTransfer mock
export const mockDataTransfer = () => ({
  dropEffect: 'none' as DataTransfer['dropEffect'],
  effectAllowed: 'all' as DataTransfer['effectAllowed'],
  files: [] as any,
  items: [] as any,
  types: [] as string[],
  clearData: vi.fn(),
  getData: vi.fn(() => ''),
  setData: vi.fn(),
  setDragImage: vi.fn(),
});

// Console mock for testing console output
export const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Date mock for consistent date testing
export const mockDate = (isoString: string) => {
  const mockDateInstance = new Date(isoString);
  vi.useFakeTimers();
  vi.setSystemTime(mockDateInstance);
  return mockDateInstance;
};

// Clean up function for resetting all mocks
export const resetAllMocks = () => {
  // Reset toast mock
  Object.values(mockToast).forEach(fn => fn.mockReset());
  
  // Reset storage mock
  mockStorage._storage = {};
  Object.values(mockStorage).forEach(fn => {
    if (typeof fn === 'function') fn.mockReset();
  });
  
  // Reset other mocks
  mockNavigate.mockReset();
  mockURL.createObjectURL.mockReset();
  mockURL.revokeObjectURL.mockReset();
  mockIntersectionObserver.mockReset();
  mockResizeObserver.mockReset();
  mockClipboard.writeText.mockReset();
  mockClipboard.readText.mockReset();
  mockGeolocation.getCurrentPosition.mockReset();
  mockGeolocation.watchPosition.mockReset();
  mockGeolocation.clearWatch.mockReset();
  mockMatchMedia.mockReset();
  
  // Reset console mocks
  Object.values(mockConsole).forEach(fn => fn.mockReset());
};

