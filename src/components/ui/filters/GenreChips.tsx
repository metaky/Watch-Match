// Genre Chips - Multi-select genre filter with expandable list
'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { POPULAR_GENRES } from '@/types/content';

interface GenreChipsProps {
    selected: string[];
    onChange: (genres: string[]) => void;
}

// Additional genres that can be shown when expanded
const ADDITIONAL_GENRES = [
    'Mystery',
    'Family',
    'War',
    'History',
    'Music',
    'Western',
    'Biography',
] as const;

export function GenreChips({ selected, onChange }: GenreChipsProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleGenre = (genre: string) => {
        if (selected.includes(genre)) {
            onChange(selected.filter((g) => g !== genre));
        } else {
            onChange([...selected, genre]);
        }
    };

    const visibleGenres = isExpanded
        ? [...POPULAR_GENRES, ...ADDITIONAL_GENRES]
        : POPULAR_GENRES;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2.5">
                {visibleGenres.map((genre) => {
                    const isSelected = selected.includes(genre);
                    return (
                        <button
                            key={genre}
                            onClick={() => toggleGenre(genre)}
                            className={cn(
                                'px-4 py-2 text-sm font-medium rounded-lg transition-all active:scale-95',
                                isSelected
                                    ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20'
                                    : 'bg-bg-card text-text-secondary border border-border-default hover:bg-bg-elevated hover:text-text-primary'
                            )}
                        >
                            {genre}
                        </button>
                    );
                })}
            </div>

            {/* Expand/Collapse button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs font-medium text-text-tertiary hover:text-text-secondary transition-colors"
            >
                {isExpanded ? (
                    <>
                        <ChevronUp className="w-4 h-4" />
                        Show Less
                    </>
                ) : (
                    <>
                        <ChevronDown className="w-4 h-4" />
                        Show More Genres
                    </>
                )}
            </button>
        </div>
    );
}
