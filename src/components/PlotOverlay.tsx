// Plot overlay component for expandable plot summary
'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlotOverlayProps {
    plot: string;
    title: string;
    isOpen: boolean;
    onClose: () => void;
}

export function PlotOverlay({ plot, title, isOpen, onClose }: PlotOverlayProps) {
    if (!isOpen) return null;

    return (
        <div
            className={cn(
                'absolute inset-0 z-30',
                'bg-black/80 backdrop-blur-md',
                'flex flex-col justify-end p-6',
                'animate-fade-in cursor-pointer'
            )}
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className={cn(
                    'absolute top-4 right-4',
                    'h-8 w-8 rounded-full',
                    'bg-white/10 backdrop-blur-sm',
                    'flex items-center justify-center',
                    'text-white/80 hover:text-white hover:bg-white/20',
                    'transition-colors'
                )}
            >
                <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                    {plot}
                </p>
            </div>
        </div>
    );
}
