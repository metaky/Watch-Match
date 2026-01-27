// Matches page - shows content where both users said "yes" in a bundle
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Filter, Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MatchCard } from '@/components/MatchCard';
import { ContentDetailModal } from '@/components/ContentDetailModal';
import { MatchesFilterOverlay } from '@/components/ui/MatchesFilterOverlay';
import { useAppStore } from '@/store/useAppStore';
import { getMovieDetails, getTVDetails } from '@/services/tmdb';
import { getImageUrl } from '@/services/api';
import { type ContentDetailData, type MatchesFilters, DEFAULT_MATCHES_FILTERS, hasActiveMatchesFilters, PartnerStatus } from '@/types/content';
import { getAllBundleInteractions } from '@/lib/services/bundleInteractionService';
import { updateBundleContentItemMediaType } from '@/lib/services/bundleService';


// Extended content item for match view
interface MatchContentItem extends ContentDetailData {
    addedBy: 'user' | 'partner';
    watched?: boolean;
}

export default function MatchesPage() {
    const params = useParams();
    const router = useRouter();
    const bundleId = params.id as string;

    // Get bundle info from global store
    const { bundles, activeProfile } = useAppStore();
    const bundle = bundles.find((b) => b.id === bundleId);

    // Content state
    const [allContentItems, setAllContentItems] = useState<MatchContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch content details and determine matches based on BOTH users' Firestore interactions
    useEffect(() => {
        const fetchContent = async () => {
            if (!bundle) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch ALL users' bundle-scoped interactions from Firestore
                const bundleInteractions = await getAllBundleInteractions(bundleId);

                // Build sets of content IDs where each user has said "yes" IN THIS BUNDLE
                const user1LikedSet = new Set<string>();
                const user2LikedSet = new Set<string>();

                // Group by userId and check for 'yes' status
                bundleInteractions.forEach(i => {
                    if (i.status === 'yes') {
                        // We need to determine which user this is
                        // For simplicity, we'll collect all UIDs that said 'yes' per tmdbId
                        // and then check if we have at least 2 different users
                        user1LikedSet.add(`${i.userId}_${i.tmdbId}`);
                    }
                });

                // Build a map of tmdbId -> set of userIds who said 'yes'
                const yesVotesByContent: Record<string, Set<string>> = {};
                bundleInteractions.forEach(i => {
                    if (i.status === 'yes') {
                        if (!yesVotesByContent[i.tmdbId]) {
                            yesVotesByContent[i.tmdbId] = new Set();
                        }
                        yesVotesByContent[i.tmdbId].add(i.userId);
                    }
                });

                // Reconcile contentItems and contentIds to ensure all items are included
                // Build a map from contentItems for media type info
                const contentItemsMap = new Map(
                    (bundle.contentItems || []).map(item => [item.tmdbId, item])
                );

                // Create refs for ALL items in contentIds, using contentItems data when available
                const contentRefs = bundle.contentIds.map(id =>
                    contentItemsMap.get(id) || { tmdbId: id, mediaType: 'movie' as const }
                );

                const items = await Promise.all(contentRefs.map(async (ref) => {
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
                        // Fallback: try the other media type in case it was stored incorrectly
                        console.warn(`Failed to load ${ref.mediaType} ${id}, trying fallback...`);
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
                            console.error(`Failed to load content ${id} with both endpoints:`, fallbackError);
                            return null;
                        }
                    }

                    if (!details) return null;

                    const posterUrl = getImageUrl(details.posterPath, 'large');

                    // Check if partner has liked this content IN THIS BUNDLE
                    const yesVoters = yesVotesByContent[ref.tmdbId] || new Set();
                    const hasMultipleYesVotes = yesVoters.size >= 2;
                    const partnerStatus: PartnerStatus = hasMultipleYesVotes ? 'liked' : null;

                    // A match = at least 2 different users said 'yes' in this bundle
                    const isMatch = hasMultipleYesVotes;

                    return {
                        ...details,
                        posterUrl,
                        rating: undefined,
                        userRating: null,
                        addedBy: 'user' as const,
                        watchProviders: null,
                        partnerStatus,
                        isMatch  // Track if this is truly a match (both users liked)
                    } as MatchContentItem & { isMatch: boolean };
                }));

                // Only keep items that are ACTUAL matches (both users liked)
                const matchedItems = items.filter((item): item is (MatchContentItem & { isMatch: boolean }) =>
                    item !== null && item.isMatch
                );

                setAllContentItems(matchedItems);
            } catch (error) {
                console.error("Error fetching bundle content:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, [bundle, bundleId, activeProfile]);

    // All items in allContentItems are already matches (both users liked)
    const matches = allContentItems;

    // Filter state
    const [filters, setFilters] = useState<MatchesFilters>(DEFAULT_MATCHES_FILTERS);
    const [showFilters, setShowFilters] = useState(false);

    // Get filtered items
    const filteredMatches = useMemo(() => {
        return matches.filter((match) => {
            // Filter by streaming service
            if (filters.streamingServices.length > 0) {
                if (!match.streamingProvider || !filters.streamingServices.includes(match.streamingProvider.id)) {
                    return false;
                }
            }

            // Filter by genre
            if (filters.genres.length > 0) {
                if (!match.genre || !filters.genres.includes(match.genre)) {
                    return false;
                }
            }

            // Filter by watched
            if (filters.unwatchedOnly) {
                if (match.watched) {
                    return false;
                }
            }

            return true;
        });
    }, [matches, filters]);

    // Selected content for detail modal
    const [selectedContent, setSelectedContent] = useState<ContentDetailData | null>(null);

    // Handle back navigation
    const handleBack = useCallback(() => {
        router.push(`/bundles/${bundleId}`);
    }, [router, bundleId]);

    // Handle card click - open detail modal
    const handleCardClick = useCallback((content: MatchContentItem) => {
        setSelectedContent(content);
    }, []);

    // Handle modal close
    const handleCloseModal = useCallback(() => {
        setSelectedContent(null);
    }, []);

    // Handle filter button click
    const handleFilterClick = useCallback(() => {
        setShowFilters(true);
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
                <Loader2 className="w-8 h-8 text-accent-primary animate-spin mb-4" />
                <p className="text-text-secondary">Loading matches...</p>
            </div>
        );
    }

    // If bundle not found
    if (!bundle) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <p className="text-text-primary text-lg font-medium mb-2">Bundle not found</p>
                <button
                    onClick={() => router.push('/bundles')}
                    className="text-accent-primary hover:underline"
                >
                    Back to Bundles
                </button>
            </div>
        );
    }

    const isActive = hasActiveMatchesFilters(filters);

    return (
        <>
            <div className="flex flex-col min-h-screen bg-bg-dark -mx-4 -mt-4">
                {/* Header */}
                <header className="flex items-center justify-between px-4 py-3 bg-bg-dark border-b border-border-default sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBack}
                            className={cn(
                                'flex items-center justify-center rounded-full h-8 w-8',
                                'text-text-secondary hover:bg-bg-card transition-colors'
                            )}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-text-primary text-2xl font-bold leading-tight tracking-tight">
                            Matches
                        </h1>
                    </div>

                    <button
                        onClick={handleFilterClick}
                        className={cn(
                            'relative flex items-center justify-center rounded-full h-10 w-10',
                            'bg-bg-card text-white border border-border-default',
                            'hover:bg-accent-primary/20 transition-colors',
                            isActive && 'border-accent-primary/50'
                        )}
                    >
                        <Filter className="w-5 h-5" />
                        {isActive && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent-primary rounded-full border-2 border-bg-dark" />
                        )}
                    </button>
                </header>

                {/* Bundle Name Subtitle */}
                <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2 text-text-secondary text-sm">
                        <span className="opacity-60">From bundle:</span>
                        <span className="font-semibold text-text-primary">{bundle.title}</span>
                    </div>
                </div>

                {/* Matches Grid */}
                <main className="flex-1 overflow-y-auto px-4 pb-24">
                    {filteredMatches.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                                {filteredMatches.map((match) => (
                                    <MatchCard
                                        key={match.id}
                                        content={match}
                                        onClick={handleCardClick}
                                    />
                                ))}
                            </div>

                            {/* End of Matches Indicator */}
                            <div className="mt-8 flex flex-col items-center justify-center text-text-secondary opacity-60 pb-8">
                                <Heart className="w-10 h-10 mb-2" />
                                <p className="text-sm">End of matches</p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Heart className="w-16 h-16 text-text-tertiary mb-4" />
                            <h3 className="text-lg font-semibold text-text-primary mb-2">
                                {isActive ? 'No matches found' : 'No Matches Yet'}
                            </h3>
                            <p className="text-text-secondary text-sm max-w-[250px]">
                                {isActive
                                    ? 'Try adjusting your filters to see more results.'
                                    : 'Keep swiping through the bundle to find titles you both love!'}
                            </p>
                            {isActive && (
                                <button
                                    onClick={() => setFilters(DEFAULT_MATCHES_FILTERS)}
                                    className="mt-4 text-accent-primary font-medium hover:underline"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Content Detail Modal */}
            {selectedContent && (
                <ContentDetailModal
                    content={selectedContent}
                    isOpen={true}
                    onClose={handleCloseModal}
                />
            )}

            {/* Filter Overlay */}
            <MatchesFilterOverlay
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                filters={filters}
                onFiltersChange={setFilters}
                resultCount={filteredMatches.length}
            />
        </>
    );
}
