// Content card component for movie/TV show display
'use client';

import React from 'react';
import Image from 'next/image';
import { Plus, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StreamingBadge } from './StreamingBadge';
import { PartnerStatusBadge } from './PartnerStatusBadge';
import { RatingsRow } from './RatingsRow';
import type { ContentCardData } from '@/types/content';

interface ContentCardProps {
    content: ContentCardData;
    onAddToBundle?: (content: ContentCardData) => void;
    onAddToWatchlist?: (content: ContentCardData) => void;
    onClick?: (content: ContentCardData) => void;
    className?: string;
}

export function ContentCard({
    content,
    onAddToBundle,
    onAddToWatchlist,
    onClick,
    className,
}: ContentCardProps) {
    const handleAddToBundle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToBundle?.(content);
    };

    const handleAddToWatchlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToWatchlist?.(content);
    };

    return (
        <article
            onClick={() => onClick?.(content)}
            className={cn(
                'group relative flex flex-col bg-bg-card rounded-xl overflow-hidden',
                'shadow-sm card-hover cursor-pointer',
                className
            )}
        >
            {/* Poster Image */}
            <div className="aspect-[2/3] w-full relative overflow-hidden">
                {/* Badges - Top Right */}
                <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 items-end">
                    {/* Streaming Provider Badge */}
                    {content.streamingProvider && (
                        <StreamingBadge serviceId={content.streamingProvider.id} />
                    )}

                    {/* Partner Status Badge */}
                    <PartnerStatusBadge status={content.partnerStatus} />
                </div>

                {/* Add to Bundle Button - Top Left (appears on hover) */}
                <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
                    <button
                        onClick={handleAddToBundle}
                        className={cn(
                            'h-8 w-8 rounded-full backdrop-blur-sm',
                            'flex items-center justify-center',
                            'bg-accent-primary/90 text-white shadow-lg',
                            'hover:bg-accent-primary transition-colors'
                        )}
                        title="Add to bundle"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleAddToWatchlist}
                        className={cn(
                            'h-8 w-8 rounded-full backdrop-blur-sm',
                            'flex items-center justify-center',
                            'bg-black/60 text-white shadow-lg',
                            'hover:bg-accent-primary transition-colors'
                        )}
                        title="Add to Watchlist"
                    >
                        <Bookmark className="w-4 h-4" />
                    </button>
                </div>

                {/* Poster */}
                {content.posterUrl ? (
                    <Image
                        src={content.posterUrl}
                        alt={`${content.title} poster`}
                        fill
                        sizes="(max-width: 480px) 50vw, 200px"
                        className="object-cover img-zoom"
                        priority={false}
                    />
                ) : (
                    <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
                        <span className="text-text-tertiary text-sm">No Poster</span>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
            </div>

            {/* Content Info */}
            <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                    {/* Title */}
                    <h3 className="font-bold text-base leading-tight text-text-primary line-clamp-1 mb-1">
                        {content.title}
                    </h3>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-tertiary mb-2.5">
                        {content.year && <span>{content.year}</span>}
                        {content.year && content.runtime && <span className="text-[8px] opacity-60">•</span>}
                        {content.runtime && <span>{content.runtime}</span>}
                        {(content.year || content.runtime) && content.genre && <span className="text-[8px] opacity-60">•</span>}
                        {content.genre && <span className="truncate">{content.genre}</span>}
                    </div>

                    {/* Ratings */}
                    <RatingsRow
                        rottenTomatoes={content.rottenTomatoes}
                        imdbRating={content.imdbRating}
                        metacritic={content.metacritic}
                    />
                </div>
            </div>
        </article>
    );
}
