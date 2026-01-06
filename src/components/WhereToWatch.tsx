// Where to Watch streaming providers component
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { StreamingProviderInfo, StreamingServiceId } from '@/types/content';

interface WhereToWatchProps {
    providers: {
        flatrate: StreamingProviderInfo[];
        rent: StreamingProviderInfo[];
        buy: StreamingProviderInfo[];
    } | null;
    className?: string;
}

// Provider styling by service ID
const PROVIDER_STYLES: Record<StreamingServiceId, { bg: string; text: string; label: string }> = {
    netflix: { bg: 'bg-[#E50914]', text: 'text-white', label: 'N' },
    max: { bg: 'bg-[#0000ff]', text: 'text-white', label: 'MAX' },
    hulu: { bg: 'bg-[#1ce783]', text: 'text-black', label: 'Hulu' },
    disney_plus: { bg: 'bg-[#113ccf]', text: 'text-white', label: 'D+' },
    apple_tv: { bg: 'bg-gray-900', text: 'text-white', label: '🍎' },
    paramount_plus: { bg: 'bg-[#0064ff]', text: 'text-white', label: 'P+' },
    amazon_prime: { bg: 'bg-[#00a8e1]', text: 'text-white', label: 'Prime' },
    peacock: { bg: 'bg-black', text: 'text-white', label: 'Pcok' },
    other: { bg: 'bg-gray-600', text: 'text-white', label: '...' },
};

interface ProviderWithType extends StreamingProviderInfo {
    availabilityType: 'Subscription' | 'Rent' | 'Buy';
}

function mapProviderName(name: string): StreamingServiceId {
    const lower = name.toLowerCase();
    if (lower.includes('netflix')) return 'netflix';
    if (lower.includes('max') || lower.includes('hbo')) return 'max';
    if (lower.includes('hulu')) return 'hulu';
    if (lower.includes('disney')) return 'disney_plus';
    if (lower.includes('apple')) return 'apple_tv';
    if (lower.includes('paramount')) return 'paramount_plus';
    if (lower.includes('prime') || lower.includes('amazon')) return 'amazon_prime';
    if (lower.includes('peacock')) return 'peacock';
    return 'other';
}

export function WhereToWatch({ providers, className }: WhereToWatchProps) {
    if (!providers) return null;

    // Combine all providers with their availability type
    const allProviders: ProviderWithType[] = [
        ...providers.flatrate.map(p => ({ ...p, availabilityType: 'Subscription' as const })),
        ...providers.rent.map(p => ({ ...p, availabilityType: 'Rent' as const })),
        ...providers.buy.map(p => ({ ...p, availabilityType: 'Buy' as const })),
    ];

    // Deduplicate by mapped service ID (prioritize subscription > rent > buy)
    // This handles cases where the same service appears under different names
    // e.g., "Amazon Prime Video", "Prime Video", "Amazon Video" all map to amazon_prime
    const seenServiceIds = new Set<StreamingServiceId>();
    const uniqueProviders = allProviders.filter(provider => {
        const serviceId = mapProviderName(provider.name);
        if (seenServiceIds.has(serviceId)) {
            return false;
        }
        seenServiceIds.add(serviceId);
        return true;
    });

    if (uniqueProviders.length === 0) return null;

    return (
        <div className={className}>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                Where to Watch
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                {uniqueProviders.slice(0, 6).map((provider, index) => {
                    const styleId = mapProviderName(provider.name);
                    const style = PROVIDER_STYLES[styleId];

                    return (
                        <div
                            key={`${provider.id}-${index}`}
                            className="flex flex-col items-center gap-2 min-w-[4.5rem]"
                        >
                            <div
                                className={cn(
                                    'w-16 h-16 rounded-2xl relative overflow-hidden shadow-lg',
                                    'border border-white/10',
                                    'flex items-center justify-center',
                                    'active:scale-95 transition-transform',
                                    style.bg,
                                    style.text
                                )}
                            >
                                <span className="font-bold text-lg tracking-tight">
                                    {style.label}
                                </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {provider.availabilityType}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
