import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Accessibility testing utilities for automated a11y validation
 */

export interface AccessibilityViolation {
  id: string;
  description: string;
  helpUrl: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  tags: string[];
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary?: string;
  }>;
}

export interface AccessibilityReport {
  violations: AccessibilityViolation[];
  passes: Array<{ id: string; description: string }>;
  incomplete: Array<{ id: string; description: string }>;
  timestamp: Date;
  url?: string;
  testName: string;
}

/**
 * Mock axe-core functionality for testing
 * In a real implementation, you would use the actual axe-core library
 */
class MockAxeCore {
  private static violations: AccessibilityViolation[] = [];
  private static passes: Array<{ id: string; description: string }> = [];

  static setViolations(violations: AccessibilityViolation[]) {
    this.violations = violations;
  }

  static setPasses(passes: Array<{ id: string; description: string }>) {
    this.passes = passes;
  }

  static async run(element?: HTMLElement): Promise<{ violations: AccessibilityViolation[]; passes: Array<{ id: string; description: string }> }> {
    return {
      violations: this.violations,
      passes: this.passes,
    };
  }

  static reset() {
    this.violations = [];
    this.passes = [];
  }
}

/**
 * Test accessibility of a rendered component
 */
export const testAccessibility = async (
  component: ReactElement,
  testName: string = 'Accessibility Test'
): Promise<AccessibilityReport> => {
  const { container } = render(component);
  
  const result = await MockAxeCore.run(container);
  
  return {
    violations: result.violations,
    passes: result.passes,
    incomplete: [],
    timestamp: new Date(),
    testName,
  };
};

/**
 * Accessibility assertion helpers
 */
export const expectAccessibility = (report: AccessibilityReport) => ({
  toHaveNoViolations: () => {
    if (report.violations.length > 0) {
      const violationMessages = report.violations
        .map(v => `${v.impact.toUpperCase()}: ${v.description}\n  ${v.helpUrl}`)
        .join('\n\n');
      
      throw new Error(
        `Expected no accessibility violations, but found ${report.violations.length}:\n\n${violationMessages}`
      );
    }
  },
  
  toHaveNoViolationsAbove: (severity: 'minor' | 'moderate' | 'serious' | 'critical') => {
    const severityLevels = { minor: 1, moderate: 2, serious: 3, critical: 4 };
    const threshold = severityLevels[severity];
    
    const significantViolations = report.violations.filter(
      v => severityLevels[v.impact] >= threshold
    );
    
    if (significantViolations.length > 0) {
      const violationMessages = significantViolations
        .map(v => `${v.impact.toUpperCase()}: ${v.description}`)
        .join('\n');
      
      throw new Error(
        `Expected no accessibility violations above ${severity}, but found ${significantViolations.length}:\n${violationMessages}`
      );
    }
  },
  
  toPassRules: (ruleIds: string[]) => {
    const passedRules = report.passes.map(p => p.id);
    const missingRules = ruleIds.filter(id => !passedRules.includes(id));
    
    if (missingRules.length > 0) {
      throw new Error(
        `Expected rules to pass but they didn't: ${missingRules.join(', ')}`
      );
    }
  },
});

/**
 * Keyboard navigation testing utilities
 */
export class KeyboardNavigationTester {
  private element: HTMLElement;
  
  constructor(element: HTMLElement) {
    this.element = element;
  }

  /**
   * Test tab navigation through focusable elements
   */
  async testTabNavigation(): Promise<HTMLElement[]> {
    const focusableElements = this.getFocusableElements();
    const focusedElements: HTMLElement[] = [];
    
    for (const element of focusableElements) {
      element.focus();
      focusedElements.push(document.activeElement as HTMLElement);
      
      // Simulate tab key press
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    }
    
    return focusedElements;
  }

  /**
   * Test escape key functionality
   */
  async testEscapeKey(): Promise<boolean> {
    const initialElement = document.activeElement;
    
    this.element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    
    // Check if escape key was handled (focus changed or modal closed)
    return document.activeElement !== initialElement;
  }

  /**
   * Test enter/space key activation
   */
  async testActivationKeys(element: HTMLElement): Promise<{ enter: boolean; space: boolean }> {
    let enterHandled = false;
    let spaceHandled = false;
    
    const enterHandler = () => { enterHandled = true; };
    const spaceHandler = () => { spaceHandled = true; };
    
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') enterHandler();
      if (e.key === ' ') spaceHandler();
    });
    
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    
    return { enter: enterHandled, space: spaceHandled };
  }

  /**
   * Get all focusable elements within the container
   */
  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(',');
    
    return Array.from(this.element.querySelectorAll(focusableSelectors));
  }
}

