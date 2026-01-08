// Hook for fetching content with full details (OPTIMIZED - uses cached TMDB service)
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type MediaItem } from '@/services/tmdb';
import { getContentDetailsEnriched } from '@/services/tmdbCached';
import { getRatingsByImdbId } from '@/services/omdb';
import { getImageUrl } from '@/services/api';
import { mapProviderToServiceId } from '@/components/StreamingBadge';
import type { ContentCardData, ContentFilter, PartnerStatus } from '@/types/content';
import { formatRuntime, extractYear, getPartnerStatus } from '@/types/content';
import { useAppStore } from '@/store/useAppStore';
import { getUserInteractions } from '@/lib/services/interactionService';
import { getUidByProfile } from '@/lib/services/userService';
import { AdvancedFilters } from '@/types/content';
import { cachedFetch, CacheKeys } from '@/lib/cache';


// Genre ID to name mapping (TMDB)
const GENRE_MAP: Record<number, string> = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    27: 'Horror',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Sci-Fi',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
    // TV Genres
    10759: 'Action & Adventure',
    10762: 'Kids',
    10763: 'News',
    10764: 'Reality',
    10765: 'Sci-Fi & Fantasy',
    10766: 'Soap',
    10767: 'Talk',
    10768: 'War & Politics',
};

interface UseContentWithDetailsOptions {
    filter?: ContentFilter; // simple string filter
    advancedFilters?: AdvancedFilters; // complex object filter
    limit?: number;
}

interface UseContentWithDetailsResult {
    content: ContentCardData[];
    isLoading: boolean;
    isLoadingMore: boolean;
    error: Error | null;
    hasMore: boolean;
    refetch: () => void;
    loadMore: () => void;
}

