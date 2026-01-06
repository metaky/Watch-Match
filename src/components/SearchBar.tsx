// Search Bar component with debounced input
'use client';

import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
}

export function SearchBar({
    value,
    onChange,
    placeholder = 'Search movies & TV shows...',
    autoFocus = false,
    className,
}: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    const handleClear = () => {
        onChange('');
        inputRef.current?.focus();
    };

    return (
        <div className={cn('relative', className)}>
            {/* Search Icon */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search className="w-5 h-5 text-text-tertiary" />
            </div>

            {/* Input Field */}
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    'w-full h-12 pl-12 pr-12',
                    'bg-bg-card rounded-xl',
                    'text-text-primary placeholder:text-text-tertiary',
                    'border border-border-subtle',
                    'focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary',
                    'transition-all duration-200'
                )}
            />

            {/* Clear Button */}
            {value && (
                <button
                    onClick={handleClear}
                    className={cn(
                        'absolute right-3 top-1/2 -translate-y-1/2',
                        'w-7 h-7 rounded-full',
                        'bg-bg-elevated hover:bg-bg-elevated/80',
                        'flex items-center justify-center',
                        'text-text-tertiary hover:text-text-secondary',
                        'transition-colors duration-200'
                    )}
                    aria-label="Clear search"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
