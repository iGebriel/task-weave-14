import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatsCardVariant = 'primary' | 'warning' | 'success' | 'muted';

export interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: StatsCardVariant;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  iconClassName?: string;
  testId?: string;
}

/**
 * Reusable StatsCard component that displays statistical information
 * with consistent styling and behavior.
 * 
 * This component eliminates the DRY violation found in ProjectDashboard
 * where stats card markup was repeated multiple times.
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon: Icon,
  variant = 'primary',
  className,
  valueClassName,
  labelClassName,
  iconClassName,
  testId,
}) => {
  const getVariantStyles = (variant: StatsCardVariant) => {
    const styles = {
      primary: {
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
      },
      warning: {
        iconBg: 'bg-warning/10',
        iconColor: 'text-warning',
      },
      success: {
        iconBg: 'bg-success/10',
        iconColor: 'text-success',
      },
      muted: {
        iconBg: 'bg-muted',
        iconColor: 'text-muted-foreground',
      },
    };
    return styles[variant];
  };

  const variantStyles = getVariantStyles(variant);

  return (
    <div 
      className={cn('card-elegant', className)}
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={cn(
            'text-sm font-medium text-muted-foreground',
            labelClassName
          )}>
            {label}
          </p>
          <p className={cn(
            'text-3xl font-bold text-foreground',
            valueClassName
          )}>
            {value}
          </p>
        </div>
        <div 
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            variantStyles.iconBg
          )}
        >
          <Icon 
            className={cn(
              'w-6 h-6',
              variantStyles.iconColor,
              iconClassName
            )} 
          />
        </div>
      </div>
    </div>
  );
};