// Cast row - horizontal scrollable cast members
'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/services/api';
import type { CastMember } from '@/types/content';

interface CastRowProps {
    cast: CastMember[];
    className?: string;
}

export function CastRow({ cast, className }: CastRowProps) {
    if (!cast || cast.length === 0) return null;

    return (
        <div className={className}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                Cast
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
                {cast.map((member) => {
                    const profileUrl = getImageUrl(member.profilePath, 'small', 'poster');
                    // Truncate name for display
                    const displayName = member.name.length > 12
                        ? `${member.name.split(' ')[0]} ${member.name.split(' ')[1]?.[0] || ''}.`
                        : member.name;

                    return (
                        <div
                            key={member.id}
                            className="flex flex-col gap-2 w-20 flex-shrink-0 text-center group"
                        >
                            <div
                                className={cn(
                                    'w-20 h-20 rounded-full overflow-hidden',
                                    'border-2 border-white/5',
                                    'group-hover:border-accent-primary/50 transition-colors'
                                )}
                            >
                                {profileUrl ? (
                                    <Image
                                        src={profileUrl}
                                        alt={member.name}
                                        width={80}
                                        height={80}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
                                        <span className="text-text-tertiary text-xl">
                                            {member.name[0]}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="text-xs text-gray-200 font-medium truncate w-full">
                                    {displayName}
                                </div>
                                <div className="text-[10px] text-gray-500 truncate w-full">
                                    {member.character}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
