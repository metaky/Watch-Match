// Partner status badge component
'use client';

import React from 'react';
import { Heart, Minus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PartnerStatus } from '@/types/content';

interface PartnerStatusBadgeProps {
    status: PartnerStatus;
    className?: string;
}

const STATUS_CONFIG: Record<Exclude<PartnerStatus, null>, {
    icon: React.ElementType;
    bgColor: string;
    title: string;
}> = {
    liked: {
        icon: Heart,
        bgColor: 'bg-green-500/90',
        title: 'Partner: Love It',
    },
    not_important: {
        icon: Minus,
        bgColor: 'bg-gray-500/90',
        title: 'Partner: Not Important',
    },
    wont_watch: {
        icon: X,
        bgColor: 'bg-red-500/90',
        title: "Partner: Won't Watch",
    },
};

export function PartnerStatusBadge({ status, className }: PartnerStatusBadgeProps) {
    // Don't render if no status
    if (!status) return null;

    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    return (
        <div
            className={cn(
                'h-6 w-6 rounded-full backdrop-blur-md',
                'flex items-center justify-center',
                'border border-white/10 shadow-lg',
                'animate-fade-in',
                config.bgColor,
                className
            )}
            title={config.title}
        >
            <Icon className="w-3.5 h-3.5 text-white" fill="currentColor" />
        </div>
    );
}
