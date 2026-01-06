// Button component
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'success';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className,
    disabled,
    children,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-dark disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-accent-primary hover:bg-accent-primary/90 text-white focus:ring-accent-primary',
        secondary: 'bg-bg-elevated hover:bg-bg-card text-text-primary border border-text-tertiary/30 focus:ring-accent-secondary',
        ghost: 'bg-transparent hover:bg-bg-elevated text-text-secondary hover:text-text-primary focus:ring-accent-primary',
        success: 'bg-accent-success hover:bg-accent-success/90 text-white focus:ring-accent-success',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            {children}
        </button>
    );
}