/**
 * ARIA compliance testing
 */
export class AriaComplianceTester {
  private element: HTMLElement;
  
  constructor(element: HTMLElement) {
    this.element = element;
  }

  /**
   * Check for proper ARIA labels
   */
  checkAriaLabels(): { missing: HTMLElement[]; improper: HTMLElement[] } {
    const interactiveElements = this.element.querySelectorAll(
      'button, input, select, textarea, [role="button"], [role="link"], [role="menuitem"]'
    );
    
    const missing: HTMLElement[] = [];
    const improper: HTMLElement[] = [];
    
    interactiveElements.forEach(element => {
      const hasAriaLabel = element.hasAttribute('aria-label');
      const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
      const hasVisibleText = element.textContent?.trim();
      
      if (!hasAriaLabel && !hasAriaLabelledBy && !hasVisibleText) {
        missing.push(element as HTMLElement);
      }
      
      // Check for improper ARIA usage
      if (hasAriaLabelledBy) {
        const labelledBy = element.getAttribute('aria-labelledby');
        const referencedElements = labelledBy?.split(' ')
          .map(id => document.getElementById(id))
          .filter(Boolean);
        
        if (!referencedElements?.length) {
          improper.push(element as HTMLElement);
        }
      }
    });
    
    return { missing, improper };
  }

  /**
   * Check for proper heading hierarchy
   */
  checkHeadingHierarchy(): { violations: Array<{ element: HTMLElement; issue: string }> } {
    const headings = Array.from(this.element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const violations: Array<{ element: HTMLElement; issue: string }> = [];
    
    let currentLevel = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (currentLevel === 0) {
        // First heading should be h1
        if (level !== 1) {
          violations.push({
            element: heading as HTMLElement,
            issue: `First heading should be h1, found ${heading.tagName.toLowerCase()}`
          });
        }
      } else if (level > currentLevel + 1) {
        // Heading levels should not skip
        violations.push({
          element: heading as HTMLElement,
          issue: `Heading level jumps from h${currentLevel} to h${level}`
        });
      }
      
      currentLevel = level;
    });
    
    return { violations };
  }

  /**
   * Check for proper color contrast
   */
  checkColorContrast(): { violations: Array<{ element: HTMLElement; contrast: number; required: number }> } {
    // This is a simplified version - in reality, you'd use a library like axe-core
    const textElements = this.element.querySelectorAll('p, span, div, button, input, a');
    const violations: Array<{ element: HTMLElement; contrast: number; required: number }> = [];
    
    textElements.forEach(element => {
      const styles = getComputedStyle(element);
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = styles.fontWeight;
      
      // Determine required contrast ratio
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
      const requiredContrast = isLargeText ? 3 : 4.5;
      
      // Mock contrast calculation - in reality, you'd calculate this properly
      const mockContrast = Math.random() * 5 + 2; // Random value between 2-7
      
      if (mockContrast < requiredContrast) {
        violations.push({
          element: element as HTMLElement,
          contrast: mockContrast,
          required: requiredContrast,
        });
      }
    });
    
    return { violations };
  }
}

/**
 * Screen reader simulation
 */
export class ScreenReaderSimulator {
  private element: HTMLElement;
  
  constructor(element: HTMLElement) {
    this.element = element;
  }

  /**
   * Get the accessible name for an element
   */
  getAccessibleName(element: HTMLElement): string {
    // Simplified accessible name computation
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) return labelElement.textContent?.trim() || '';
    }
    
    const labelElement = element.closest('label');
    if (labelElement) return labelElement.textContent?.trim() || '';
    
    return element.textContent?.trim() || '';
  }

  /**
   * Get the accessible description
   */
  getAccessibleDescription(element: HTMLElement): string {
    const ariaDescribedBy = element.getAttribute('aria-describedby');
    if (ariaDescribedBy) {
      const descElement = document.getElementById(ariaDescribedBy);
      if (descElement) return descElement.textContent?.trim() || '';
    }
    
    return element.getAttribute('title') || '';
  }

  /**
   * Simulate what a screen reader would announce
   */
  getScreenReaderAnnouncement(element: HTMLElement): string {
    const name = this.getAccessibleName(element);
    const description = this.getAccessibleDescription(element);
    const role = element.getAttribute('role') || this.getImplicitRole(element);
    const state = this.getElementState(element);
    
    let announcement = name;
    if (description) announcement += `, ${description}`;
    if (role) announcement += `, ${role}`;
    if (state) announcement += `, ${state}`;
    
    return announcement;
  }

  /**
   * Get implicit role for an element
   */
  private getImplicitRole(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const roleMap: Record<string, string> = {
      button: 'button',
      input: 'textbox',
      select: 'combobox',
      textarea: 'textbox',
      a: 'link',
      h1: 'heading',
      h2: 'heading',
      h3: 'heading',
      h4: 'heading',
      h5: 'heading',
      h6: 'heading',
    };
    
    return roleMap[tagName] || '';
  }

  /**
   * Get element state information
   */
  private getElementState(element: HTMLElement): string {
    const states: string[] = [];
    
    if (element.hasAttribute('disabled')) states.push('disabled');
    if (element.hasAttribute('aria-expanded')) {
      states.push(element.getAttribute('aria-expanded') === 'true' ? 'expanded' : 'collapsed');
    }
    if (element.hasAttribute('aria-checked')) {
      states.push(element.getAttribute('aria-checked') === 'true' ? 'checked' : 'not checked');
    }
    if (element.hasAttribute('aria-selected')) {
      states.push(element.getAttribute('aria-selected') === 'true' ? 'selected' : 'not selected');
    }
    
    return states.join(', ');
  }
}

