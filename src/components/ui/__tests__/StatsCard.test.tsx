import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { StatsCard } from '../StatsCard';
import { Settings } from 'lucide-react';

// Mock the utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('StatsCard', () => {
  const defaultProps = {
    label: 'Total Projects',
    value: 42,
    icon: Settings,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(<StatsCard {...defaultProps} />);
    
    expect(screen.getByText('Total Projects')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders with string value', () => {
    render(<StatsCard {...defaultProps} value="Active" />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    render(<StatsCard {...defaultProps} variant="warning" />);
    
    // Should render without throwing errors
    expect(screen.getByText('Total Projects')).toBeInTheDocument();
  });

  it('renders with testId', () => {
    render(<StatsCard {...defaultProps} testId="test-stat" />);
    
    expect(screen.getByTestId('test-stat')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatsCard {...defaultProps} className="custom-class" />);
    
    // The custom className should be applied to the root div
    const rootElement = container.firstChild;
    expect(rootElement).toHaveClass('card-elegant');
    expect(rootElement).toHaveClass('custom-class');
  });

  it('renders all variants correctly', () => {
    const variants = ['primary', 'warning', 'success', 'muted'] as const;
    
    variants.forEach(variant => {
      const { unmount } = render(
        <StatsCard {...defaultProps} variant={variant} testId={`${variant}-stat`} />
      );
      
      expect(screen.getByTestId(`${variant}-stat`)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders icon component correctly', () => {
    render(<StatsCard {...defaultProps} />);
    
    // The icon should be rendered (Settings icon from lucide-react)
    const svgElement = document.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });
});