export function useContentWithDetails(
    options: UseContentWithDetailsOptions = {}
): UseContentWithDetailsResult {
    const { filter = 'all', advancedFilters, limit = 10 } = options;
    const { activeProfile, watchlist } = useAppStore();

    const [content, setContent] = useState<ContentCardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const pageRef = useRef(1);
    const [hasMore, setHasMore] = useState(true);

    // Store partner interactions map
    const [partnerInteractions, setPartnerInteractions] = useState<Record<string, PartnerStatus>>({});

    // Fetch partner interactions
    useEffect(() => {
        const fetchInteractions = async () => {
            // If I am user1, I want user2's interactions
            const partnerProfile = activeProfile === 'user1' ? 'user2' : 'user1';

            try {
                const partnerUid = await getUidByProfile(partnerProfile);
                if (!partnerUid) return;

                const interactions = await getUserInteractions(partnerUid);
                const map: Record<string, PartnerStatus> = {};
                interactions.forEach(i => {
                    // Convert Firestore status string to PartnerStatus using helper
                    map[i.tmdbId] = getPartnerStatus(i.status);
                });
                setPartnerInteractions(map);
            } catch (e) {
                console.error("Failed to fetch partner interactions", e);
            }
        };
        fetchInteractions();
    }, [activeProfile]);

    const fetchContent = useCallback(async (isLoadMore = false) => {
        if (isLoadMore) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
            pageRef.current = 1;
        }
        setError(null);

        try {
            // 1. Use the SHARED watchlist from Zustand store (not per-user Firestore interactions)
            // The watchlist is shared between both users - that's the intended architecture
            const sharedWatchlistItems = [...watchlist];

            // 2. Sort based on filter
            const sortBy = advancedFilters?.sortBy || 'latest';

            sharedWatchlistItems.sort((a, b) => {
                if (sortBy === 'highest_score') {
                    // Sort by vote average (desc)
                    const scoreA = a.voteAverage || 0;
                    const scoreB = b.voteAverage || 0;
                    if (scoreA !== scoreB) return scoreB - scoreA;
                } else if (sortBy === 'popular') {
                    // Sort by popularity (desc)
                    const popA = a.popularity || 0;
                    const popB = b.popularity || 0;
                    if (popA !== popB) return popB - popA;
                }

                // Default / Fallback: Sort by Date Added descending
                // Handle addedAt being either a Date object or string (from localStorage hydration)
                const getTimestamp = (date: Date | string | undefined): number => {
                    if (!date) return 0;
                    if (date instanceof Date) return date.getTime();
                    // It's a string (ISO format from localStorage)
                    return new Date(date).getTime();
                };
                const dateA = getTimestamp(a.addedAt);
                const dateB = getTimestamp(b.addedAt);
                return dateB - dateA;
            });

            // 3. Transform to MediaItem stubs
            let mediaItems: MediaItem[] = sharedWatchlistItems.map(item => ({
                id: item.id,
                mediaType: item.mediaType,
                title: item.title || '',
                originalTitle: '',
                overview: '',
                posterPath: item.posterPath || null,
                backdropPath: null,
                releaseDate: item.releaseDate || '',
                voteAverage: item.voteAverage || 0,
                voteCount: 0,
                popularity: item.popularity || 0,
                genreIds: [],
            }));

            // 5. Apply Filters (Client-side)

            // Simple Type Filter
            if (filter === 'movies') {
                mediaItems = mediaItems.filter(i => i.mediaType === 'movie');
            } else if (filter === 'tv') {
                mediaItems = mediaItems.filter(i => i.mediaType === 'tv');
            }

            // Advanced Filters (Content Type)
            if (advancedFilters?.contentType === 'movies') {
                mediaItems = mediaItems.filter(i => i.mediaType === 'movie');
            } else if (advancedFilters?.contentType === 'tv') {
                mediaItems = mediaItems.filter(i => i.mediaType === 'tv');
            }

            // Note: Other advanced filters (genre, rating, runtime) require details, 
            // so we must fetch details FIRST or fetch details for ALL candidates?
            // If we filter BEFORE fetching details, we might miss items that match criteria but weren't fetched.
            // But fetching details for ALL items in watchlist is expensive (API limits).
            // A common strategy is to filter what we can (type), then fetch details for the current page,
            // BUT this breaks filtering if the matching items are on page 10.
            // Given this is a "Watchlist" (likely < 500 items), filtering AFTER matching is safer for consistency,
            // but we need the details.

            // OPTIMIZATION: For this iteration, we will paginate the *ids* then fetch details. 
            // This ignores advanced filters for non-fetched items, which is a trade-off.
            // If the user applies a "Genre" filter, it will only filter the visible page. 
            // TO FIX PROPERLY: We would need stored metadata in Firestore (genres, runtime) to filter effectively without API calls.
            // For now, I will proceed with PAGINATED fetching of details for the *entire sorted list* if filters are active?
            // No, that's too heavy. I will accept that complex filters only apply to the visible/fetched set OR 
            // I should disable complex filters on the Home page if we can't support them efficiently?
            // The prompt asks to "change default ordering". It doesn't explicitly demand advanced filtering on the full dataset.
            // I'll stick to paginating the sorted ID list.

            const totalItems = mediaItems.length;
            const nextPage = isLoadMore ? pageRef.current + 1 : 1;
            const startIndex = (nextPage - 1) * limit;
            const endIndex = startIndex + limit;

            const slicedItems = mediaItems.slice(startIndex, endIndex);

            // Fetch details for the slice
            const enrichedContent = await Promise.all(
                slicedItems.map(async (item) => {
                    try {
                        return await enrichMediaItem(item, partnerInteractions);
                    } catch (err) {
                        console.error(`Failed to enrich item ${item.id}:`, err);
                        return createBasicCardData(item, partnerInteractions);
                    }
                })
            );

            // Apply Post-Fetch Filters (e.g. 'available')
            let finalContent = enrichedContent;

            if (filter === 'available') {
                finalContent = finalContent.filter(c => c.streamingProvider !== null);
            }

            // Apply Advanced Filters (Client-side on the fetched chunk - restricted scope)
            if (advancedFilters) {
                finalContent = finalContent.filter(item => {
                    // Genres
                    if (advancedFilters.genres.length > 0) {
                        const itemGenres = item.genre.split(', ').map(g => g.trim());
                        const hasMatchingGenre = advancedFilters.genres.some(genre =>
                            itemGenres.some(ig => ig.toLowerCase().includes(genre.toLowerCase()))
                        );
                        if (!hasMatchingGenre) return false;
                    }

                    // Min Rating
                    if (advancedFilters.minImdbRating > 0 && item.imdbRating) {
                        const rating = parseFloat(item.imdbRating);
                        if (rating < advancedFilters.minImdbRating) return false;
                    }

                    // Max Runtime
                    if (advancedFilters.maxRuntime < 240 && item.runtime) {
                        const runtimeMatch = item.runtime.match(/(\d+)h?\s*(\d+)?m?/);
                        if (runtimeMatch) {
                            const hours = parseInt(runtimeMatch[1]) || 0;
                            const mins = parseInt(runtimeMatch[2]) || 0;
                            const totalMins = hours * 60 + mins;
                            if (totalMins > advancedFilters.maxRuntime) return false;
                        }
                    }

                    // Decades
                    if (advancedFilters.releaseDecades.length > 0 && item.year) {
                        const year = parseInt(item.year);
                        const matchesDecade = advancedFilters.releaseDecades.some(decade => {
                            switch (decade) {
                                case '2020s': return year >= 2020 && year < 2030;
                                case '2010s': return year >= 2010 && year < 2020;
                                case '2000s': return year >= 2000 && year < 2010;
                                case '1990s': return year >= 1990 && year < 2000;
                                case 'older': return year < 1990;
                                default: return true;
                            }
                        });
                        if (!matchesDecade) return false;
                    }

                    // Partner Rating Filter
                    if (advancedFilters.partnerRating !== 'any') {
                        if (item.partnerStatus !== advancedFilters.partnerRating) return false;
                    }

                    return true;
                });
            }

            // Sort AFTER enrichment (since voteAverage is now available from API)
            if (sortBy === 'highest_score') {
                finalContent.sort((a, b) => {
                    const scoreA = a.voteAverage || 0;
                    const scoreB = b.voteAverage || 0;
                    return scoreB - scoreA;
                });
            } else if (sortBy === 'popular') {
                finalContent.sort((a, b) => {
                    const popA = a.popularity || 0;
                    const popB = b.popularity || 0;
                    return popB - popA;
                });
            }
            // Note: 'latest' sort is handled pre-enrichment using addedAt (line 119-143)

            if (isLoadMore) {
                setContent(prev => [...prev, ...finalContent]);
                pageRef.current = nextPage;
            } else {
                setContent(finalContent);
            }

            setHasMore(endIndex < totalItems);
        } catch (err) {
            console.error('Failed to fetch content:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch content'));
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [filter, advancedFilters, partnerInteractions, activeProfile, limit, watchlist]);

    useEffect(() => {
        fetchContent(false);
    }, [fetchContent]);

    return {
        content,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        refetch: () => fetchContent(false),
        loadMore: () => fetchContent(true),
    };
}

