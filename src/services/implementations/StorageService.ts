import { IStorageService } from '../interfaces';

/**
 * LocalStorage-based storage service implementation
 */
export class LocalStorageService implements IStorageService {
  private readonly prefix: string;

  constructor(prefix: string = 'taskweave_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Failed to parse localStorage item "${key}":`, error);
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serializedValue);
    } catch (error) {
      console.error(`Failed to set localStorage item "${key}":`, error);
      throw new Error(`Failed to store data for key "${key}"`);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn(`Failed to remove localStorage item "${key}":`, error);
    }
  }

  clear(): void {
    try {
      // Only clear items with our prefix
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    try {
      const testKey = '__test_storage__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all keys with the service prefix
   */
  getAllKeys(): string[] {
    const keys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }
    } catch (error) {
      console.warn('Failed to get localStorage keys:', error);
    }
    return keys;
  }
}

/**
 * In-memory storage service for testing or when localStorage is unavailable
 */
export class InMemoryStorageService implements IStorageService {
  private storage = new Map<string, any>();
  private readonly prefix: string;

  constructor(prefix: string = 'taskweave_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  getItem<T>(key: string): T | null {
    const fullKey = this.getKey(key);
    return this.storage.has(fullKey) ? this.storage.get(fullKey) : null;
  }

  setItem<T>(key: string, value: T): void {
    this.storage.set(this.getKey(key), value);
  }

  removeItem(key: string): void {
    this.storage.delete(this.getKey(key));
  }

  clear(): void {
    // Only clear items with our prefix
    const keysToDelete = Array.from(this.storage.keys())
      .filter(key => key.startsWith(this.prefix));
    
    keysToDelete.forEach(key => this.storage.delete(key));
  }

  /**
   * Get all keys with the service prefix
   */
  getAllKeys(): string[] {
    return Array.from(this.storage.keys())
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.substring(this.prefix.length));
  }
}
