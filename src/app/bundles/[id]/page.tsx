// Bundle Detail Page - View and rate content within a bundle
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SwipeableContentCard } from '@/components/SwipeableContentCard';
import { BundleActionButtons } from '@/components/BundleActionButtons';
import { ViewMatchesButton } from '@/components/ViewMatchesButton';
import { useAppStore } from '@/store/useAppStore';
import { getMovieDetails, getTVDetails } from '@/services/tmdb';
import { getImageUrl } from '@/services/api';
import { ContentDetailData, PartnerStatus } from '@/types/content';
import { setInteraction } from '@/lib/services/interactionService';
import { getBundleInteractions, setBundleInteraction } from '@/lib/services/bundleInteractionService';
import { getUidByProfile } from '@/lib/services/userService';
import { auth } from '@/lib/firebase';
import { updateBundleContentItemMediaType } from '@/lib/services/bundleService';
import { BundleRatingStatus } from '@/types/firestore';


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
    const [allContentItems, setAllContentItems] = useState<BundleContentItem[]>([]); // All items in bundle
    const [contentItems, setContentItems] = useState<BundleContentItem[]>([]); // Filtered items to show
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ratings, setRatings] = useState<Record<number, BundleRating>>({});
    const [isReRating, setIsReRating] = useState(false); // Re-rate mode shows all items


    // Fetch content details and filter out already-rated items
    useEffect(() => {
        const fetchContent = async () => {
            if (!bundle) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch BOTH users' BUNDLE-SCOPED interactions from Firestore
                const partnerProfile = activeProfile === 'user1' ? 'user2' : 'user1';

                const [partnerUid, user] = await Promise.all([
                    getUidByProfile(partnerProfile),
                    Promise.resolve(auth.currentUser)
                ]);

                if (!user) {
                    setIsLoading(false);
                    return;
                }

                // Get bundle-scoped interactions (not global)
                const [partnerBundleInteractions, currentUserBundleInteractions] = await Promise.all([
                    partnerUid ? getBundleInteractions(bundleId, partnerUid) : Promise.resolve([]),
                    getBundleInteractions(bundleId, user.uid)
                ]);

                // Build maps of bundle interactions by tmdbId
                // Partner status: 'yes' in this bundle = 'liked' for UI display
                const partnerInteractionMap: Record<string, PartnerStatus> = {};
                partnerBundleInteractions.forEach(i => {
                    partnerInteractionMap[i.tmdbId] = i.status === 'yes' ? 'liked' : null;
                });

                // Track which items the current user has already rated IN THIS BUNDLE
                const currentUserRatedSet = new Set<string>();
                currentUserBundleInteractions.forEach(i => {
                    // Any status means they've rated it in this bundle
                    if (i.status) {
                        currentUserRatedSet.add(i.tmdbId);
                    }
                });

                // Helper to fetch details for a list of refs
                const fetchItemsForRefs = async (refs: { tmdbId: string, mediaType: 'movie' | 'tv' }[]) => {
                    const results = await Promise.all(refs.map(async (ref) => {
                        const id = parseInt(ref.tmdbId);
                        if (isNaN(id)) {
                            console.error(`Invalid tmdbId: ${ref.tmdbId}`);
                            return null;
                        }
                        let details: any;

                        try {
                            if (ref.mediaType === 'movie') {
                                details = await getMovieDetails(id);
                            } else {
                                details = await getTVDetails(id);
                            }
                        } catch (e) {
                            // Try the other type if the first failed
                            try {
                                if (ref.mediaType === 'movie') {
                                    details = await getTVDetails(id);
                                    // Self-healing: Update bundle with correct media type
                                    updateBundleContentItemMediaType(bundleId, ref.tmdbId, 'tv')
                                        .catch(e => console.warn('Failed to auto-correct bundle item:', e));
                                } else {
                                    details = await getMovieDetails(id);
                                    // Self-healing: Update bundle with correct media type
                                    updateBundleContentItemMediaType(bundleId, ref.tmdbId, 'movie')
                                        .catch(e => console.warn('Failed to auto-correct bundle item:', e));
                                }
                            } catch (fallbackError) {
                                console.warn(`Failed to load content ${id} (tried both movie/tv)`);
                                return null;
                            }
                        }

                        if (!details) return null;

                        const posterUrl = getImageUrl(details.posterPath, 'large');
                        const partnerStatus: PartnerStatus = partnerInteractionMap[ref.tmdbId] || null;
                        const alreadyRated = currentUserRatedSet.has(ref.tmdbId);

                        return {
                            ...details,
                            posterUrl,
                            rating: undefined,
                            userRating: null,
                            addedBy: 'user',
                            watchProviders: null,
                            partnerStatus,
                            alreadyRated
                        } as BundleContentItem & { alreadyRated: boolean };
                    }));
                    return results.filter(Boolean) as (BundleContentItem & { alreadyRated: boolean })[];
                };

                // Reconcile contentItems and contentIds to ensure all items are included
                // Build a map from contentItems for media type info
                const contentItemsMap = new Map(
                    (bundle.contentItems || []).map(item => [item.tmdbId, item])
                );

                // Create refs for ALL items in contentIds, using contentItems data when available
                const allContentRefs = bundle.contentIds.map(id =>
                    contentItemsMap.get(id) || { tmdbId: id, mediaType: 'movie' as const }
                );

                const validItems = await fetchItemsForRefs(allContentRefs);

                // Store all items for potential re-rating
                setAllContentItems(validItems);

                // Filter out already-rated items (unless in re-rate mode)
                if (isReRating) {
                    setContentItems(validItems);
                } else {
                    const unratedItems = validItems.filter(item => !item.alreadyRated);
                    setContentItems(unratedItems);
                }

                // Reset index when content changes
                setCurrentIndex(0);
            } catch (error) {
                console.error("Error fetching bundle content:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, [bundle, bundleId, activeProfile, isReRating]);

    // Derived state
    const currentContent = contentItems[currentIndex];
    const totalCount = contentItems.length;
    // isComplete: either we've rated through all remaining items, OR all items were already rated
    const isComplete = (currentIndex >= totalCount && totalCount > 0) ||
        (totalCount === 0 && allContentItems.length > 0);
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

        // Persist to bundle-scoped Firestore collection
        const user = auth.currentUser;
        if (user) {
            // Save to bundle_interactions (bundle-scoped)
            setBundleInteraction({
                bundleId,
                userId: user.uid,
                tmdbId: currentContent.id.toString(),
                contentType: currentContent.mediaType,
                status: rating as BundleRatingStatus,
            }).catch(err => console.error('Failed to save bundle rating:', err));

            // EXCEPTION: If rating is 'never', also add to global watchlist as 'wont_watch'
            if (rating === 'never') {
                setInteraction({
                    userId: user.uid,
                    tmdbId: currentContent.id.toString(),
                    contentType: currentContent.mediaType,
                    status: 'wont_watch',
                }).catch(err => console.error('Failed to propagate never rating to watchlist:', err));
            }
        }

        // Move to next card
        setCurrentIndex((prev) => prev + 1);

        console.log(`Rated ${currentContent.title}: ${rating}`);
    }, [currentContent, bundleId]);

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

    // Handle re-rating the bundle
    const handleReRate = () => {
        setIsReRating(true);
        setCurrentIndex(0);
        setRatings({});
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

    // Empty state - only if bundle truly has no content
    if (allContentItems.length === 0) {
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
                            {isReRating
                                ? `You've re-rated all ${allContentItems.length} items in this bundle.`
                                : totalCount > 0
                                    ? `You've rated ${totalCount} new items in this bundle.`
                                    : `You've already rated all ${allContentItems.length} items in this bundle.`
                            }
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

                        {/* Re-rate option */}
                        <button
                            onClick={handleReRate}
                            className="mt-6 flex items-center gap-2 text-text-tertiary hover:text-text-secondary transition-colors text-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Re-rate this bundle</span>
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
