// Sort option selector
'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortOption } from '@/types/content';

interface SortSelectProps {
    value: SortOption;
    onChange: (value: SortOption) => void;
    className?: string;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'popular', label: 'Popular Now' },
    { value: 'latest', label: 'Latest Added' },
    { value: 'highest_score', label: 'Highest Score' },
    { value: 'relevance', label: 'Relevance' },
];

export function SortSelect({ value, onChange, className }: SortSelectProps) {
    return (
        <div className={cn('grid grid-cols-2 gap-3', className)}>
            {SORT_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'flex items-center justify-center gap-2 p-3 rounded-xl border transition-all',
                        value === option.value
                            ? 'bg-accent-primary border-accent-primary text-white shadow-lg shadow-accent-primary/20'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                    )}
                >
                    {value === option.value && <ArrowUpDown className="w-4 h-4" />}
                    <span className="text-sm font-medium">{option.label}</span>
                </button>
            ))}
        </div>
    );
}
