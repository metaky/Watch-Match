// Content Type Toggle - Movies/TV Shows segmented control
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ContentTypeToggleProps {
    value: 'movies' | 'tv' | null;
    onChange: (value: 'movies' | 'tv' | null) => void;
}

export function ContentTypeToggle({ value, onChange }: ContentTypeToggleProps) {
    const options = [
        { id: 'movies' as const, label: 'Movies' },
        { id: 'tv' as const, label: 'TV Shows' },
    ];

    return (
        <div className="bg-bg-elevated p-1 rounded-xl flex shadow-inner">
            {options.map((option) => {
                const isActive = value === option.id;
                return (
                    <button
                        key={option.id}
                        onClick={() => onChange(isActive ? null : option.id)}
                        className={cn(
                            'flex-1 py-2.5 text-sm font-medium rounded-lg transition-all',
                            'active:scale-[0.98]',
                            isActive
                                ? 'bg-bg-card text-text-primary shadow-sm font-semibold'
                                : 'text-text-tertiary hover:text-text-secondary'
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
