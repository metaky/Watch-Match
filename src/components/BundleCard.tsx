// Bundle card component for displaying bundles with poster collage
'use client';

import React from 'react';
import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/timeUtils';
import type { BundleDisplayData } from '@/lib/mockBundles';

interface BundleCardProps {
    bundle: BundleDisplayData;
    onClick?: (bundle: BundleDisplayData) => void;
    onMenuClick?: (bundle: BundleDisplayData) => void;
    className?: string;
}

export function BundleCard({
    bundle,
    onClick,
    onMenuClick,
    className,
}: BundleCardProps) {
    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMenuClick?.(bundle);
    };

    const itemCount = bundle.contentIds.length;
    const posterCount = bundle.posterPaths.length;
    const timeAgo = formatRelativeTime(bundle.createdAt);

    return (
        <article
            onClick={() => onClick?.(bundle)}
            className={cn(
                'group relative flex flex-col bg-bg-card rounded-xl overflow-hidden',
                'shadow-lg card-hover cursor-pointer',
                className
            )}
        >
            {/* Poster Collage */}
            <div className="relative h-40 w-full">
                {posterCount >= 3 ? (
                    // Three-image collage layout (2/3 + 1/3 split)
                    <div className="flex h-full w-full">
                        {/* Main large poster (2/3 width) */}
                        <div className="relative w-2/3 h-full">
                            <Image
                                src={bundle.posterPaths[0]}
                                alt={`${bundle.title} poster`}
                                fill
                                sizes="(max-width: 480px) 33vw, 150px"
                                className="object-cover"
                            />
                        </div>
                        {/* Two stacked posters (1/3 width) */}
                        <div className="w-1/3 h-full flex flex-col border-l border-bg-dark/30">
                            <div className="relative h-1/2 w-full border-b border-bg-dark/30">
                                <Image
                                    src={bundle.posterPaths[1]}
                                    alt={`${bundle.title} poster 2`}
                                    fill
                                    sizes="(max-width: 480px) 15vw, 75px"
                                    className="object-cover"
                                />
                            </div>
                            <div className="relative h-1/2 w-full">
                                <Image
                                    src={bundle.posterPaths[2]}
                                    alt={`${bundle.title} poster 3`}
                                    fill
                                    sizes="(max-width: 480px) 15vw, 75px"
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    </div>
                ) : posterCount >= 1 ? (
                    // Single image with gradient overlay
                    <>
                        <Image
                            src={bundle.posterPaths[0]}
                            alt={`${bundle.title} poster`}
                            fill
                            sizes="(max-width: 480px) 50vw, 200px"
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </>
                ) : (
                    // Fallback placeholder
                    <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
                        <span className="text-text-tertiary text-sm">No Posters</span>
                    </div>
                )}

                {/* Menu Button (appears on hover) */}
                <button
                    onClick={handleMenuClick}
                    className={cn(
                        'absolute top-2 right-2 h-8 w-8 rounded-full',
                        'flex items-center justify-center',
                        'bg-black/40 backdrop-blur-sm text-white',
                        'opacity-0 group-hover:opacity-100 transition-opacity'
                    )}
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-3">
                {/* Bundle Title */}
                <h3 className="text-text-primary text-base font-bold leading-tight line-clamp-1">
                    {bundle.title}
                </h3>

                {/* Item Count and Timestamp */}
                <div className="flex items-center justify-between mt-2">
                    <span className="text-accent-primary text-xs font-semibold bg-accent-primary/10 px-2 py-0.5 rounded">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                    <span className="text-text-tertiary text-[10px]">
                        {timeAgo}
                    </span>
                </div>
            </div>
        </article>
    );
}
