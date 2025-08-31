import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const baseStyles = 'flex w-full rounded-xl border-2 bg-white px-4 py-3 text-base transition-all duration-300 ease-in-out file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md focus:shadow-lg transform hover:scale-[1.02] focus:scale-[1.02]';
    
    const variants = {
      default: 'border-neutral-200 hover:border-neutral-300 focus:border-primary-500 focus:ring-primary-200 bg-gradient-to-br from-white to-neutral-50 focus:from-primary-50 focus:to-white',
      error: 'border-error-400 hover:border-error-500 focus:border-error-500 focus:ring-error-200 bg-gradient-to-br from-white to-error-50 focus:from-error-50 focus:to-white'
    };
    
    const variant = error ? 'error' : 'default';
    
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-neutral-800 tracking-wide transition-colors duration-200 hover:text-primary-600"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors duration-300 peer-focus:text-primary-500">
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            id={inputId}
            className={cn(
              baseStyles,
              variants[variant],
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              'peer',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors duration-300 peer-focus:text-primary-500">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-error-600 font-medium animate-pulse">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-neutral-600 transition-colors duration-200">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };