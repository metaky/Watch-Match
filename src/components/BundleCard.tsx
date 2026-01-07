// Bundle card component for displaying bundles with poster collage
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/timeUtils';
import type { BundleDisplayData } from '@/lib/mockBundles';

interface BundleCardProps {
    bundle: BundleDisplayData;
    onClick?: (bundle: BundleDisplayData) => void;
    onDeleteBundle?: (bundle: BundleDisplayData) => void;
    className?: string;
}

export function BundleCard({
    bundle,
    onClick,
    onDeleteBundle,
    className,
}: BundleCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        onDeleteBundle?.(bundle);
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

                {/* Menu Button (always visible) */}
                <div ref={menuRef} className="absolute top-2 right-2">
                    <button
                        onClick={handleMenuClick}
                        className={cn(
                            'h-8 w-8 rounded-full',
                            'flex items-center justify-center',
                            'bg-black/40 backdrop-blur-sm text-white',
                            'hover:bg-black/60 transition-colors'
                        )}
                        aria-label="Bundle options"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-1 min-w-[140px] bg-bg-card rounded-lg shadow-xl border border-white/10 overflow-hidden z-10">
                            <button
                                onClick={handleDeleteClick}
                                className={cn(
                                    'w-full flex items-center gap-2 px-3 py-2.5',
                                    'text-left text-sm text-red-400',
                                    'hover:bg-red-500/10 transition-colors'
                                )}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Bundle
                            </button>
                        </div>
                    )}
                </div>
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
