// Match badge component - shows green "MATCH" indicator on matched items
'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchBadgeProps {
    className?: string;
}

export function MatchBadge({ className }: MatchBadgeProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center gap-1',
                'bg-black/60 backdrop-blur-md',
                'border border-accent-success/30',
                'rounded-full px-2 py-1',
                'shadow-lg',
                className
            )}
        >
            <Heart
                className="w-4 h-4 text-accent-success"
                fill="currentColor"
            />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                Match
            </span>
        </div>
    );
}
