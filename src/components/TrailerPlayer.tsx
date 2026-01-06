// Trailer player component with YouTube embed
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getYouTubeEmbedUrl } from '@/services/api';

interface TrailerPlayerProps {
    backdropUrl: string | null;
    trailerKey: string | null;
    title: string;
    className?: string;
}

export function TrailerPlayer({
    backdropUrl,
    trailerKey,
    title,
    className,
}: TrailerPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = () => {
        if (trailerKey) {
            setIsPlaying(true);
        }
    };

    const handleClose = () => {
        setIsPlaying(false);
    };

    return (
        <div className={cn('relative w-full aspect-[4/3] sm:aspect-video', className)}>
            {isPlaying && trailerKey ? (
                // YouTube Embed
                <div className="relative w-full h-full bg-black">
                    <iframe
                        src={`${getYouTubeEmbedUrl(trailerKey)}?autoplay=1&rel=0`}
                        title={`${title} - Trailer`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                    />
                    <button
                        onClick={handleClose}
                        className={cn(
                            'absolute top-3 right-3 z-20',
                            'w-8 h-8 rounded-full',
                            'bg-black/60 backdrop-blur-sm border border-white/20',
                            'flex items-center justify-center',
                            'hover:bg-black/80 transition-colors'
                        )}
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>
            ) : (
                // Poster with Play Button
                <>
                    {backdropUrl ? (
                        <Image
                            src={backdropUrl}
                            alt={`${title} backdrop`}
                            fill
                            sizes="(max-width: 480px) 100vw, 480px"
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
                            <span className="text-text-tertiary text-sm">No Preview</span>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101522] via-[#101522]/40 to-transparent" />

                    {/* Play Button */}
                    {trailerKey && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <button
                                onClick={handlePlay}
                                className={cn(
                                    'group relative flex items-center justify-center',
                                    'w-16 h-16 rounded-full',
                                    'bg-white/10 backdrop-blur-md border border-white/20',
                                    'transition-transform active:scale-95 hover:scale-105'
                                )}
                            >
                                {/* Pulse Animation */}
                                <div className="absolute inset-0 bg-accent-primary/20 rounded-full animate-pulse" />

                                {/* Inner Circle */}
                                <div
                                    className={cn(
                                        'w-12 h-12 rounded-full',
                                        'bg-accent-primary flex items-center justify-center',
                                        'shadow-lg shadow-accent-primary/40',
                                        'group-hover:scale-110 transition-transform duration-300'
                                    )}
                                >
                                    <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                                </div>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
