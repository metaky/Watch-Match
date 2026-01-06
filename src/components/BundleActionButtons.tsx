// Bundle action buttons component (Not Now, Never, Yes)
'use client';

import React from 'react';
import { X, ThumbsDown, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BundleRating } from '@/lib/mockBundleContent';

interface BundleActionButtonsProps {
    onAction: (rating: BundleRating) => void;
    disabled?: boolean;
    className?: string;
}

interface ActionButton {
    rating: BundleRating;
    label: string;
    icon: React.ElementType;
    color: string;
    bgHover: string;
    borderHover: string;
    size: 'large' | 'small';
    glow?: string;
}

const ACTION_BUTTONS: ActionButton[] = [
    {
        rating: 'not_now',
        label: 'Not Now',
        icon: X,
        color: 'text-red-500',
        bgHover: 'group-hover/btn:bg-red-500/10',
        borderHover: 'group-hover/btn:border-red-500/50',
        size: 'large',
    },
    {
        rating: 'never',
        label: 'Never',
        icon: ThumbsDown,
        color: 'text-gray-400',
        bgHover: 'group-hover/btn:bg-gray-500/10',
        borderHover: 'group-hover/btn:border-gray-500/50',
        size: 'small',
    },
    {
        rating: 'yes',
        label: 'Yes',
        icon: Heart,
        color: 'text-emerald-500',
        bgHover: 'group-hover/btn:bg-emerald-500/10',
        borderHover: 'group-hover/btn:border-emerald-500/50',
        size: 'large',
        glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    },
];

export function BundleActionButtons({
    onAction,
    disabled = false,
    className,
}: BundleActionButtonsProps) {
    return (
        <div className={cn('flex items-end justify-between px-8', className)}>
            {ACTION_BUTTONS.map((btn) => {
                const Icon = btn.icon;
                const isLarge = btn.size === 'large';

                return (
                    <button
                        key={btn.rating}
                        onClick={() => onAction(btn.rating)}
                        disabled={disabled}
                        className={cn(
                            'flex flex-col items-center gap-1 group/btn',
                            btn.rating === 'never' && 'mt-8'
                        )}
                    >
                        <div
                            className={cn(
                                'rounded-full backdrop-blur-xl',
                                'bg-bg-dark/80 border border-gray-700',
                                'flex items-center justify-center',
                                'shadow-lg transition-all active:scale-90',
                                btn.color,
                                btn.bgHover,
                                btn.borderHover,
                                btn.glow,
                                isLarge ? 'size-14' : 'size-12',
                                disabled && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            <Icon
                                className={cn(
                                    isLarge ? 'w-8 h-8' : 'w-6 h-6'
                                )}
                                fill={btn.rating === 'yes' ? 'currentColor' : 'none'}
                            />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            {btn.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
