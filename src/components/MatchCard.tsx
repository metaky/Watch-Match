// Match card component for the matches grid view
'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { MatchBadge } from './MatchBadge';
import { UserAvatarGroup } from './UserAvatarGroup';
import { getBothUsers } from '@/lib/mockUsers';
import type { BundleContentItem } from '@/lib/mockBundleContent';

interface MatchCardProps {
    content: BundleContentItem;
    onClick?: (content: BundleContentItem) => void;
    className?: string;
}

export function MatchCard({ content, onClick, className }: MatchCardProps) {
    // For matched items, both users said "yes"
    const matchedUsers = getBothUsers();

    return (
        <article
            onClick={() => onClick?.(content)}
            className={cn(
                'group flex flex-col gap-2 cursor-pointer',
                className
            )}
        >
            {/* Poster Image Container */}
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg bg-bg-card">
                {/* Poster Image */}
                <div
                    className={cn(
                        'absolute inset-0 bg-cover bg-center',
                        'transition-transform duration-500 group-hover:scale-105'
                    )}
                    style={{
                        backgroundImage: content.posterUrl
                            ? `url("${content.posterUrl}")`
                            : undefined,
                    }}
                >
                    {content.posterUrl ? (
                        <Image
                            src={content.posterUrl}
                            alt={`${content.title} poster`}
                            fill
                            sizes="(max-width: 480px) 50vw, 200px"
                            className="object-cover"
                            priority={false}
                        />
                    ) : (
                        <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
                            <span className="text-text-tertiary text-xs">No Poster</span>
                        </div>
                    )}
                </div>

                {/* Match Badge - Top Right */}
                <div className="absolute top-2 right-2 z-10">
                    <MatchBadge />
                </div>
            </div>

            {/* Content Info Below Card */}
            <div className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                    {/* Title */}
                    <h3 className="text-text-primary text-sm font-bold leading-tight line-clamp-1">
                        {content.title}
                    </h3>
                    {/* Metadata */}
                    <p className="text-text-tertiary text-[10px] mt-0.5">
                        {content.year && <span>{content.year}</span>}
                        {content.year && content.runtime && <span> • </span>}
                        {content.runtime && <span>{content.runtime}</span>}
                    </p>
                </div>

                {/* User Avatars - Who matched */}
                <UserAvatarGroup users={matchedUsers} />
            </div>
        </article>
    );
}
