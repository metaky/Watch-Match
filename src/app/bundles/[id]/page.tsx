// Bundle Detail Page - View and rate content within a bundle
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SwipeableContentCard } from '@/components/SwipeableContentCard';
import { BundleActionButtons } from '@/components/BundleActionButtons';
import { ViewMatchesButton } from '@/components/ViewMatchesButton';
import { useAppStore } from '@/store/useAppStore';
import { getMovieDetails, getTVDetails } from '@/services/tmdb';
import { getImageUrl } from '@/services/api';
import { ContentDetailData, PartnerStatus, getPartnerStatus } from '@/types/content';
import { getUserInteractions, setInteraction } from '@/lib/services/interactionService';
import { InteractionStatus } from '@/types/firestore';

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
    const { bundles, activeProfile } = useAppStore();

    // Find bundle from store
    const bundle = bundles.find((b) => b.id === bundleId);

    // Local state
    const [contentItems, setContentItems] = useState<BundleContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ratings, setRatings] = useState<Record<number, BundleRating>>({});


    // Fetch content details and partner interactions from Firestore
    useEffect(() => {
        const fetchContent = async () => {
            if (!bundle) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch partner's interactions from Firestore
                const partnerId = activeProfile === 'user1' ? 'user2' : 'user1';
                const partnerInteractions = await getUserInteractions(partnerId);

                // Build a map of partner's interactions by tmdbId
                const partnerInteractionMap: Record<string, PartnerStatus> = {};
                partnerInteractions.forEach(i => {
                    partnerInteractionMap[i.tmdbId] = getPartnerStatus(i.status);
                });

                // Use contentItems (with mediaType) if available, otherwise fall back to legacy contentIds
                const contentRefs = bundle.contentItems && bundle.contentItems.length > 0
                    ? bundle.contentItems
                    : bundle.contentIds.map(id => ({ tmdbId: id, mediaType: 'movie' as const })); // Legacy: assume movie

                const items = await Promise.all(contentRefs.map(async (ref) => {
                    const id = parseInt(ref.tmdbId);
                    if (isNaN(id)) {
                        console.error(`Invalid tmdbId: ${ref.tmdbId}`);
                        return null;
                    }
                    let details: any;

                    try {
                        // Try the specified mediaType first
                        if (ref.mediaType === 'movie') {
                            details = await getMovieDetails(id);
                        } else {
                            details = await getTVDetails(id);
                        }
                    } catch (e) {
                        // Fallback: try the other media type in case it was stored incorrectly
                        console.warn(`Failed to load ${ref.mediaType} ${id}, trying fallback...`);
                        try {
                            if (ref.mediaType === 'movie') {
                                details = await getTVDetails(id);
                            } else {
                                details = await getMovieDetails(id);
                            }
                        } catch (fallbackError) {
                            console.error(`Failed to load content ${id} with both endpoints:`, fallbackError);
                            return null;
                        }
                    }

                    if (!details) return null;

                    const posterUrl = getImageUrl(details.posterPath, 'large');
                    // Get partner's status from Firestore interactions
                    const partnerStatus: PartnerStatus = partnerInteractionMap[ref.tmdbId] || null;

                    return {
                        ...details,
                        posterUrl,
                        rating: undefined,
                        userRating: null,
                        addedBy: 'user',
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
    }, [bundle, bundleId, activeProfile]);

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

        // Record rating locally
        setRatings((prev) => ({
            ...prev,
            [currentContent.id]: rating,
        }));

        // Map bundle ratings to Firestore InteractionStatus
        const statusMap: Record<BundleRating, InteractionStatus> = {
            'yes': 'liked',           // Map 'yes' to 'liked' for consistency with matches detection
            'not_now': 'not_important',
            'never': 'wont_watch'
        };

        // Persist to Firestore
        setInteraction({
            userId: activeProfile,
            tmdbId: currentContent.id.toString(),
            contentType: currentContent.mediaType,
            status: statusMap[rating],
        }).catch(err => console.error('Failed to save bundle rating:', err));

        // Move to next card
        setCurrentIndex((prev) => prev + 1);

        console.log(`Rated ${currentContent.title}: ${rating}`);
    }, [currentContent, activeProfile]);

    // Handle back navigation
    const handleBack = () => {
        router.push('/bundles');
    };

    // Handle delete bundle
    const handleDelete = async () => {
        if (!bundle) return;

        if (window.confirm('Are you sure you want to delete this bundle? This action cannot be undone.')) {
            // Remove from store
            const { removeBundle } = useAppStore.getState();
            removeBundle(bundleId);

            // Redirect to bundles list
            router.push('/bundles');
        }
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

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDelete}
                        aria-label="Delete Bundle"
                        className={cn(
                            'flex items-center justify-center size-10 rounded-full',
                            'text-accent-danger hover:bg-bg-card transition-colors',
                            'bg-accent-danger/10 border border-accent-danger/20'
                        )}
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>

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
                </div>
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
            <main className="flex-1 relative w-full max-w-md mx-auto px-4 flex flex-col overflow-hidden">
                {isComplete ? (
                    // Completion State
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
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
                        {/* Card Container with stacked effect */}
                        <div className="relative flex-1 flex items-center justify-center min-h-0">
                            {/* Stacked Card Effect */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[82%] h-[90%] bg-gray-800/40 rounded-2xl -rotate-6 z-0 border border-white/5" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[88%] h-[92%] bg-gray-800/60 rounded-2xl -rotate-3 z-10 border border-white/5 shadow-xl" />

                            {/* Current Card */}
                            {currentContent && (
                                <SwipeableContentCard
                                    content={currentContent}
                                    onSwipe={handleAction}
                                    className="z-20"
                                />
                            )}
                        </div>

                        {/* Action Buttons - Fixed at bottom, in normal flow */}
                        <div className="shrink-0 py-3 z-30">
                            <BundleActionButtons
                                onAction={handleAction}
                            />
                        </div>

                        {/* View Matches Button */}
                        <div className="shrink-0 pb-4 flex justify-center z-40">
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
