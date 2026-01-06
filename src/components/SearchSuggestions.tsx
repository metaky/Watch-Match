// Search suggestions dropdown
'use client';

import React from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentCardData } from '@/types/content';

interface SearchSuggestionsProps {
    suggestions: ContentCardData[];
    isLoading: boolean;
    isVisible: boolean;
    onSelect: (item: ContentCardData) => void;
    className?: string;
}

export function SearchSuggestions({
    suggestions,
    isLoading,
    isVisible,
    onSelect,
    className,
}: SearchSuggestionsProps) {
    if (!isVisible) return null;

    if (isLoading && suggestions.length === 0) {
        return (
            <div className={cn('absolute top-full left-0 right-0 mt-2 p-4 bg-bg-card border border-border-subtle rounded-xl shadow-xl z-50 flex justify-center', className)}>
                <Loader2 className="w-5 h-5 text-accent-primary animate-spin" />
            </div>
        );
    }

    if (suggestions.length === 0) return null;

    return (
        <div className={cn(
            'absolute top-full left-0 right-0 mt-2 py-2',
            'bg-bg-card border border-border-subtle rounded-xl shadow-xl z-50',
            'max-h-[60vh] overflow-y-auto scrollbar-thin',
            className
        )}>
            {suggestions.map((item) => (
                <button
                    key={`${item.mediaType}-${item.id}`}
                    onClick={() => onSelect(item)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left group"
                >
                    {/* Tiny Poster */}
                    <div className="relative w-8 h-12 flex-shrink-0 bg-bg-elevated rounded overflow-hidden">
                        {item.posterUrl ? (
                            <Image
                                src={item.posterUrl}
                                alt={item.title}
                                fill
                                sizes="32px"
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-text-tertiary">
                                N/A
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-text-primary truncate group-hover:text-accent-primary transition-colors">
                                {item.title}
                            </h4>
                            {item.year && (
                                <span className="text-xs text-text-tertiary flex-shrink-0">
                                    ({item.year})
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-tertiary mt-0.5">
                            <span className="capitalize">{item.mediaType === 'movie' ? 'Movie' : 'TV Show'}</span>
                            {item.imdbRating && (
                                <>
                                    <span>•</span>
                                    <span className="text-yellow-500/80">★ {item.imdbRating}</span>
                                </>
                            )}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
