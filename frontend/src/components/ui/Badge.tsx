import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md backdrop-blur-sm';
    
    const variants = {
      primary: 'bg-gradient-to-r from-primary-100 to-primary-200/80 text-primary-800 border border-primary-300/50 hover:from-primary-200 hover:to-primary-300/80 hover:border-primary-400/60 hover:text-primary-900 shadow-primary-500/20',
      secondary: 'bg-gradient-to-r from-secondary-100 to-secondary-200/80 text-secondary-800 border border-secondary-300/50 hover:from-secondary-200 hover:to-secondary-300/80 hover:border-secondary-400/60 hover:text-secondary-900 shadow-secondary-500/20',
      success: 'bg-gradient-to-r from-success-100 to-success-200/80 text-success-800 border border-success-300/50 hover:from-success-200 hover:to-success-300/80 hover:border-success-400/60 hover:text-success-900 shadow-success-500/20',
      warning: 'bg-gradient-to-r from-warning-100 to-warning-200/80 text-warning-800 border border-warning-300/50 hover:from-warning-200 hover:to-warning-300/80 hover:border-warning-400/60 hover:text-warning-900 shadow-warning-500/20',
      error: 'bg-gradient-to-r from-error-100 to-error-200/80 text-error-800 border border-error-300/50 hover:from-error-200 hover:to-error-300/80 hover:border-error-400/60 hover:text-error-900 shadow-error-500/20',
      neutral: 'bg-gradient-to-r from-neutral-100 to-neutral-200/80 text-neutral-800 border border-neutral-300/50 hover:from-neutral-200 hover:to-neutral-300/80 hover:border-neutral-400/60 hover:text-neutral-900 shadow-neutral-500/20'
    };
    
    const sizes = {
      sm: 'px-3 py-1 text-xs h-6 min-w-[2rem] tracking-wide',
      md: 'px-4 py-1.5 text-sm h-7 min-w-[2.5rem] tracking-wide',
      lg: 'px-5 py-2 text-base h-8 min-w-[3rem] tracking-wide letter-spacing-wide'
    };
    
    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };