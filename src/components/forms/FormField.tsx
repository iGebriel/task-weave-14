import React, { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  error?: string;
  children: ReactNode;
}

/**
 * Reusable form field wrapper component that provides consistent
 * styling and behavior for form inputs.
 * 
 * This component eliminates repetition in modal forms by providing
 * a common structure for form fields with labels, error states, etc.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  className,
  labelClassName,
  error,
  children,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label 
          htmlFor={htmlFor} 
          className={cn('text-sm font-medium', labelClassName)}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};