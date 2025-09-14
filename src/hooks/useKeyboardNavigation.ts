import { useEffect, useCallback, RefObject } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
  description?: string;
}

interface UseKeyboardNavigationOptions {
  shortcuts?: KeyboardShortcut[];
  focusableSelector?: string;
  containerRef?: RefObject<HTMLElement>;
}

/**
 * Hook for managing keyboard navigation and shortcuts
 */
export const useKeyboardNavigation = (options: UseKeyboardNavigationOptions = {}) => {
  const {
    shortcuts = [],
    focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    containerRef
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check for matching shortcuts
    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key === event.key &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.metaKey === event.metaKey
      );
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.callback();
      return;
    }

    // Handle arrow key navigation for focusable elements
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      handleArrowNavigation(event);
    }
  }, [shortcuts, containerRef]);

  const handleArrowNavigation = useCallback((event: KeyboardEvent) => {
    const container = containerRef?.current || document;
    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelector)
    ).filter(el => !el.disabled && el.offsetParent !== null);

    if (focusableElements.length === 0) return;

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowUp':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
        break;
      case 'ArrowDown':
        nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowLeft':
        // For horizontal navigation (like tabs or cards)
        nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
        break;
      case 'ArrowRight':
        // For horizontal navigation (like tabs or cards)
        nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
        break;
    }

    if (nextIndex !== currentIndex) {
      event.preventDefault();
      focusableElements[nextIndex]?.focus();
    }
  }, [focusableSelector, containerRef]);

  useEffect(() => {
    const element = containerRef?.current || document;
    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, containerRef]);

  /**
   * Focus the first focusable element in the container
   */
  const focusFirst = useCallback(() => {
    const container = containerRef?.current || document;
    const firstFocusable = container.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();
  }, [focusableSelector, containerRef]);

  /**
   * Focus the last focusable element in the container
   */
  const focusLast = useCallback(() => {
    const container = containerRef?.current || document;
    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
    const lastFocusable = focusableElements[focusableElements.length - 1];
    lastFocusable?.focus();
  }, [focusableSelector, containerRef]);

  /**
   * Get all registered keyboard shortcuts for display
   */
  const getShortcuts = useCallback(() => {
    return shortcuts.map(shortcut => ({
      key: shortcut.key,
      modifiers: [
        shortcut.ctrlKey && 'Ctrl',
        shortcut.metaKey && 'Cmd',
        shortcut.altKey && 'Alt',
        shortcut.shiftKey && 'Shift'
      ].filter(Boolean).join(' + '),
      description: shortcut.description || 'No description'
    }));
  }, [shortcuts]);

  return {
    focusFirst,
    focusLast,
    getShortcuts
  };
};

/**
 * Hook for managing focus trap (useful for modals)
 */
export const useFocusTrap = (isActive: boolean, containerRef: RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when trap is activated
    firstElement.focus();

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        // Let the parent handle escape (usually to close modal)
        const escapeEvent = new CustomEvent('focustrap:escape');
        container.dispatchEvent(escapeEvent);
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive, containerRef]);
};

/**
 * Hook for managing skip links accessibility
 */
export const useSkipLinks = () => {
  const skipToMain = useCallback(() => {
    const mainContent = document.querySelector('main, [role="main"]') as HTMLElement;
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const skipToNav = useCallback(() => {
    const navigation = document.querySelector('nav, [role="navigation"]') as HTMLElement;
    if (navigation) {
      navigation.focus();
      navigation.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return {
    skipToMain,
    skipToNav
  };
};