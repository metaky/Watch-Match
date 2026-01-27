// Swipeable content card for bundle detail view
'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlotOverlay } from './PlotOverlay';
import type { BundleContentItem, BundleRating } from '@/lib/mockBundleContent';
import type { PartnerStatus } from '@/types/content';

interface SwipeableContentCardProps {
    content: BundleContentItem;
    onSwipe: (rating: BundleRating) => void;
    className?: string;
}

// Partner status display config
const PARTNER_STATUS_CONFIG: Record<Exclude<PartnerStatus, null>, {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
}> = {
    liked: {
        label: 'Yes',
        color: 'text-emerald-500',
        bgColor: 'bg-bg-dark/80',
        borderColor: 'border-emerald-500/30',
    },
    not_important: {
        label: 'Maybe',
        color: 'text-blue-400',
        bgColor: 'bg-bg-dark/80',
        borderColor: 'border-blue-400/30',
    },
    wont_watch: {
        label: 'No',
        color: 'text-red-500',
        bgColor: 'bg-bg-dark/80',
        borderColor: 'border-red-500/30',
    },
};

export function SwipeableContentCard({
    content,
    onSwipe,
    className,
}: SwipeableContentCardProps) {
    const [isPlotOpen, setIsPlotOpen] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const startPos = useRef({ x: 0, y: 0 });

    // Swipe threshold
    const SWIPE_THRESHOLD = 100;
    const SWIPE_DOWN_THRESHOLD = 80;

    // Handle touch/mouse start
    const handleDragStart = (clientX: number, clientY: number) => {
        setIsDragging(true);
        startPos.current = { x: clientX, y: clientY };
    };

    // Handle touch/mouse move
    const handleDragMove = (clientX: number, clientY: number) => {
        if (!isDragging) return;
        const deltaX = clientX - startPos.current.x;
        const deltaY = clientY - startPos.current.y;
        setDragOffset({ x: deltaX, y: Math.max(0, deltaY) }); // Only allow downward drag
    };

    // Handle touch/mouse end
    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const { x, y } = dragOffset;

        if (x > SWIPE_THRESHOLD) {
            // Swipe right = Yes
            onSwipe('yes');
        } else if (x < -SWIPE_THRESHOLD) {
            // Swipe left = Not Now
            onSwipe('not_now');
        } else if (y > SWIPE_DOWN_THRESHOLD) {
            // Swipe down = Never
            onSwipe('never');
        }

        // Reset position
        setDragOffset({ x: 0, y: 0 });
    };

    // Mouse events
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        handleDragMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
        handleDragEnd();
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            handleDragEnd();
        }
    };

    // Touch events
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleDragStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
        handleDragEnd();
    };

    // Calculate rotation based on drag
    const rotation = dragOffset.x * 0.05;
    const scale = isDragging ? 1.02 : 1;

    // Stamp opacity based on drag distance
    const yesOpacity = Math.min(1, Math.max(0, dragOffset.x / SWIPE_THRESHOLD));
    const nopeOpacity = Math.min(1, Math.max(0, -dragOffset.x / SWIPE_THRESHOLD));
    const neverOpacity = Math.min(1, Math.max(0, dragOffset.y / SWIPE_DOWN_THRESHOLD));

    const partnerConfig = content.partnerStatus ? PARTNER_STATUS_CONFIG[content.partnerStatus] : null;
    const suggestedByText = content.addedBy === 'partner' ? 'Partner suggests' : 'You suggested';

    return (
        <div
            ref={cardRef}
            className={cn(
                'relative w-full aspect-[2/3] max-h-[55vh]',
                'bg-gray-900 rounded-2xl shadow-card overflow-hidden',
                'border border-white/10 cursor-grab active:cursor-grabbing',
                'touch-none select-none',
                className
            )}
            style={{
                transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Poster Image */}
            {content.posterUrl ? (
                <Image
                    src={content.posterUrl}
                    alt={`${content.title} poster`}
                    fill
                    sizes="(max-width: 480px) 100vw, 400px"
                    className="object-cover"
                    priority
                    draggable={false}
                />
            ) : (
                <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
                    <span className="text-text-tertiary">No Poster</span>
                </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

            {/* Partner Rating Badge - Top Right */}
            {partnerConfig && (
                <div className="absolute top-4 right-4 z-20">
                    <div
                        className={cn(
                            'flex items-center gap-2.5',
                            'backdrop-blur-xl',
                            'pl-1.5 pr-3 py-1.5 rounded-full',
                            'shadow-lg shadow-black/20',
                            'ring-1 ring-white/5',
                            partnerConfig.bgColor,
                            `border ${partnerConfig.borderColor}`
                        )}
                    >
                        <div
                            className={cn(
                                'size-7 rounded-full flex items-center justify-center',
                                'border shadow-inner',
                                partnerConfig.color.replace('text-', 'border-').replace('500', '500/50'),
                                partnerConfig.color.replace('text-', 'bg-').replace('500', '500/20')
                            )}
                        >
                            <Heart className={cn('w-4 h-4', partnerConfig.color)} fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">
                                Partner rated
                            </span>
                            <span className={cn('text-xs font-black uppercase tracking-widest leading-none', partnerConfig.color)}>
                                {partnerConfig.label}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Swipe Stamps */}
            <div
                className={cn(
                    'absolute top-8 left-8 -rotate-12',
                    'border-4 border-emerald-500 text-emerald-500',
                    'rounded-lg px-4 py-1',
                    'font-black text-3xl uppercase tracking-widest',
                    'pointer-events-none'
                )}
                style={{ opacity: yesOpacity }}
            >
                Yes
            </div>
            <div
                className={cn(
                    'absolute top-8 right-8 rotate-12',
                    'border-4 border-red-500 text-red-500',
                    'rounded-lg px-4 py-1',
                    'font-black text-3xl uppercase tracking-widest',
                    'pointer-events-none'
                )}
                style={{ opacity: nopeOpacity }}
            >
                Nope
            </div>
            <div
                className={cn(
                    'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                    'border-4 border-gray-400 text-gray-400',
                    'rounded-lg px-4 py-1',
                    'font-black text-3xl uppercase tracking-widest',
                    'bg-black/50 backdrop-blur-md',
                    'pointer-events-none'
                )}
                style={{ opacity: neverOpacity }}
            >
                Never
            </div>

            {/* Content Info - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-3">
                {/* Suggested By */}
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/90 text-xs font-semibold backdrop-blur-md bg-black/30 px-2 py-1 rounded-full border border-white/10">
                        {suggestedByText}
                    </span>
                </div>

                {/* Title */}
                <div>
                    <h1 className="text-white text-3xl font-bold leading-none tracking-tight mb-2 drop-shadow-md">
                        {content.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-300 font-medium">
                        <span className="text-white bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold backdrop-blur-sm border border-white/10 uppercase">
                            {content.genre}
                        </span>
                        <span>{content.year}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                        <span>{content.runtime}</span>
                    </div>
                </div>

                {/* Plot Summary - Tappable */}
                <p
                    className="text-gray-300 text-sm line-clamp-2 leading-relaxed opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsPlotOpen(true);
                    }}
                >
                    {content.overview}
                </p>
            </div>

            {/* Plot Overlay */}
            <PlotOverlay
                plot={content.overview}
                title={content.title}
                isOpen={isPlotOpen}
                onClose={() => setIsPlotOpen(false)}
            />
        </div>
    );
}
