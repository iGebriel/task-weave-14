import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { resetTestContainer } from './mocks/container';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock clipboard API - consolidated here to avoid redefinition
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  configurable: true, // Allow user-event to override this if needed
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Polyfill for ArrayBuffer.prototype.resizable and SharedArrayBuffer.prototype.growable
// These are newer JavaScript features that may not be available in all Node.js/JSDOM environments
// This fixes webidl-conversions errors that occur when these properties are undefined
if (!Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'resizable')) {
  Object.defineProperty(ArrayBuffer.prototype, 'resizable', {
    get() {
      return false; // Default to false for older environments
    },
    configurable: true,
    enumerable: false
  });
}

if (!Object.getOwnPropertyDescriptor(SharedArrayBuffer.prototype, 'growable')) {
  Object.defineProperty(SharedArrayBuffer.prototype, 'growable', {
    get() {
      return false; // Default to false for older environments
    },
    configurable: true,
    enumerable: false
  });
}

// Global test setup and cleanup
beforeEach(() => {
  // Reset service container before each test to ensure clean state
  resetTestContainer();
});

afterEach(() => {
  // Clean up any remaining mocks or side effects
  vi.clearAllMocks();
});
