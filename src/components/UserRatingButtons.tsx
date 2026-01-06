// User rating buttons component (Love It, Not Important, Won't Watch)
'use client';

import React from 'react';
import { Heart, ArrowDownToLine, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PartnerStatus } from '@/types/content';

interface UserRatingButtonsProps {
    selectedRating: PartnerStatus;
    onRatingChange: (rating: PartnerStatus) => void;
    className?: string;
}

interface RatingOption {
    value: Exclude<PartnerStatus, null>;
    label: string;
    icon: React.ElementType;
    activeColor: string;
    activeBg: string;
}

const RATING_OPTIONS: RatingOption[] = [
    {
        value: 'liked',
        label: 'Love It',
        icon: Heart,
        activeColor: 'text-pink-500',
        activeBg: 'bg-pink-500/20 border-pink-500/30',
    },
    {
        value: 'not_important',
        label: 'Not Important',
        icon: ArrowDownToLine,
        activeColor: 'text-blue-400',
        activeBg: 'bg-blue-400/20 border-blue-400/30',
    },
    {
        value: 'wont_watch',
        label: "Won't Watch",
        icon: EyeOff,
        activeColor: 'text-red-500',
        activeBg: 'bg-red-500/20 border-red-500/30',
    },
];

export function UserRatingButtons({
    selectedRating,
    onRatingChange,
    className,
}: UserRatingButtonsProps) {
    const handleClick = (value: Exclude<PartnerStatus, null>) => {
        // Toggle off if already selected
        if (selectedRating === value) {
            onRatingChange(null);
        } else {
            onRatingChange(value);
        }
    };

    return (
        <div className={cn('grid grid-cols-3 gap-3', className)}>
            {RATING_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = selectedRating === option.value;

                return (
                    <button
                        key={option.value}
                        onClick={() => handleClick(option.value)}
                        className={cn(
                            'h-16 rounded-xl flex flex-col items-center justify-center gap-1',
                            'transition-all duration-200 active:scale-95',
                            'border',
                            isActive
                                ? option.activeBg
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                        )}
                    >
                        <Icon
                            className={cn(
                                'w-5 h-5 transition-colors',
                                isActive ? option.activeColor : 'text-gray-400'
                            )}
                            fill={isActive && option.value === 'liked' ? 'currentColor' : 'none'}
                        />
                        <span
                            className={cn(
                                'text-[10px] font-bold uppercase tracking-wider transition-colors',
                                isActive ? 'text-gray-200' : 'text-gray-500'
                            )}
                        >
                            {option.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
