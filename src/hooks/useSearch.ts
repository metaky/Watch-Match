// Custom hook for search functionality
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchMulti, getTrending, getMovieDetails, getTVDetails, getWatchProviders } from '@/services/tmdb';
import { getImageUrl } from '@/services/api';
import type { ContentCardData, SearchFilters } from '@/types/content';
import { extractYear, formatRuntime } from '@/types/content';

// Genre ID to name mapping from TMDB
const GENRE_MAP: Record<number, string> = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Sci-Fi',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
    // TV genres
    10759: 'Action & Adventure',
    10762: 'Kids',
    10763: 'News',
    10764: 'Reality',
    10765: 'Sci-Fi & Fantasy',
    10766: 'Soap',
    10767: 'Talk',
    10768: 'War & Politics',
};

// Map MediaItem to ContentCardData for suggestions
const toSuggestion = (item: any): ContentCardData => ({
    id: item.id,
    mediaType: item.mediaType,
    title: item.title,
    year: item.releaseDate ? extractYear(item.releaseDate) : '',
    runtime: '',
    genre: '',
    posterUrl: item.posterPath ? getImageUrl(item.posterPath, 'small') : null,
    rottenTomatoes: null,
    imdbRating: item.voteAverage ? item.voteAverage.toFixed(1) : null,
    metacritic: null,
    streamingProvider: null,
    partnerStatus: null,
});

interface UseSearchOptions {
    debounceMs?: number;
    initialItemsCount?: number;
}

interface UseSearchResult {
    results: ContentCardData[];
    isLoading: boolean;
    error: Error | null;
    query: string;
    hasMore: boolean;
    loadMore: () => void;
    isBrowseMode: boolean;
    suggestions: ContentCardData[];
}

