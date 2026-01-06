// Matches Filter Overlay - Simplified filter modal for the matches page
'use client';

import React, { useEffect, useState } from 'react';
import { X, EyeOff, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    StreamingServiceGrid,
    GenreChips,
} from './filters';
import { Chip } from './Chip';
import type { MatchesFilters, StreamingServiceId } from '@/types/content';
import { DEFAULT_MATCHES_FILTERS, hasActiveMatchesFilters } from '@/types/content';

interface MatchesFilterOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    filters: MatchesFilters;
    onFiltersChange: (filters: MatchesFilters) => void;
    resultCount?: number;
}

// Mock user's saved streaming services - matches those in FilterOverlay
const USER_STREAMING_SERVICES: StreamingServiceId[] = [
    'netflix',
    'max',
    'hulu',
    'amazon_prime',
    'disney_plus',
    'apple_tv',
];

export function MatchesFilterOverlay({
    isOpen,
    onClose,
    filters,
    onFiltersChange,
    resultCount = 0,
}: MatchesFilterOverlayProps) {
    // Local state for animation
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle open/close animations
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsAnimating(true);
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

    const updateFilter = <K extends keyof MatchesFilters>(
        key: K,
        value: MatchesFilters[K]
    ) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        });
    };

    const handleReset = () => {
        onFiltersChange(DEFAULT_MATCHES_FILTERS);
    };

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                'fixed inset-0 z-[60] flex flex-col',
                'bg-bg-dark',
                isAnimating && !isOpen ? 'animate-slide-down' : 'animate-slide-up'
            )}
        >
            {/* Header */}
            <header className="sticky top-0 z-50 w-full bg-bg-dark/95 backdrop-blur-md border-b border-border-default">
                <div className="flex items-center justify-between px-4 h-14">
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/10 transition-all"
                        aria-label="Close filters"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <h1 className="text-base font-semibold tracking-wide text-text-primary">
                        Filters
                    </h1>

                    <button
                        onClick={handleReset}
                        className="text-sm font-medium text-accent-primary hover:text-accent-primary/80 transition-colors px-2 py-1 rounded-md active:bg-accent-primary/10"
                    >
                        Reset
                    </button>
                </div>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto pb-32">
                <div className="flex flex-col gap-8 px-5 py-6">
                    {/* Watched Status */}
                    <section>
                        <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4 pl-1">
                            Watched Status
                        </h2>
                        <div className="flex gap-3">
                            <Chip
                                variant={!filters.unwatchedOnly ? 'active' : 'default'}
                                onClick={() => updateFilter('unwatchedOnly', false)}
                                className="flex-1 justify-center py-3"
                            >
                                <Eye className="w-4 h-4" />
                                <span>All Matches</span>
                            </Chip>
                            <Chip
                                variant={filters.unwatchedOnly ? 'active' : 'default'}
                                onClick={() => updateFilter('unwatchedOnly', true)}
                                className="flex-1 justify-center py-3"
                            >
                                <EyeOff className="w-4 h-4" />
                                <span>Unwatched Only</span>
                            </Chip>
                        </div>
                    </section>

                    {/* Streaming Services */}
                    <section>
                        <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4 pl-1">
                            Streaming Services
                        </h2>
                        <StreamingServiceGrid
                            selected={filters.streamingServices}
                            available={USER_STREAMING_SERVICES}
                            onChange={(services) => updateFilter('streamingServices', services)}
                        />
                    </section>

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
                </div>
            </main>

            {/* Fixed Footer */}
            <div className="fixed bottom-0 left-0 w-full p-4 bg-bg-dark/90 backdrop-blur-xl border-t border-border-default z-40 pb-8">
                <button
                    onClick={onClose}
                    className="w-full bg-accent-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-accent-primary/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
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
