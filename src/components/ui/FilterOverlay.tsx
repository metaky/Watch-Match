// Filter Overlay - Full-screen modal for advanced filtering
'use client';

import React, { useEffect, useState } from 'react';
import { X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import {
    ContentTypeToggle,
    StreamingServiceGrid,
    GenreChips,
    PartnerRatingCards,
    RangeSlider,
    ReleaseYearFilter,
    SortSelect,
} from './filters';
import type { AdvancedFilters, StreamingServiceId } from '@/types/content';
import { DEFAULT_FILTERS, hasActiveFilters } from '@/types/content';

interface FilterOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onApply?: () => void;
    resultCount?: number;
    mode?: 'home' | 'search';
}

// Mock user's saved streaming services - in production, this comes from Firebase
const USER_STREAMING_SERVICES: StreamingServiceId[] = [
    'netflix',
    'max',
    'hulu',
    'amazon_prime',
    'disney_plus',
    'apple_tv',
];

export function FilterOverlay({
    isOpen,
    onClose,
    onApply,
    resultCount = 0,
    mode = 'home',
}: FilterOverlayProps) {
    const {
        advancedFilters,
        updateAdvancedFilter,
        resetAdvancedFilters,
        searchFilters,
        updateSearchFilter,
        resetSearchFilters,
    } = useAppStore();

    const filters = mode === 'home' ? advancedFilters : (searchFilters as any as AdvancedFilters);
    const updateFilter = mode === 'home'
        ? (updateAdvancedFilter as (key: string, value: any) => void)
        : (updateSearchFilter as (key: string, value: any) => void);
    const resetFilters = mode === 'home' ? resetAdvancedFilters : resetSearchFilters;

    // Local state for animation
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle open/close animations
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsAnimating(true);
            // Small delay to trigger CSS animation
            requestAnimationFrame(() => {
                setIsAnimating(false);
            });
        } else if (isVisible) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setIsAnimating(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isVisible]);

    // Format runtime for display
    const formatRuntime = (minutes: number): string => {
        if (minutes >= 240) return '4h+';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
        if (hours > 0) return `${hours}h`;
        return `${mins}m`;
    };

    // Format IMDb rating for display
    const formatRating = (rating: number): string => {
        if (rating === 0) return 'Any';
        return `${rating.toFixed(1)}+`;
    };

    const handleApply = () => {
        onApply?.();
        onClose();
    };

    const handleReset = () => {
        resetFilters();
    };

    if (!isVisible) return null;

    const showActiveCount = mode === 'home' ? hasActiveFilters(advancedFilters) : false; // For simplicity in search mode

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex flex-col',
                'bg-bg-dark',
                isAnimating && !isOpen ? 'animate-slide-down' : 'animate-slide-up'
            )}
        >
            {/* Header */}
            <header
                className={cn(
                    'sticky top-0 z-50 w-full',
                    'bg-bg-dark/95 backdrop-blur-md',
                    'border-b border-border-default',
                    'transition-colors duration-300'
                )}
            >
                <div className="flex items-center justify-between px-4 h-14">
                    <button
                        onClick={onClose}
                        className={cn(
                            'flex items-center justify-center w-10 h-10 -ml-2 rounded-full',
                            'text-text-secondary hover:text-text-primary',
                            'hover:bg-white/10 transition-all'
                        )}
                        aria-label="Close filters"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <h1 className="text-base font-semibold tracking-wide text-text-primary">
                        Filters
                    </h1>

                    <button
                        onClick={handleReset}
                        className={cn(
                            'text-sm font-medium text-accent-primary',
                            'hover:text-accent-primary/80 transition-colors',
                            'px-2 py-1 rounded-md active:bg-accent-primary/10'
                        )}
                    >
                        Reset
                    </button>
                </div>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto pb-32">
                <div className="flex flex-col gap-8 px-5 py-6">
                    {/* Sort Order */}
                    <section>
                        <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4 pl-1">
                            Sort By
                        </h2>
                        <SortSelect
                            value={filters.sortBy}
                            onChange={(value) => updateFilter('sortBy', value)}
                        />
                    </section>

                    {/* Content Type */}
                    <section>
                        <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4 pl-1">
                            Content Type
                        </h2>
                        <ContentTypeToggle
                            value={filters.contentType}
                            onChange={(value) => updateFilter('contentType', value)}
                        />
                    </section>

                    {/* Streaming Services - Only relevant for home page watchlist discovery */}
                    {mode === 'home' && (
                        <section>
                            <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4 pl-1">
                                Streaming Services
                            </h2>
                            <StreamingServiceGrid
                                selected={filters.streamingServices}
                                available={USER_STREAMING_SERVICES}
                                onChange={(services) =>
                                    updateFilter('streamingServices', services)
                                }
                            />
                        </section>
                    )}

                    {/* Genre */}
                    <section>
                        <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4 pl-1">
                            Genre
                        </h2>
                        <GenreChips
                            selected={filters.genres}
                            onChange={(genres) => updateFilter('genres', genres)}
                        />
                    </section>

                    {/* Partner Rating - Only relevant for watchlist items */}
                    {mode === 'home' && (
                        <section>
                            <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4 pl-1">
                                Partner Rating
                            </h2>
                            <PartnerRatingCards
                                value={filters.partnerRating}
                                onChange={(value) => updateFilter('partnerRating', value)}
                            />
                        </section>
                    )}

                    {/* Min Score (IMDb) */}
                    <section>
                        <RangeSlider
                            label="Min IMDb Score"
                            value={filters.minImdbRating}
                            min={0}
                            max={10}
                            step={0.5}
                            onChange={(value) => updateFilter('minImdbRating', value)}
                            formatValue={formatRating}
                            formatMin="Any"
                            formatMax="10"
                            icon={<Star className="w-4 h-4" fill="currentColor" />}
                        />
                    </section>

                    {/* Max Runtime */}
                    <section>
                        <RangeSlider
                            label="Max Runtime"
                            value={filters.maxRuntime}
                            min={30}
                            max={240}
                            step={15}
                            onChange={(value) => updateFilter('maxRuntime', value)}
                            formatValue={formatRuntime}
                            formatMin="30m"
                            formatMax="4h+"
                        />
                    </section>

                    {/* Release Year */}
                    <section>
                        <ReleaseYearFilter
                            selectedDecades={filters.releaseDecades}
                            customRange={filters.customYearRange}
                            onDecadesChange={(decades) =>
                                updateFilter('releaseDecades', decades)
                            }
                            onCustomRangeChange={(range) =>
                                updateFilter('customYearRange', range)
                            }
                        />
                    </section>
                </div>
            </main>

            {/* Fixed Footer */}
            <div
                className={cn(
                    'fixed bottom-0 left-0 w-full p-4',
                    'bg-bg-dark/90 backdrop-blur-xl',
                    'border-t border-border-default z-40 pb-8'
                )}
            >
                <button
                    onClick={handleApply}
                    className={cn(
                        'w-full bg-accent-primary hover:bg-blue-600',
                        'text-white font-bold py-4 rounded-xl',
                        'shadow-lg shadow-accent-primary/25',
                        'transition-all flex items-center justify-center gap-2',
                        'active:scale-[0.98]'
                    )}
                >
                    <span>
                        {resultCount > 0
                            ? `Show ${resultCount} Result${resultCount !== 1 ? 's' : ''}`
                            : 'Apply Filters'}
                    </span>
                </button>
            </div>
        </div>
    );
}