/**
 * Enrich a media item with full details, ratings, and streaming providers
 * OPTIMIZED: Uses single API call with append_to_response via cached service
 */
async function enrichMediaItem(
    item: MediaItem,
    partnerInteractions: Record<string, PartnerStatus>
): Promise<ContentCardData> {
    // Single API call with all data via append_to_response (replaces 4 separate calls)
    const details = await getContentDetailsEnriched(item.id, item.mediaType);

    // Get ratings from OMDb if we have an IMDb ID (cached)
    let ratings = { rottenTomatoes: null as string | null, imdbRating: null as string | null, metacritic: null as string | null };
    if (details.externalIds.imdbId) {
        const omdbRatings = await cachedFetch(
            CacheKeys.omdbRatings(details.externalIds.imdbId),
            () => getRatingsByImdbId(details.externalIds.imdbId!)
        );
        if (omdbRatings) {
            ratings = {
                rottenTomatoes: omdbRatings.rottenTomatoes,
                imdbRating: omdbRatings.imdbRating,
                metacritic: omdbRatings.metacritic?.replace('/100', '') ?? null,
            };
        }
    }

    // Get first streaming provider from appended data
    let streamingProvider: ContentCardData['streamingProvider'] = null;
    const flatrateProviders = details.watchProviders?.flatrate || [];
    if (flatrateProviders.length > 0) {
        const firstProvider = flatrateProviders[0];
        streamingProvider = {
            id: mapProviderToServiceId(firstProvider.providerName),
            name: firstProvider.providerName,
            logoUrl: firstProvider.logoPath,
        };
    }

    // Get runtime
    let runtime = '';
    if (item.mediaType === 'movie' && 'runtime' in details) {
        runtime = formatRuntime((details as any).runtime);
    } else if (item.mediaType === 'tv' && 'episodeRunTime' in details) {
        const avgRuntime = (details as any).episodeRunTime[0] || 0;
        runtime = formatRuntime(avgRuntime);
    }

    // Get genre
    let genre = '';
    if (details.genres && details.genres.length > 0) {
        genre = details.genres[0].name;
    } else {
        const genreIds = item.genreIds || [];
        genre = genreIds.length > 0 ? (GENRE_MAP[genreIds[0]] || '') : '';
    }

    // Get partner status from Firestore map
    const partnerStatus = partnerInteractions[item.id.toString()] || null;

    return {
        id: item.id,
        mediaType: item.mediaType,
        title: details.title,
        year: extractYear(details.releaseDate),
        runtime,
        genre,
        posterUrl: getImageUrl(details.posterPath, 'medium'),
        rottenTomatoes: ratings.rottenTomatoes,
        imdbRating: ratings.imdbRating,
        metacritic: ratings.metacritic,
        streamingProvider,
        partnerStatus,
        voteAverage: details.voteAverage,
        popularity: details.popularity,
        releaseDate: details.releaseDate,
    };
}


/**
 * Create basic card data without enrichment (fallback)
 */
function createBasicCardData(
    item: MediaItem,
    partnerInteractions: Record<string, PartnerStatus>
): ContentCardData {
    const genreIds = item.genreIds || [];
    const genre = genreIds.length > 0 ? (GENRE_MAP[genreIds[0]] || '') : '';

    return {
        id: item.id,
        mediaType: item.mediaType,
        title: item.title,
        year: extractYear(item.releaseDate),
        runtime: '',
        genre,
        posterUrl: getImageUrl(item.posterPath, 'medium'),
        rottenTomatoes: null,
        imdbRating: item.voteAverage?.toFixed(1) || null,
        metacritic: null,
        streamingProvider: null,
        partnerStatus: partnerInteractions[item.id.toString()] || null,
        voteAverage: item.voteAverage,
        popularity: item.popularity,
        releaseDate: item.releaseDate,
    };
}
