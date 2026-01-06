// Ratings row component showing RT, IMDb, and Metacritic scores
'use client';

import React from 'react';
import { Ticket, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingsRowProps {
    rottenTomatoes?: string | null;  // "93%"
    imdbRating?: string | null;      // "8.8"
    metacritic?: string | null;      // "79"
    className?: string;
}

export function RatingsRow({
    rottenTomatoes,
    imdbRating,
    metacritic,
    className,
}: RatingsRowProps) {
    // Don't render if no ratings
    if (!rottenTomatoes && !imdbRating && !metacritic) {
        return null;
    }

    return (
        <div className={cn('flex items-center gap-2.5 text-xs font-medium', className)}>
            {/* Rotten Tomatoes */}
            {rottenTomatoes && (
                <div className="flex items-center gap-0.5 text-text-secondary">
                    <Ticket
                        className="w-3.5 h-3.5"
                        style={{ color: '#FA320A' }}
                        fill="#FA320A"
                    />
                    <span className="text-[10px]">{rottenTomatoes}</span>
                </div>
            )}

            {/* IMDb */}
            {imdbRating && (
                <div className="flex items-center gap-0.5 text-text-secondary">
                    <Star
                        className="w-3.5 h-3.5"
                        style={{ color: '#F5C518' }}
                        fill="#F5C518"
                    />
                    <span className="text-[10px]">{imdbRating}</span>
                </div>
            )}

            {/* Metacritic */}
            {metacritic && (
                <div className="flex items-center gap-0.5 text-text-secondary">
                    <div
                        className="h-3.5 w-3.5 rounded-sm flex items-center justify-center"
                        style={{ backgroundColor: '#FCC10B' }}
                    >
                        <span className="text-[8px] font-black text-black leading-none">M</span>
                    </div>
                    <span className="text-[10px]">{metacritic}</span>
                </div>
            )}
        </div>
    );
}
