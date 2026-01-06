// Streaming service badge component
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { StreamingServiceId } from '@/types/content';

interface StreamingBadgeProps {
    serviceId: StreamingServiceId;
    serviceName?: string;
    className?: string;
}

// Service display configurations
const SERVICE_CONFIG: Record<StreamingServiceId, {
    label: string;
    bgColor: string;
    textColor: string;
    shortLabel?: string;
}> = {
    netflix: {
        label: 'Netflix',
        bgColor: 'bg-red-600/90',
        textColor: 'text-white',
        shortLabel: 'N',
    },
    max: {
        label: 'Max',
        bgColor: 'bg-black',
        textColor: 'text-white',
        shortLabel: 'MAX',
    },
    hulu: {
        label: 'Hulu',
        bgColor: 'bg-[#1ce783]/90',
        textColor: 'text-black',
        shortLabel: 'Hulu',
    },
    disney_plus: {
        label: 'Disney+',
        bgColor: 'bg-[#113ccf]/90',
        textColor: 'text-white',
        shortLabel: 'D+',
    },
    apple_tv: {
        label: 'Apple TV+',
        bgColor: 'bg-black',
        textColor: 'text-white',
        shortLabel: 'TV+',
    },
    paramount_plus: {
        label: 'Paramount+',
        bgColor: 'bg-blue-600/90',
        textColor: 'text-white',
        shortLabel: 'P+',
    },
    amazon_prime: {
        label: 'Prime Video',
        bgColor: 'bg-[#00a8e1]/90',
        textColor: 'text-white',
        shortLabel: 'Prime',
    },
    peacock: {
        label: 'Peacock',
        bgColor: 'bg-black',
        textColor: 'text-white',
        shortLabel: 'Pcok',
    },
    other: {
        label: 'Streaming',
        bgColor: 'bg-gray-600/90',
        textColor: 'text-white',
        shortLabel: '...',
    },
};

export function StreamingBadge({ serviceId, className }: StreamingBadgeProps) {
    const config = SERVICE_CONFIG[serviceId] || SERVICE_CONFIG.other;

    return (
        <div
            className={cn(
                'h-6 w-auto min-w-6 px-1.5 rounded-full backdrop-blur-md',
                'flex items-center justify-center',
                'border border-white/10 shadow-lg',
                config.bgColor,
                config.textColor,
                className
            )}
            title={`Streaming on ${config.label}`}
        >
            <span className="text-[9px] font-bold tracking-tight">
                {config.shortLabel}
            </span>
        </div>
    );
}

/**
 * Maps TMDB provider names to our service IDs
 */
export function mapProviderToServiceId(providerName: string): StreamingServiceId {
    const name = providerName.toLowerCase();

    if (name.includes('netflix')) return 'netflix';
    if (name.includes('max') || name.includes('hbo')) return 'max';
    if (name.includes('hulu')) return 'hulu';
    if (name.includes('disney')) return 'disney_plus';
    if (name.includes('apple')) return 'apple_tv';
    if (name.includes('paramount')) return 'paramount_plus';
    if (name.includes('prime') || name.includes('amazon')) return 'amazon_prime';
    if (name.includes('peacock')) return 'peacock';

    return 'other';
}
