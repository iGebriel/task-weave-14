import DOMPurify from 'dompurify';

/**
 * Security utilities for preventing XSS attacks and sanitizing user content
 */
export class SecurityUtils {
  /**
   * Sanitizes HTML content to prevent XSS attacks
   * @param content - The content to sanitize
   * @param allowTags - Array of allowed HTML tags (default: none)
   * @returns Sanitized content safe for rendering
   */
  static sanitizeHtml(content: string, allowTags: string[] = []): string {
    if (!content) return '';

    const config: DOMPurify.Config = {
      ALLOWED_TAGS: allowTags,
      ALLOWED_ATTR: allowTags.length > 0 ? ['class', 'id'] : [],
      FORBID_SCRIPTS: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'img'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'src', 'href'],
    };

    return DOMPurify.sanitize(content, config);
  }

  /**
   * Sanitizes plain text content (strips all HTML)
   * @param content - The content to sanitize
   * @returns Plain text content with HTML removed
   */
  static sanitizeText(content: string): string {
    if (!content) return '';
    return DOMPurify.sanitize(content, { ALLOWED_TAGS: [] });
  }

  /**
   * Sanitizes content for rich text display (allows basic formatting)
   * @param content - The content to sanitize
   * @returns Sanitized content with basic formatting preserved
   */
  static sanitizeRichText(content: string): string {
    const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'br', 'p'];
    return this.sanitizeHtml(content, allowedTags);
  }

  /**
   * Validates and sanitizes user input
   * @param input - The input to validate
   * @param maxLength - Maximum allowed length
   * @returns Sanitized and validated input
   */
  static validateAndSanitizeInput(input: string, maxLength: number = 1000): string {
    if (!input) return '';
    
    // Trim whitespace
    let sanitized = input.trim();
    
    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    // Sanitize content
    return this.sanitizeText(sanitized);
  }

  /**
   * Escapes special characters in text for safe display
   * @param text - Text to escape
   * @returns Escaped text
   */
  static escapeHtml(text: string): string {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Validates email format
   * @param email - Email to validate
   * @returns True if valid email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validates URL format and ensures it's safe
   * @param url - URL to validate
   * @returns True if valid and safe URL
   */
  static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Rate limiting utility for preventing abuse
   */
  static createRateLimiter(maxAttempts: number, windowMs: number) {
    const attempts = new Map<string, number[]>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const userAttempts = attempts.get(identifier) || [];
      
      // Remove old attempts outside the window
      const validAttempts = userAttempts.filter(time => now - time < windowMs);
      
      if (validAttempts.length >= maxAttempts) {
        return false; // Rate limit exceeded
      }
      
      validAttempts.push(now);
      attempts.set(identifier, validAttempts);
      
      return true; // Allow the action
    };
  }
}