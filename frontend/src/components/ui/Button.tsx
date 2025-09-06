import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl';
    
    const variants = {
      primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-primary-300 active:from-primary-800 active:to-primary-900 shadow-primary-500/25 hover:shadow-primary-500/40',
      secondary: 'bg-gradient-to-r from-secondary-600 to-secondary-700 text-white hover:from-secondary-700 hover:to-secondary-800 focus:ring-secondary-300 active:from-secondary-800 active:to-secondary-900 shadow-secondary-500/25 hover:shadow-secondary-500/40',
      success: 'bg-gradient-to-r from-success-600 to-success-700 text-white hover:from-success-700 hover:to-success-800 focus:ring-success-300 active:from-success-800 active:to-success-900 shadow-success-500/25 hover:shadow-success-500/40',
      warning: 'bg-gradient-to-r from-warning-600 to-warning-700 text-white hover:from-warning-700 hover:to-warning-800 focus:ring-warning-300 active:from-warning-800 active:to-warning-900 shadow-warning-500/25 hover:shadow-warning-500/40',
      error: 'bg-gradient-to-r from-error-600 to-error-700 text-white hover:from-error-700 hover:to-error-800 focus:ring-error-300 active:from-error-800 active:to-error-900 shadow-error-500/25 hover:shadow-error-500/40',
      outline: 'border-2 border-primary-600 text-primary-600 bg-white hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 focus:ring-primary-300 active:bg-primary-200 shadow-primary-500/10 hover:shadow-primary-500/20 hover:border-primary-700',
      ghost: 'text-primary-600 bg-transparent hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 focus:ring-primary-300 active:bg-primary-200 shadow-none hover:shadow-lg hover:shadow-primary-500/10'
    };
    
    const sizes = {
      sm: 'px-4 py-2 text-sm h-9 min-w-[80px] tracking-wide',
      md: 'px-6 py-3 text-base h-11 min-w-[100px] tracking-wide',
      lg: 'px-8 py-4 text-lg h-12 min-w-[120px] tracking-wide'
    };
    
    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          loading && 'cursor-wait',
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };