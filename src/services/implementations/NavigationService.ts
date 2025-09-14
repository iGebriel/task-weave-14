import { INavigationService, NavigationOptions } from '../interfaces';

/**
 * Browser-based navigation service implementation
 */
export class BrowserNavigationService implements INavigationService {
  navigate(path: string, options?: NavigationOptions): void {
    if (options?.replace) {
      window.history.replaceState(options.state || null, '', path);
    } else {
      window.history.pushState(options?.state || null, '', path);
    }
    
    // Dispatch a custom event to notify components of navigation
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  goBack(): void {
    window.history.back();
  }

  replace(path: string, options?: NavigationOptions): void {
    this.navigate(path, { ...options, replace: true });
  }

  getCurrentPath(): string {
    return window.location.pathname;
  }

  getSearchParams(): URLSearchParams {
    return new URLSearchParams(window.location.search);
  }
}

/**
 * Mock navigation service for testing
 */
export class MockNavigationService implements INavigationService {
  private currentPath: string = '/';
  private searchParams: URLSearchParams = new URLSearchParams();
  private history: string[] = [];

  navigate(path: string, options?: NavigationOptions): void {
    if (!options?.replace) {
      this.history.push(this.currentPath);
    }
    
    const [pathname, search] = path.split('?');
    this.currentPath = pathname;
    this.searchParams = new URLSearchParams(search || '');
  }

  goBack(): void {
    if (this.history.length > 0) {
      const previousPath = this.history.pop();
      if (previousPath) {
        this.currentPath = previousPath;
      }
    }
  }

  replace(path: string, options?: NavigationOptions): void {
    this.navigate(path, { ...options, replace: true });
  }

  getCurrentPath(): string {
    return this.currentPath;
  }

  getSearchParams(): URLSearchParams {
    return new URLSearchParams(this.searchParams);
  }

  /**
   * Reset the mock navigation state (for testing)
   */
  reset(): void {
    this.currentPath = '/';
    this.searchParams = new URLSearchParams();
    this.history = [];
  }
}