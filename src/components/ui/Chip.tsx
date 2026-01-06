// Chip component for filters and tags
import React from 'react';
import { cn } from '@/lib/utils';

interface ChipProps {
    children: React.ReactNode;
    variant?: 'default' | 'active' | 'success' | 'warning';
    size?: 'sm' | 'md';
    onClick?: () => void;
    onRemove?: () => void;
    className?: string;
}

export function Chip({
    children,
    variant = 'default',
    size = 'md',
    onClick,
    onRemove,
    className,
}: ChipProps) {
    const baseStyles = 'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200';

    const variants = {
        default: 'bg-bg-elevated text-text-secondary hover:bg-bg-card hover:text-text-primary',
        active: 'bg-accent-primary/20 text-accent-primary border border-accent-primary/40',
        success: 'bg-accent-success/20 text-accent-success border border-accent-success/40',
        warning: 'bg-accent-warning/20 text-accent-warning border border-accent-warning/40',
    };

    const sizes = {
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
    };

    const isClickable = !!onClick;

    return (
        <span
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={onClick}
            onKeyDown={(e) => {
                if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                isClickable && 'cursor-pointer',
                className
            )}
        >
            {children}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-white/10 transition-colors"
                    aria-label="Remove"
                >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </span>
    );
}