/**
 * Comprehensive accessibility test suite
 */
export const createAccessibilityTestSuite = (componentName: string) => {
  return {
    /**
     * Run full accessibility audit
     */
    async runFullAudit(component: ReactElement): Promise<AccessibilityReport> {
      const report = await testAccessibility(component, `${componentName} Full Audit`);
      
      // Additional custom checks
      const { container } = render(component);
      const keyboardTester = new KeyboardNavigationTester(container);
      const ariaTester = new AriaComplianceTester(container);
      
      const ariaIssues = ariaTester.checkAriaLabels();
      const headingIssues = ariaTester.checkHeadingHierarchy();
      const contrastIssues = ariaTester.checkColorContrast();
      
      // Convert custom checks to violations format
      const customViolations: AccessibilityViolation[] = [];
      
      ariaIssues.missing.forEach(element => {
        customViolations.push({
          id: 'missing-aria-label',
          description: 'Interactive element missing accessible name',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
          impact: 'serious',
          tags: ['wcag2a', 'aria'],
          nodes: [{
            html: element.outerHTML,
            target: [element.tagName.toLowerCase()]
          }]
        });
      });
      
      headingIssues.violations.forEach(({ element, issue }) => {
        customViolations.push({
          id: 'heading-order',
          description: issue,
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/heading-order',
          impact: 'moderate',
          tags: ['wcag2a', 'headings'],
          nodes: [{
            html: element.outerHTML,
            target: [element.tagName.toLowerCase()]
          }]
        });
      });
      
      contrastIssues.violations.forEach(({ element, contrast, required }) => {
        customViolations.push({
          id: 'color-contrast',
          description: `Insufficient color contrast: ${contrast.toFixed(2)}:1 (required: ${required}:1)`,
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
          impact: 'serious',
          tags: ['wcag2aa', 'color'],
          nodes: [{
            html: element.outerHTML,
            target: [element.tagName.toLowerCase()]
          }]
        });
      });
      
      return {
        ...report,
        violations: [...report.violations, ...customViolations]
      };
    },

    /**
     * Test keyboard navigation
     */
    async testKeyboardNavigation(component: ReactElement): Promise<{ passed: boolean; issues: string[] }> {
      const { container } = render(component);
      const tester = new KeyboardNavigationTester(container);
      const issues: string[] = [];
      
      try {
        const focusedElements = await tester.testTabNavigation();
        if (focusedElements.length === 0) {
          issues.push('No focusable elements found');
        }
        
        const escapeHandled = await tester.testEscapeKey();
        if (!escapeHandled && container.querySelector('[role="dialog"], [role="menu"]')) {
          issues.push('Escape key not handled in modal/menu component');
        }
        
        return { passed: issues.length === 0, issues };
      } catch (error) {
        issues.push(`Keyboard navigation test failed: ${error}`);
        return { passed: false, issues };
      }
    },

    /**
     * Test screen reader compatibility
     */
    async testScreenReader(component: ReactElement): Promise<{ announcements: string[]; issues: string[] }> {
      const { container } = render(component);
      const simulator = new ScreenReaderSimulator(container);
      const issues: string[] = [];
      const announcements: string[] = [];
      
      const interactiveElements = container.querySelectorAll('button, input, a, [role="button"]');
      
      interactiveElements.forEach(element => {
        const announcement = simulator.getScreenReaderAnnouncement(element as HTMLElement);
        announcements.push(announcement);
        
        if (!announcement.trim()) {
          issues.push(`Element has no accessible announcement: ${element.outerHTML}`);
        }
      });
      
      return { announcements, issues };
    },
  };
};
