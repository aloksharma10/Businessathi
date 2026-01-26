'use client';

import type * as React from 'react';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Search, Eye, EyeOff } from 'lucide-react';

interface InputProps extends Omit<React.ComponentProps<'input'>, 'size'> {
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showPasswordToggle?: boolean;
}

function Input({
  className,
  isLoading,
  type,
  size = 'md',
  showPasswordToggle = true,
  value,
  onChange,
  onFocus,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Determine if we should show the password toggle
  const isPasswordField = type === 'password';
  const isNumberField = type === 'number';
  const shouldShowPasswordToggle = isPasswordField && showPasswordToggle;

  // Determine the actual input type
  const inputType = isNumberField
    ? 'text'
    : (isPasswordField && showPassword ? 'text' : type);

  // Calculate right padding based on what icons are present
  const hasRightIcons = isLoading || shouldShowPasswordToggle;
  const rightPadding = hasRightIcons ? (isLoading && shouldShowPasswordToggle ? 'pr-16' : 'pr-10') : '';

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumberField) {
      const newValue = e.target.value;
      if (/^\d*\.?\d*$/.test(newValue)) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: newValue,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
      }
      // If invalid, do nothing (keep previous value)
    } else {
      onChange?.(e);
    }
  }, [isNumberField, onChange]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // if (isNumberField) {
      const val = String(value ?? '');
      if (val === '0' || val === '0.00' || val === '0.0') {
        e.target.select();
      }
    // }
    onFocus?.(e);
  }, [isNumberField, value, onFocus]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isNumberField) {
      // Allow digits, decimal point, control keys, navigation keys
      const allowedKeys = [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.',
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'Home', 'End',
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X for copy-paste
        ...(e.ctrlKey ? ['a', 'c', 'v', 'x'] : [])
      ];

      // Prevent input if key is not allowed and it's a printable character
      if (
        !allowedKeys.includes(e.key) &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        e.preventDefault();
      }
    }

    // Call the user's onKeyDown handler if provided
    props.onKeyDown?.(e);
  }, [isNumberField, props.onKeyDown]);

  return (
    <div className={cn('relative w-full', className?.includes('hidden') ? 'hidden' : '')}>
      {type === 'search' && (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <Search className="text-muted-foreground h-4 w-4" />
        </div>
      )}

      <input
        type={inputType}
        inputMode={isNumberField ? 'decimal' : undefined}
        pattern={isNumberField ? '\\d*\\.?\\d*' : undefined}
        value={value}
        data-slot="input"
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input shadow-xs flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
          rightPadding, // Dynamic right padding
          type === 'search' && 'pl-9',
          size === 'sm' && 'h-8 text-sm',
          size === 'md' && 'h-9 text-sm',
          size === 'lg' && 'h-10 text-sm',
          className
        )}
        disabled={isLoading || props.disabled}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        {...props}
      />

      {/* Right side icons container */}
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        {/* Password toggle button */}
        {shouldShowPasswordToggle && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="text-muted-foreground hover:text-foreground focus:text-foreground flex items-center justify-center transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50"
            disabled={isLoading || props.disabled}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div className="flex items-center justify-center">
            <div className="border-muted-foreground h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export { Input };
export type { InputProps };