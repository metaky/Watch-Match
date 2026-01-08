// Inline search filters for the search page
'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchFilters } from '@/types/content';
import { POPULAR_GENRES, hasActiveSearchFilters } from '@/types/content';

interface SearchFiltersBarProps {
    filters: SearchFilters;
    onFilterChange: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
    onOpenFullFilters: () => void;
    className?: string;
}

export function SearchFiltersBar({
    filters,
    onFilterChange,
    onOpenFullFilters,
    className,
}: SearchFiltersBarProps) {
    const hasFilters = hasActiveSearchFilters(filters);

    return (
        <div className={cn('space-y-3', className)}>
            {/* Content Type Toggle */}
            <div className="flex items-center gap-2">
                <ContentTypeButton
                    label="All"
                    isActive={filters.contentType === null}
                    onClick={() => onFilterChange('contentType', null)}
                />
                <ContentTypeButton
                    label="Movies"
                    isActive={filters.contentType === 'movies'}
                    onClick={() => onFilterChange('contentType', 'movies')}
                />
                <ContentTypeButton
                    label="TV Shows"
                    isActive={filters.contentType === 'tv'}
                    onClick={() => onFilterChange('contentType', 'tv')}
                />

                {/* Available to Stream Toggle */}
                <button
                    onClick={() => onFilterChange('availableToStream', !filters.availableToStream)}
                    className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
                        'transition-all duration-200',
                        filters.availableToStream
                            ? 'bg-accent-success text-white'
                            : 'bg-bg-card text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                    )}
                >
                    🎬 Streaming
                </button>

                {/* More Filters Button */}
                <button
                    onClick={onOpenFullFilters}
                    className={cn(
                        'ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg',
                        'text-sm font-medium transition-colors duration-200',
                        hasFilters
                            ? 'bg-accent-primary text-white'
                            : 'bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                    )}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                    {hasFilters && (
                        <span className="ml-1 w-2 h-2 rounded-full bg-white" />
                    )}
                </button>
            </div>

            {/* Genre Chips */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                {POPULAR_GENRES.map((genre) => {
                    const isSelected = filters.genres.includes(genre);
                    return (
                        <button
                            key={genre}
                            onClick={() => {
                                const newGenres = isSelected
                                    ? filters.genres.filter(g => g !== genre)
                                    : [...filters.genres, genre];
                                onFilterChange('genres', newGenres);
                            }}
                            className={cn(
                                'flex-shrink-0 px-3 py-1.5 rounded-full',
                                'text-sm font-medium whitespace-nowrap',
                                'transition-all duration-200',
                                isSelected
                                    ? 'bg-accent-primary text-white'
                                    : 'bg-bg-card text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                            )}
                        >
                            {genre}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function ContentTypeButton({
    label,
    isActive,
    onClick,
}: {
    label: string;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-200',
                isActive
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-card text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            )}
        >
            {label}
        </button>
    );
}
