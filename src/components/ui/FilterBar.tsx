// Filter bar component for content filtering
'use client';

import React from 'react';
import { PlayCircle, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentFilter } from '@/types/content';

interface FilterBarProps {
    activeFilter: ContentFilter;
    onFilterChange: (filter: ContentFilter) => void;
    onOpenSettings?: () => void;
    hasActiveFilters?: boolean;
    className?: string;
}

interface FilterOption {
    id: ContentFilter;
    label: string;
    icon?: React.ElementType;
    iconColor?: string;
}

const FILTER_OPTIONS: FilterOption[] = [
    { id: 'all', label: 'All' },
    { id: 'movies', label: 'Movies' },
    { id: 'tv', label: 'TV Shows' },
    { id: 'available', label: 'Available to Stream', icon: PlayCircle, iconColor: 'text-green-500' },
];

export function FilterBar({
    activeFilter,
    onFilterChange,
    onOpenSettings,
    hasActiveFilters = false,
    className,
}: FilterBarProps) {
    return (
        <div className={cn('flex items-center justify-between', className)}>
            {/* Scrollable filter tabs */}
            <div className="w-full overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-2 min-w-max pr-4">
                    {FILTER_OPTIONS.map((option) => (
                        <FilterButton
                            key={option.id}
                            option={option}
                            isActive={activeFilter === option.id}
                            onClick={() => onFilterChange(option.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Settings/Filter button */}
            <div className="pl-2 border-l border-border-subtle flex-shrink-0">
                <button
                    onClick={onOpenSettings}
                    className={cn(
                        'relative flex items-center justify-center w-10 h-10 rounded-lg',
                        'bg-bg-card border border-border-default',
                        'text-text-secondary hover:text-text-primary',
                        'hover:bg-bg-elevated transition-colors active:scale-95',
                        hasActiveFilters && 'border-accent-primary/50'
                    )}
                    aria-label="Filter settings"
                >
                    <SlidersHorizontal className="w-5 h-5" />
                    {/* Active filters indicator dot */}
                    {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-primary rounded-full border-2 border-bg-dark" />
                    )}
                </button>
            </div>
        </div>
    );
}

interface FilterButtonProps {
    option: FilterOption;
    isActive: boolean;
    onClick: () => void;
}

function FilterButton({ option, isActive, onClick }: FilterButtonProps) {
    const Icon = option.icon;

    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg',
                'transition-all duration-200 active:scale-95',
                isActive
                    ? 'bg-accent-primary text-white shadow-sm shadow-accent-primary/30'
                    : 'bg-bg-card border border-border-default text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            )}
        >
            {Icon && <Icon className={cn('w-4 h-4', option.iconColor)} />}
            {option.label}
        </button>
    );
}
