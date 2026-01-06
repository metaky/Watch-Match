// Streaming Service Grid - Multi-select grid of streaming services
'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StreamingServiceId } from '@/types/content';

interface StreamingServiceGridProps {
    selected: StreamingServiceId[];
    available: StreamingServiceId[];
    onChange: (services: StreamingServiceId[]) => void;
}

// Display names for streaming services
const SERVICE_DISPLAY_NAMES: Record<StreamingServiceId, string> = {
    netflix: 'Netflix',
    max: 'Max',
    hulu: 'Hulu',
    amazon_prime: 'Prime',
    disney_plus: 'Disney+',
    apple_tv: 'Apple',
    peacock: 'Peacock',
    paramount_plus: 'Paramount+',
    other: 'Other',
};

export function StreamingServiceGrid({
    selected,
    available,
    onChange,
}: StreamingServiceGridProps) {
    const toggleService = (serviceId: StreamingServiceId) => {
        if (selected.includes(serviceId)) {
            onChange(selected.filter((id) => id !== serviceId));
        } else {
            onChange([...selected, serviceId]);
        }
    };

    // Filter to only show available services (user's saved services)
    const servicesToShow = available.length > 0 ? available : Object.keys(SERVICE_DISPLAY_NAMES) as StreamingServiceId[];

    return (
        <div className="grid grid-cols-3 gap-3">
            {servicesToShow.map((serviceId) => {
                const isSelected = selected.includes(serviceId);
                return (
                    <button
                        key={serviceId}
                        onClick={() => toggleService(serviceId)}
                        className={cn(
                            'group relative flex flex-col items-center justify-center h-16',
                            'rounded-xl transition-all active:scale-95',
                            isSelected
                                ? 'bg-bg-card border-2 border-accent-primary shadow-[0_0_15px_-3px_rgba(43,91,238,0.3)]'
                                : 'bg-bg-card border border-border-default hover:bg-bg-elevated'
                        )}
                    >
                        <span
                            className={cn(
                                'font-bold tracking-tight text-sm',
                                isSelected ? 'text-text-primary' : 'text-text-secondary'
                            )}
                        >
                            {SERVICE_DISPLAY_NAMES[serviceId]}
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
