// Partner Rating Cards - Single-select partner preference filter
'use client';

import React from 'react';
import { Heart, Meh, Ban, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PartnerStatus } from '@/types/content';

interface PartnerRatingCardsProps {
    value: PartnerStatus | 'any';
    onChange: (value: PartnerStatus | 'any') => void;
}

interface RatingOption {
    id: PartnerStatus | 'any';
    label: string[];
    icon: React.ElementType;
    activeIconColor: string;
}

const RATING_OPTIONS: RatingOption[] = [
    {
        id: 'liked',
        label: ['Partner', 'Loves It'],
        icon: Heart,
        activeIconColor: 'text-accent-primary',
    },
    {
        id: 'not_important',
        label: ['Not', 'Important'],
        icon: Meh,
        activeIconColor: 'text-text-tertiary',
    },
    {
        id: 'wont_watch',
        label: ["Won't", 'Watch'],
        icon: Ban,
        activeIconColor: 'text-text-tertiary',
    },
];

export function PartnerRatingCards({ value, onChange }: PartnerRatingCardsProps) {
    return (
        <div className="grid grid-cols-3 gap-3">
            {RATING_OPTIONS.map((option) => {
                const isSelected = value === option.id;
                const Icon = option.icon;

                return (
                    <button
                        key={option.id}
                        onClick={() => onChange(isSelected ? 'any' : option.id)}
                        className={cn(
                            'group relative flex flex-col items-center justify-center h-20',
                            'rounded-xl transition-all active:scale-95',
                            isSelected
                                ? 'bg-bg-card border-2 border-accent-primary shadow-[0_0_15px_-3px_rgba(43,91,238,0.3)]'
                                : 'bg-bg-card border border-border-default hover:bg-bg-elevated'
                        )}
                    >
                        <Icon
                            className={cn(
                                'w-6 h-6 mb-1',
                                isSelected ? option.activeIconColor : 'text-text-tertiary'
                            )}
                            fill={isSelected && option.id === 'liked' ? 'currentColor' : 'none'}
                        />
                        <span
                            className={cn(
                                'font-bold tracking-tight text-[11px] text-center leading-tight',
                                isSelected ? 'text-text-primary' : 'text-text-secondary'
                            )}
                        >
                            {option.label[0]}
                            <br />
                            {option.label[1]}
                        </span>

                        {/* Checkmark indicator */}
                        {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-primary rounded-full flex items-center justify-center border-2 border-bg-dark">
                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
