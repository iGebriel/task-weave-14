import React, { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalFormProps {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  children: ReactNode;
  className?: string;
  submitTestId?: string;
}

/**
 * Reusable modal form wrapper component that provides consistent
 * structure, styling, and behavior for modal forms.
 * 
 * This component eliminates the DRY violation found in CreateTaskModal
 * and CreateProjectModal by providing a common modal form structure.
 */
export const ModalForm: React.FC<ModalFormProps> = ({
  open,
  onClose,
  title,
  onSubmit,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  isSubmitDisabled = false,
  children,
  className,
  submitTestId,
}) => {
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn('sm:max-w-[600px] card-elegant border-0', className)}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {children}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-border hover:bg-secondary/50"
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              className="btn-hero"
              disabled={isSubmitDisabled || isSubmitting}
              data-testid={submitTestId}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {submitLabel.replace(/\b\w/, l => l.toLowerCase())}ing...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};