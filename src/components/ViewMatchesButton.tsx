// View Matches button for bundle detail page
'use client';

import React from 'react';
import { LayoutGrid, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewMatchesButtonProps {
    matchCount: number;
    onClick: () => void;
    className?: string;
}

export function ViewMatchesButton({
    matchCount,
    onClick,
    className,
}: ViewMatchesButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-3',
                'bg-bg-dark/90 backdrop-blur-xl',
                'border border-white/10 rounded-full',
                'pl-2 pr-6 py-2',
                'shadow-2xl shadow-black/40',
                'ring-1 ring-white/5',
                'group hover:bg-bg-card transition-all active:scale-95',
                className
            )}
        >
            {/* Icon Container */}
            <div
                className={cn(
                    'h-10 w-10 rounded-full',
                    'bg-gradient-to-br from-gray-700 to-gray-800',
                    'border border-white/5',
                    'flex items-center justify-center',
                    'shadow-inner',
                    'group-hover:from-gray-600 group-hover:to-gray-700 transition-all'
                )}
            >
                <LayoutGrid className="w-5 h-5 text-white/90" />
            </div>

            {/* Text Content */}
            <div className="flex flex-col gap-0.5 items-start">
                <span className="text-xs font-bold text-white tracking-wide">
                    View Matches
                </span>
                <span className="text-[9px] font-medium text-accent-primary uppercase tracking-wider">
                    {matchCount} found
                </span>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Arrow */}
            <ArrowRight
                className={cn(
                    'w-5 h-5 text-accent-primary',
                    'group-hover:translate-x-0.5 transition-transform'
                )}
            />
        </button>
    );
}
