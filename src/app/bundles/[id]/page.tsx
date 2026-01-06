// Bundle Detail Page - View and rate content within a bundle
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SwipeableContentCard } from '@/components/SwipeableContentCard';
import { BundleActionButtons } from '@/components/BundleActionButtons';
import { ViewMatchesButton } from '@/components/ViewMatchesButton';
import { useAppStore } from '@/store/useAppStore';
import { getMovieDetails, getTVDetails } from '@/services/tmdb';
import { getImageUrl } from '@/services/api';
import { ContentDetailData, PartnerStatus } from '@/types/content';

// Bundle-specific rating for swipe actions
type BundleRating = 'yes' | 'not_now' | 'never';

// Extended content item for bundle view
interface BundleContentItem extends ContentDetailData {
    addedBy: 'user' | 'partner';
}

export default function BundleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const bundleId = params.id as string;

    // Global store
    const { bundles, activeProfile, user1Watchlist, user2Watchlist } = useAppStore();

    // Find bundle from store
    const bundle = bundles.find((b) => b.id === bundleId);

    // Local state
    const [contentItems, setContentItems] = useState<BundleContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ratings, setRatings] = useState<Record<number, BundleRating>>({});

    // Fetch content details
    useEffect(() => {
        const fetchContent = async () => {
            if (!bundle) {
                // If bundle isn't found immediately, it might be loading or truly missing.
                // Stop loading state so "Bundle not found" UI can show.
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Determine partner's watchlist based on active profile
                // If active is user1, partner is user2
                const partnerWatchlist = activeProfile === 'user1' ? user2Watchlist : user1Watchlist;

                const items = await Promise.all(bundle.contentIds.map(async (idStr) => {
                    const id = parseInt(idStr);
                    let details: any; // using any temporarily to handle diff between movie/tv types easily

                    try {
                        // Try fetching as movie first
                        const movie = await getMovieDetails(id);
                        if (movie) details = movie;
                    } catch {
                        // Fallback to TV
                        try {
                            const tv = await getTVDetails(id);
                            if (tv) details = tv;
                        } catch (e) {
                            console.error(`Failed to load content ${id}`, e);
                            return null;
                        }
                    }

                    if (!details) return null;

                    // Fix ups for ContentDetailData structure
                    // Map TMDB details to our internal type
                    const posterUrl = getImageUrl(details.posterPath, 'large');

                    // Check if partner liked this (is in their watchlist)
                    // In a real app we'd check specific status, here existence = liked for simplicity
                    const partnerHasItem = partnerWatchlist.some(i => i.id === id);
                    const partnerStatus: PartnerStatus = partnerHasItem ? 'liked' : null;

                    return {
                        ...details,
                        posterUrl,
                        // Defaults for required fields if missing
                        rating: undefined,
                        userRating: null, // current user hasn't rated in this context yet
                        addedBy: 'user', // Default to current user for now as we don't track creator per item yet
                        watchProviders: null,
                        partnerStatus
                    } as BundleContentItem;
                }));

                setContentItems(items.filter(Boolean) as BundleContentItem[]);
            } catch (error) {
                console.error("Error fetching bundle content:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, [bundle, bundleId, activeProfile, user1Watchlist, user2Watchlist]);

    // Derived state
    const currentContent = contentItems[currentIndex];
    const totalCount = contentItems.length;
    const isComplete = currentIndex >= totalCount && totalCount > 0;
    // Calculate matches based on items where both have said "yes" or partner liked + user liked
    // For now simple count of partner likes among visible items
    const matchCount = contentItems.filter(i => i.partnerStatus === 'liked').length;

    // Handle swipe/button action
    const handleAction = useCallback((rating: BundleRating) => {
        if (!currentContent) return;

        // Record rating
        setRatings((prev) => ({
            ...prev,
            [currentContent.id]: rating,
        }));

        // Move to next card
        setCurrentIndex((prev) => prev + 1);

        console.log(`Rated ${currentContent.title}: ${rating}`);
    }, [currentContent]);

    // Handle back navigation
    const handleBack = () => {
        router.push('/bundles');
    };

    // Handle share
    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/bundles/${bundleId}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: bundle?.title || 'Bundle',
                    text: `Check out this bundle: ${bundle?.title}`,
                    url: shareUrl,
                });
            } catch (err) { console.log('Share cancelled', err); }
        } else {
            try { await navigator.clipboard.writeText(shareUrl); } catch (err) { console.error(err); }
        }
    };

    const handleViewMatches = () => {
        router.push(`/bundles/${bundleId}/matches`);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
                <Loader2 className="w-8 h-8 text-accent-primary animate-spin mb-4" />
                <p className="text-text-secondary">Loading bundle...</p>
            </div>
        );
    }

    // Not found state
    if (!bundle) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <p className="text-text-primary text-lg font-medium mb-2">Bundle not found</p>
                <div className="text-sm text-text-secondary mb-4">
                    ID: {bundleId}
                </div>
                <button
                    onClick={handleBack}
                    className="text-accent-primary hover:underline"
                >
                    Back to Bundles
                </button>
            </div>
        );
    }

    // Empty state
    if (contentItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <p className="text-text-primary text-lg font-medium mb-2">No content in this bundle</p>
                <button onClick={handleBack} className="text-accent-primary hover:underline">
                    Back to Bundles
                </button>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col h-[calc(100vh-144px)] overflow-hidden -mx-4 -mt-4">
            {/* Bundle Header - Solid background to prevent overlap with main header */}
            <header className="flex items-center justify-between px-4 py-3 z-50 shrink-0 bg-bg-dark border-b border-border-default">
                <button
                    onClick={handleBack}
                    className={cn(
                        'text-text-secondary flex size-10 items-center justify-center',
                        'rounded-full hover:bg-bg-card transition-colors'
                    )}
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent-primary mb-0.5">
                        Bundle
                    </span>
                    <h2 className="text-text-primary text-base font-bold leading-tight tracking-tight">
                        {bundle.title}
                    </h2>
                </div>

                <button
                    onClick={handleShare}
                    className={cn(
                        'flex items-center justify-center size-10 rounded-full',
                        'text-accent-primary hover:bg-bg-card transition-colors',
                        'bg-accent-primary/10 border border-accent-primary/20'
                    )}
                >
                    <Share2 className="w-5 h-5" />
                </button>
            </header>

            {/* Progress Indicator */}
            <div className="flex justify-center py-2 shrink-0">
                <div className="bg-bg-dark/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full shadow-lg">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {isComplete ? 'Complete!' : `${currentIndex + 1} of ${totalCount}`}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 relative w-full max-w-md mx-auto px-4 pb-20 flex flex-col justify-center items-center overflow-hidden">
                {isComplete ? (
                    // Completion State
                    <div className="text-center px-8">
                        <div className="text-6xl mb-4">🎉</div>
                        <h3 className="text-2xl font-bold text-text-primary mb-2">
                            All Done!
                        </h3>
                        <p className="text-text-secondary mb-6">
                            You&apos;ve rated all {totalCount} items in this bundle.
                        </p>
                        <button
                            onClick={handleViewMatches}
                            className={cn(
                                'px-6 py-3 rounded-full',
                                'bg-accent-primary text-white font-bold',
                                'shadow-lg shadow-accent-primary/30',
                                'active:scale-95 transition-transform'
                            )}
                        >
                            View Your Matches
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Stacked Card Effect */}
                        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[82%] h-[58%] bg-gray-800/40 rounded-2xl -rotate-6 z-0 border border-white/5" />
                        <div className="absolute top-[47%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] h-[60%] bg-gray-800/60 rounded-2xl -rotate-3 z-10 border border-white/5 shadow-xl" />

                        {/* Current Card */}
                        {currentContent && (
                            <SwipeableContentCard
                                content={currentContent}
                                onSwipe={handleAction}
                                className="z-20"
                            />
                        )}

                        {/* Action Buttons */}
                        <BundleActionButtons
                            onAction={handleAction}
                            className="absolute bottom-24 left-0 right-0 z-30"
                        />

                        {/* View Matches Button */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-40">
                            <ViewMatchesButton
                                matchCount={matchCount}
                                onClick={handleViewMatches}
                            />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
