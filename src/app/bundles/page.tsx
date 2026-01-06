'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Film, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BundleCard } from '@/components/BundleCard';
import { useAppStore } from '@/store/useAppStore';
import { BundleDisplayData } from '@/lib/mockBundles';
import { getMovieDetails, getTVDetails } from '@/services/tmdb';
import { getImageUrl } from '@/services/api';

export default function BundlesPage() {
    const router = useRouter();
    const { bundles } = useAppStore();
    const [displayBundles, setDisplayBundles] = useState<BundleDisplayData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch poster images for bundles
    useEffect(() => {
        const fetchBundlePosters = async () => {
            setIsLoading(true);
            try {
                const enrichedBundles = await Promise.all(bundles.map(async (bundle) => {
                    // Get up to 3 items to show posters
                    const itemIds = bundle.contentIds.slice(0, 3);
                    const posterPaths: string[] = [];

                    for (const idStr of itemIds) {
                        try {
                            const id = parseInt(idStr);
                            if (isNaN(id)) {
                                console.warn('Skipping invalid ID for poster:', idStr);
                                continue;
                            }
                            // Optimistically try movie first
                            try {
                                const details = await getMovieDetails(id);
                                if (details.posterPath) {
                                    const url = getImageUrl(details.posterPath, 'medium');
                                    if (url) posterPaths.push(url);
                                }
                            } catch {
                                // Try TV if movie fails
                                try {
                                    const details = await getTVDetails(id);
                                    if (details.posterPath) {
                                        const url = getImageUrl(details.posterPath, 'medium');
                                        if (url) posterPaths.push(url);
                                    }
                                } catch (e) {
                                    console.error('Failed to fetch TV details for', id, e);
                                }
                            }
                        } catch (e) {
                            console.error('Failed to fetch poster for', idStr, e);
                        }
                    }

                    return {
                        ...bundle,
                        posterPaths,
                    } as BundleDisplayData;
                }));
                setDisplayBundles(enrichedBundles);
            } catch (error) {
                console.error("Error enriching bundles", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (bundles.length > 0) {
            fetchBundlePosters();
        } else {
            setDisplayBundles([]);
            setIsLoading(false);
        }
    }, [bundles]);

    const handleBundleClick = (bundle: BundleDisplayData) => {
        router.push(`/bundles/${bundle.id}`);
    };

    const handleMenuClick = (bundle: BundleDisplayData) => {
        console.log('Open bundle menu:', bundle.id);
        // TODO: Show context menu
    };

    const handleSearch = () => {
        router.push('/search');
    };

    const handleAddBundle = () => {
        router.push('/search');
    };

    return (
        <div className="space-y-4">
            {/* Page Header */}
            <div className="flex items-center justify-between py-2">
                <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                    Bundles
                </h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSearch}
                        className={cn(
                            'h-10 w-10 rounded-full',
                            'flex items-center justify-center',
                            'bg-bg-card text-text-primary',
                            'hover:bg-accent-primary/20 transition-colors'
                        )}
                        aria-label="Search bundles"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleAddBundle}
                        className={cn(
                            'h-10 w-10 rounded-full',
                            'flex items-center justify-center',
                            'bg-accent-primary text-white',
                            'shadow-[0_0_15px_rgba(43,91,238,0.4)]',
                            'transition-transform active:scale-95'
                        )}
                        aria-label="Create new bundle"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <LoadingState />
            ) : displayBundles.length === 0 ? (
                <EmptyState />
            ) : (
                <>
                    {/* Bundle Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {displayBundles.map((bundle) => (
                            <BundleCard
                                key={bundle.id}
                                bundle={bundle}
                                onClick={handleBundleClick}
                                onMenuClick={handleMenuClick}
                            />
                        ))}
                    </div>

                    {/* End of Bundles Footer */}
                    <div className="flex flex-col items-center justify-center pt-8 pb-4 text-text-tertiary opacity-60">
                        <Film className="w-10 h-10 mb-2" />
                        <p className="text-sm">End of your bundles</p>
                    </div>
                </>
            )}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin mb-3" />
            <p className="text-text-secondary text-sm">Loading your bundles...</p>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-bg-card flex items-center justify-center mb-4">
                <Film className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-text-primary font-medium mb-1">No bundles yet</p>
            <p className="text-text-secondary text-sm text-center">
                Create your first bundle to organize movies and shows!
            </p>
        </div>
    );
}