export function useSearch(
    query: string,
    filters: SearchFilters,
    options: UseSearchOptions = {}
): UseSearchResult {
    const { debounceMs = 300, initialItemsCount = 20 } = options;

    const [results, setResults] = useState<ContentCardData[]>([]);
    const [suggestions, setSuggestions] = useState<ContentCardData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Check if we're in browse mode (no search query)
    const isBrowseMode = query.trim() === '';

    // Filter results based on search filters
    const applyFilters = useCallback((items: ContentCardData[]): ContentCardData[] => {
        return items.filter((item) => {
            // Content type filter
            if (filters.contentType === 'movies' && item.mediaType !== 'movie') return false;
            if (filters.contentType === 'tv' && item.mediaType !== 'tv') return false;

            // Genre filter
            if (filters.genres.length > 0) {
                const itemGenres = item.genre.split(', ').map(g => g.trim());
                const hasMatchingGenre = filters.genres.some(genre =>
                    itemGenres.some(ig => ig.toLowerCase().includes(genre.toLowerCase()))
                );
                if (!hasMatchingGenre) return false;
            }

            // Min IMDb rating filter
            if (filters.minImdbRating > 0 && item.imdbRating) {
                const rating = parseFloat(item.imdbRating);
                if (rating < filters.minImdbRating) return false;
            }

            // Max runtime filter
            if (filters.maxRuntime < 240 && item.runtime) {
                const runtimeMatch = item.runtime.match(/(\d+)h?\s*(\d+)?m?/);
                if (runtimeMatch) {
                    const hours = parseInt(runtimeMatch[1]) || 0;
                    const mins = parseInt(runtimeMatch[2]) || 0;
                    const totalMins = hours * 60 + mins;
                    if (totalMins > filters.maxRuntime) return false;
                }
            }

            // Release decade filter
            if (filters.releaseDecades.length > 0 && item.year) {
                const year = parseInt(item.year);
                const matchesDecade = filters.releaseDecades.some(decade => {
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

            // Custom year range filter
            if (filters.customYearRange) {
                const year = parseInt(item.year);
                if (filters.customYearRange.start && year < filters.customYearRange.start) return false;
                if (filters.customYearRange.end && year > filters.customYearRange.end) return false;
            }

            return true;
        });
    }, [filters]);

    // Transform TMDB results to ContentCardData
    const transformResults = useCallback(async (tmdbResults: { id: number; title: string; mediaType: 'movie' | 'tv'; posterPath: string | null; releaseDate: string; voteAverage: number; genreIds: number[] }[]): Promise<ContentCardData[]> => {
        // Limit to avoid too many API calls
        const limitedResults = tmdbResults.slice(0, initialItemsCount);

        const transformedResults = await Promise.all(
            limitedResults.map(async (item) => {
                try {
                    // Get details for runtime
                    let runtime = '';
                    if (item.mediaType === 'movie') {
                        const details = await getMovieDetails(item.id);
                        runtime = formatRuntime(details.runtime);
                    } else {
                        const details = await getTVDetails(item.id);
                        runtime = details.episodeRunTime?.[0]
                            ? formatRuntime(details.episodeRunTime[0]) + '/ep'
                            : '';
                    }

                    // Get watch providers
                    const providers = await getWatchProviders(item.id, item.mediaType);
                    const streamingProvider = providers?.flatrate?.[0]
                        ? {
                            id: 'other' as const,
                            name: providers.flatrate[0].providerName,
                            logoUrl: providers.flatrate[0].logoPath,
                        }
                        : null;

                    // Map genre IDs to names
                    const genreNames = item.genreIds
                        .slice(0, 2)
                        .map(id => GENRE_MAP[id] || 'Unknown')
                        .join(', ');

                    return {
                        id: item.id,
                        mediaType: item.mediaType,
                        title: item.title,
                        year: extractYear(item.releaseDate),
                        runtime,
                        genre: genreNames,
                        posterUrl: item.posterPath ? getImageUrl(item.posterPath, 'medium') : null,
                        rottenTomatoes: null, // Would need OMDb API
                        imdbRating: item.voteAverage ? (item.voteAverage).toFixed(1) : null,
                        metacritic: null,
                        streamingProvider,
                        partnerStatus: null, // Not in watchlist
                    } as ContentCardData;
                } catch (err) {
                    console.error(`Error transforming item ${item.id}:`, err);
                    return null;
                }
            })
        );

        return transformedResults.filter((item): item is ContentCardData => item !== null);
    }, [initialItemsCount]);

    // Fetch trending content for browse mode
    const fetchTrending = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const trending = await getTrending(
                filters.contentType === 'movies' ? 'movie' :
                    filters.contentType === 'tv' ? 'tv' : 'all'
            );

            const transformed = await transformResults(trending.results);
            const filtered = applyFilters(transformed);
            setResults(filtered);
            setSuggestions(filtered.slice(0, 5)); // For checking
            setHasMore(false); // Trending is a single page
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch trending'));
            setResults([]);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [filters.contentType, transformResults, applyFilters]);

    // Perform search
    const performSearch = useCallback(async (searchQuery: string, pageNum = 1) => {
        if (!searchQuery.trim()) {
            fetchTrending();
            return;
        }

        // Cancel any previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);

        try {
            const { results: searchResults, totalPages } = await searchMulti(searchQuery, pageNum);

            // Set suggestions from raw results (first 8)
            if (pageNum === 1) {
                setSuggestions(searchResults.slice(0, 8).map(toSuggestion));
            }

            const transformed = await transformResults(searchResults);
            const filtered = applyFilters(transformed);

            if (pageNum === 1) {
                setResults(filtered);
            } else {
                setResults(prev => [...prev, ...filtered]);
            }

            setPage(pageNum);
            setHasMore(pageNum < totalPages);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return; // Ignore aborted requests
            }
            setError(err instanceof Error ? err : new Error('Search failed'));
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [transformResults, applyFilters, fetchTrending]);

    // Debounced search effect
    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            performSearch(query, 1);
        }, debounceMs);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [query, performSearch, debounceMs]);

    // Re-apply filters when filters change
    useEffect(() => {
        if (query.trim()) {
            performSearch(query, 1);
        } else {
            fetchTrending();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    // Load more results
    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            performSearch(query, page + 1);
        }
    }, [isLoading, hasMore, performSearch, query, page]);

    return {
        results,
        isLoading,
        error,
        query,
        hasMore,
        loadMore,
        isBrowseMode,
        suggestions,
    };
}
