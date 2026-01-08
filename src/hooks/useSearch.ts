// Custom hook for search functionality (OPTIMIZED - no per-item API calls)
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchMulti, getTrending, discoverMedia } from '@/services/tmdb';
import { getImageUrl } from '@/services/api';
import type { ContentCardData, SearchFilters } from '@/types/content';
import { extractYear, hasActiveSearchFilters } from '@/types/content';

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

// Reverse lookup: genre name to ID (for API filtering)
const GENRE_NAME_TO_ID: Record<string, number> = Object.fromEntries(
    Object.entries(GENRE_MAP).map(([id, name]) => [name.toLowerCase(), parseInt(id)])
);

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
    hasFiltersActive: boolean;
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

    // Check if any filters are active (for UI purposes)
    const hasFiltersActive = hasActiveSearchFilters(filters);

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
    // OPTIMIZED: Uses only data from search API - no additional API calls
    // Detail fetching (runtime, providers) is deferred to when user opens the detail modal
    const transformResults = useCallback((tmdbResults: { id: number; title: string; mediaType: 'movie' | 'tv'; posterPath: string | null; releaseDate: string; voteAverage: number; genreIds: number[] }[]): ContentCardData[] => {
        // Limit results for display
        const limitedResults = tmdbResults.slice(0, initialItemsCount);

        return limitedResults.map((item) => {
            // Map genre IDs to names using local mapping (no API call)
            const genreNames = item.genreIds
                .slice(0, 2)
                .map(id => GENRE_MAP[id] || 'Unknown')
                .join(', ');

            return {
                id: item.id,
                mediaType: item.mediaType,
                title: item.title,
                year: extractYear(item.releaseDate),
                runtime: '', // Will be fetched when detail modal opens
                genre: genreNames,
                posterUrl: item.posterPath ? getImageUrl(item.posterPath, 'medium') : null,
                rottenTomatoes: null, // Will be fetched when detail modal opens
                imdbRating: item.voteAverage ? item.voteAverage.toFixed(1) : null,
                metacritic: null,
                streamingProvider: null, // Will be fetched when detail modal opens
                partnerStatus: null, // Not in watchlist
                voteAverage: item.voteAverage,
                popularity: 0,
                releaseDate: item.releaseDate,
            } as ContentCardData;
        });
    }, [initialItemsCount]);

    // Build TMDB API filter parameters from SearchFilters
    const buildApiFilters = useCallback((searchFilters: SearchFilters): Record<string, any> => {
        const apiFilters: Record<string, any> = {};

        // Map genre names to TMDB genre IDs
        if (searchFilters.genres.length > 0) {
            const genreIds = searchFilters.genres
                .map(genreName => GENRE_NAME_TO_ID[genreName.toLowerCase()])
                .filter((id): id is number => id !== undefined);
            if (genreIds.length > 0) {
                // Use pipe separator for OR logic (show content matching ANY selected genre)
                // Comma separator would be AND logic (only show content matching ALL genres)
                apiFilters.with_genres = genreIds.join('|');
            }
        }

        // Map release decades to date ranges
        if (searchFilters.releaseDecades.length > 0) {
            // Find the earliest and latest years from selected decades
            let minYear = 3000;
            let maxYear = 0;

            searchFilters.releaseDecades.forEach(decade => {
                switch (decade) {
                    case '2020s':
                        minYear = Math.min(minYear, 2020);
                        maxYear = Math.max(maxYear, 2029);
                        break;
                    case '2010s':
                        minYear = Math.min(minYear, 2010);
                        maxYear = Math.max(maxYear, 2019);
                        break;
                    case '2000s':
                        minYear = Math.min(minYear, 2000);
                        maxYear = Math.max(maxYear, 2009);
                        break;
                    case '1990s':
                        minYear = Math.min(minYear, 1990);
                        maxYear = Math.max(maxYear, 1999);
                        break;
                    case 'older':
                        minYear = Math.min(minYear, 1900);
                        maxYear = Math.max(maxYear, 1989);
                        break;
                }
            });

            if (minYear < 3000) {
                apiFilters['primary_release_date.gte'] = `${minYear}-01-01`;
                apiFilters['first_air_date.gte'] = `${minYear}-01-01`;
            }
            if (maxYear > 0) {
                // Don't show future content
                const today = new Date();
                const effectiveMaxYear = Math.min(maxYear, today.getFullYear());
                const effectiveMaxDate = maxYear >= today.getFullYear()
                    ? today.toISOString().split('T')[0]
                    : `${maxYear}-12-31`;
                apiFilters['primary_release_date.lte'] = effectiveMaxDate;
                apiFilters['first_air_date.lte'] = effectiveMaxDate;
            }
        }

        // Custom year range takes precedence
        if (searchFilters.customYearRange) {
            if (searchFilters.customYearRange.start) {
                apiFilters['primary_release_date.gte'] = `${searchFilters.customYearRange.start}-01-01`;
                apiFilters['first_air_date.gte'] = `${searchFilters.customYearRange.start}-01-01`;
            }
            if (searchFilters.customYearRange.end) {
                apiFilters['primary_release_date.lte'] = `${searchFilters.customYearRange.end}-12-31`;
                apiFilters['first_air_date.lte'] = `${searchFilters.customYearRange.end}-12-31`;
            }
        }

        // Available to Stream filter - use popular US streaming providers
        // Netflix=8, Amazon Prime=9, Disney+=337, Hulu=15, Max=1899, Apple TV+=350, Paramount+=531, Peacock=386
        if (searchFilters.availableToStream) {
            apiFilters.with_watch_providers = '8|9|337|15|1899|350|531|386';
            apiFilters.watch_region = 'US';
        }

        return apiFilters;
    }, []);

    // Fetch content for browse mode (trending or discovered/sorted)
    const fetchBrowsingContent = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Check if any filters (besides sort) are active
            const hasFiltersActive = hasActiveSearchFilters(filters);

            // Determine media type
            const mediaType = filters.contentType === 'movies' ? 'movie' :
                filters.contentType === 'tv' ? 'tv' : 'all';

            let fetchedResults;

            // If no filters are active and sort is 'popular', use trending (includes both movies and TV)
            // Otherwise, use discover with filters for server-side filtering
            const sortBy = filters.sortBy || 'popular';
            const useDiscover = hasFiltersActive || sortBy !== 'popular';

            if (!useDiscover && mediaType === 'all') {
                // Default: no filters, popular sort - use trending
                fetchedResults = await getTrending(mediaType);
            } else if (mediaType === 'all' && useDiscover) {
                // Filters active but mediaType is 'all' - fetch both and merge
                const tmdbSort = sortBy === 'highest_score' ? 'vote_average.desc' :
                    sortBy === 'latest' ? 'primary_release_date.desc' : 'popularity.desc';

                const apiFilters = buildApiFilters(filters);

                const [movieResults, tvResults] = await Promise.all([
                    discoverMedia('movie', tmdbSort, 1, apiFilters),
                    discoverMedia('tv', tmdbSort, 1, apiFilters),
                ]);

                // Merge and sort by the selected criteria
                const combined = [...movieResults.results, ...tvResults.results];
                if (sortBy === 'highest_score') {
                    combined.sort((a, b) => b.voteAverage - a.voteAverage);
                } else if (sortBy === 'latest') {
                    combined.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
                } else {
                    combined.sort((a, b) => b.popularity - a.popularity);
                }

                fetchedResults = { results: combined.slice(0, 40) };
            } else {
                // Specific media type or filters active
                const tmdbSort = sortBy === 'highest_score' ? 'vote_average.desc' :
                    sortBy === 'latest' ? 'primary_release_date.desc' : 'popularity.desc';

                const apiFilters = buildApiFilters(filters);
                fetchedResults = await discoverMedia(mediaType as 'movie' | 'tv', tmdbSort, 1, apiFilters);
            }

            const transformed = transformResults(fetchedResults.results);
            // Still apply client-side filters for anything the API couldn't handle (like minImdbRating, maxRuntime)
            const filtered = applyFilters(transformed);
            setResults(filtered);
            setSuggestions(filtered.slice(0, 5));
            setHasMore(false);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch content'));
            setResults([]);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [filters, transformResults, applyFilters]);

    // Perform search
    const performSearch = useCallback(async (searchQuery: string, pageNum = 1) => {
        if (!searchQuery.trim()) {
            fetchBrowsingContent();
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

            const transformed = transformResults(searchResults);
            let filtered = applyFilters(transformed);

            // Client-side sorting for search results (since API doesn't support sort_by with query)
            if (filters.sortBy === 'highest_score') {
                filtered.sort((a, b) => {
                    const ratingA = parseFloat(a.imdbRating || '0');
                    const ratingB = parseFloat(b.imdbRating || '0');
                    return ratingB - ratingA;
                });
            } else if (filters.sortBy === 'latest') {
                filtered.sort((a, b) => {
                    const yearA = parseInt(a.year || '0');
                    const yearB = parseInt(b.year || '0');
                    return yearB - yearA;
                });
            }

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
    }, [transformResults, applyFilters, fetchBrowsingContent, filters.sortBy]);

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
            fetchBrowsingContent();
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
        hasFiltersActive,
        suggestions,
    };
}
