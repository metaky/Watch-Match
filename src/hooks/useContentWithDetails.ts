// Hook for fetching content with full details (TMDB + OMDb ratings + streaming)
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getTrending,
    getMovieDetails,
    getTVDetails,
    getWatchProviders,
    getExternalIds,
    type MediaItem
} from '@/services/tmdb';
import { getRatingsByImdbId } from '@/services/omdb';
import { getImageUrl } from '@/services/api';
import { mapProviderToServiceId } from '@/components/StreamingBadge';
import type { ContentCardData, ContentFilter, PartnerStatus } from '@/types/content';
import { formatRuntime, extractYear, getPartnerStatus } from '@/types/content';
import { useAppStore } from '@/store/useAppStore';
import { getUserInteractions } from '@/lib/services/interactionService';
import { AdvancedFilters } from '@/types/content';

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
    const { activeProfile } = useAppStore();

    const [content, setContent] = useState<ContentCardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Store partner interactions map
    const [partnerInteractions, setPartnerInteractions] = useState<Record<string, PartnerStatus>>({});

    // Fetch partner interactions
    useEffect(() => {
        const fetchInteractions = async () => {
            // If I am user1, I want user2's interactions
            const partnerId = activeProfile === 'user1' ? 'user2' : 'user1';
            try {
                const interactions = await getUserInteractions(partnerId);
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
            setPage(1);
        }
        setError(null);

        try {
            // Fetch trending content from TMDB
            let mediaType: 'movie' | 'tv' | 'all' = 'all';

            if (advancedFilters?.contentType === 'movies') mediaType = 'movie';
            else if (advancedFilters?.contentType === 'tv') mediaType = 'tv';
            else if (filter === 'movies') mediaType = 'movie';
            else if (filter === 'tv') mediaType = 'tv';

            const nextPage = isLoadMore ? page + 1 : 1;
            const response = await getTrending(mediaType, 'week', nextPage);
            const rawItems = response.results;

            // Fetch additional details for each item
            const enrichedContent = await Promise.all(
                rawItems.map(async (item) => {
                    try {
                        return await enrichMediaItem(item, partnerInteractions);
                    } catch (err) {
                        console.error(`Failed to enrich item ${item.id}:`, err);
                        return createBasicCardData(item, partnerInteractions);
                    }
                })
            );

            // Apply filters
            let finalContent = enrichedContent;

            // 1. Simple filter for availability
            if (filter === 'available') {
                finalContent = finalContent.filter(c => c.streamingProvider !== null);
            }

            // 2. Advanced Filters
            if (advancedFilters) {
                finalContent = finalContent.filter(item => {
                    // Content Type
                    if (advancedFilters.contentType === 'movies' && item.mediaType !== 'movie') return false;
                    if (advancedFilters.contentType === 'tv' && item.mediaType !== 'tv') return false;

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

            if (isLoadMore) {
                setContent(prev => [...prev, ...finalContent]);
                setPage(nextPage);
            } else {
                setContent(finalContent);
            }

            setHasMore(response.page < response.totalPages);
        } catch (err) {
            console.error('Failed to fetch content:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch content'));
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [filter, page, advancedFilters, partnerInteractions]);

    useEffect(() => {
        fetchContent(false);
    }, [filter, advancedFilters, partnerInteractions]);

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
 */
async function enrichMediaItem(
    item: MediaItem,
    partnerInteractions: Record<string, PartnerStatus>
): Promise<ContentCardData> {
    const [details, providers, externalIds] = await Promise.all([
        item.mediaType === 'movie'
            ? getMovieDetails(item.id)
            : getTVDetails(item.id),
        getWatchProviders(item.id, item.mediaType, 'US'),
        getExternalIds(item.id, item.mediaType),
    ]);

    // Get ratings from OMDb if we have an IMDb ID
    let ratings = { rottenTomatoes: null as string | null, imdbRating: null as string | null, metacritic: null as string | null };
    if (externalIds.imdbId) {
        const omdbRatings = await getRatingsByImdbId(externalIds.imdbId);
        if (omdbRatings) {
            ratings = {
                rottenTomatoes: omdbRatings.rottenTomatoes,
                imdbRating: omdbRatings.imdbRating,
                metacritic: omdbRatings.metacritic?.replace('/100', '') ?? null,
            };
        }
    }

    // Get first streaming provider
    let streamingProvider: ContentCardData['streamingProvider'] = null;
    const flatrateProviders = providers?.flatrate || [];
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
        runtime = formatRuntime(details.runtime);
    } else if (item.mediaType === 'tv' && 'episodeRunTime' in details) {
        const avgRuntime = details.episodeRunTime[0] || 0;
        runtime = formatRuntime(avgRuntime);
    }

    // Get genre
    const genreIds = item.genreIds || [];
    const genre = genreIds.length > 0 ? (GENRE_MAP[genreIds[0]] || '') : '';

    // Get partner status from Firestore map
    const partnerStatus = partnerInteractions[item.id.toString()] || null;

    return {
        id: item.id,
        mediaType: item.mediaType,
        title: item.title,
        year: extractYear(item.releaseDate),
        runtime,
        genre,
        posterUrl: getImageUrl(item.posterPath, 'medium'),
        rottenTomatoes: ratings.rottenTomatoes,
        imdbRating: ratings.imdbRating,
        metacritic: ratings.metacritic,
        streamingProvider,
        partnerStatus,
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
    };
}
