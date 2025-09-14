import { useSkipLinks } from '@/hooks/useKeyboardNavigation';

export const SkipLinks = () => {
  const { skipToMain, skipToNav } = useSkipLinks();

  return (
    <div className="skip-links sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-4 left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-ring"
        onClick={(e) => {
          e.preventDefault();
          skipToMain();
        }}
      >
        Skip to main content
      </a>
      <a
        href="#main-navigation"
        className="absolute top-4 left-32 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-ring"
        onClick={(e) => {
          e.preventDefault();
          skipToNav();
        }}
      >
        Skip to navigation
      </a>
    </div>
  );
};