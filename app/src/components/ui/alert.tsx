import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const alertVariants = cva('rounded-md px-4 py-3 text-sm', {
  variants: {
    variant: {
      success: 'bg-sprout/15 text-moss-dark border border-sprout/40',
      error: 'bg-red-50 text-red-700 border border-red-200',
    },
  },
  defaultVariants: {
    variant: 'success',
  },
});

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="status" className={cn(alertVariants({ variant, className }))} {...props} />
  )
);
Alert.displayName = 'Alert';

export { Alert };
