// Content types for the Home Page Dashboard

import { InteractionStatus } from './firestore';

/**
 * Streaming service identifiers matching our supported providers
 */
export type StreamingServiceId =
    | 'netflix'
    | 'max'
    | 'hulu'
    | 'disney_plus'
    | 'apple_tv'
    | 'paramount_plus'
    | 'amazon_prime'
    | 'peacock'
    | 'other';

/**
 * Streaming provider display info
 */
export interface StreamingProviderInfo {
    id: StreamingServiceId;
    name: string;
    logoUrl?: string;
}

/**
 * Partner status derived from interaction status
 * - 'liked' = Partner loves it (Yes, liked)
 * - 'not_important' = Partner is neutral
 * - 'wont_watch' = Partner won't watch (No, wont_watch)
 * - null = Partner hasn't rated
 */
export type PartnerStatus = 'liked' | 'not_important' | 'wont_watch' | null;

/**
 * Maps interaction status to partner display status
 */
export function getPartnerStatus(status: InteractionStatus | null): PartnerStatus {
    if (!status) return null;

    switch (status) {
        case 'liked':
        case 'Yes':
            return 'liked';
        case 'not_important':
            return 'not_important';
        case 'No':
        case 'wont_watch':
            return 'wont_watch';
        case 'watched':
            return 'liked'; // If watched, they presumably liked it
        default:
            return null;
    }
}

/**
 * Unified content card data for display
 */
export interface ContentCardData {
    id: number;
    mediaType: 'movie' | 'tv';
    title: string;
    year: string;
    runtime: string; // "2h 46m" or "35m" for TV episode length
    genre: string;
    posterUrl: string | null;

    // Ratings
    rottenTomatoes: string | null; // "93%"
    imdbRating: string | null;     // "8.8"
    metacritic: string | null;     // "79"

    // Streaming availability (first/best provider)
    streamingProvider: StreamingProviderInfo | null;

    // Partner's interaction status
    partnerStatus: PartnerStatus;

    // Metadata for sorting (hidden from UI but used for logic)
    voteAverage?: number;
    popularity?: number;
    releaseDate?: string;
}

/**
 * Filter options for the dashboard
 */
export type ContentFilter = 'all' | 'movies' | 'tv' | 'available';

/**
 * Format runtime in minutes to human readable string
 * @param minutes - Total minutes
 * @returns Formatted string like "2h 46m" or "35m"
 */
export function formatRuntime(minutes: number | undefined | null): string {
    if (!minutes || minutes <= 0) return '';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
        return `${hours}h ${mins}m`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        return `${mins}m`;
    }
}

/**
 * Extract year from date string
 * @param dateStr - ISO date string like "2024-03-15"
 * @returns Year string like "2024"
 */
export function extractYear(dateStr: string | undefined | null): string {
    if (!dateStr) return '';
    return dateStr.substring(0, 4);
}

/**
 * Release decade options for filtering
 */
export type ReleaseDecade = '2020s' | '2010s' | '2000s' | '1990s' | 'older';

/**
 * Custom year range for filtering
 */
export interface YearRange {
    start: number | null;
    end: number | null;
}

/**
 * Popular genres (hardcoded) - can be expanded via TMDB API
 */
export const POPULAR_GENRES = [
    'Action',
    'Adventure',
    'Comedy',
    'Sci-Fi',
    'Drama',
    'Horror',
    'Thriller',
    'Romance',
    'Fantasy',
    'Animation',
    'Documentary',
    'Crime',
] as const;

export type PopularGenre = typeof POPULAR_GENRES[number];

/**
 * Advanced filter state for the filter overlay
 */
export interface AdvancedFilters {
    /** Content type filter - null means "all" */
    contentType: 'movies' | 'tv' | null;

    /** Selected streaming services (from user's saved services) */
    streamingServices: StreamingServiceId[];

    /** Selected genres */
    genres: string[];

    /** Sort order */
    sortBy: SortOption;

    /** Partner rating filter - 'any' means no filter applied */
    partnerRating: PartnerStatus | 'any';

    /** Minimum IMDb rating (0-10 scale) */
    minImdbRating: number;

    /** Maximum runtime in minutes */
    maxRuntime: number;

    /** Selected decades (multi-select) */
    releaseDecades: ReleaseDecade[];

    /** Custom year range (optional, takes precedence over decades if set) */
    customYearRange: YearRange | null;
}

/**
 * Default filter values (no filtering applied)
 */
export const DEFAULT_FILTERS: AdvancedFilters = {
    contentType: null,
    streamingServices: [],
    genres: [],
    sortBy: 'latest',
    partnerRating: 'any',
    minImdbRating: 0,
    maxRuntime: 240,
    releaseDecades: [],
    customYearRange: null,
};

/**
 * Check if any advanced filters are active
 */
export function hasActiveFilters(filters: AdvancedFilters): boolean {
    return (
        filters.contentType !== null ||
        filters.streamingServices.length > 0 ||
        filters.genres.length > 0 ||
        filters.partnerRating !== 'any' ||
        filters.minImdbRating > 0 ||
        filters.maxRuntime < 240 ||
        filters.releaseDecades.length > 0 ||
        filters.customYearRange !== null
    );
}

/**
 * Sort options for search/browse
 */
export type SortOption = 'latest' | 'highest_score' | 'popular';

/**
 * Search filter state (subset of AdvancedFilters for search page)
 * Excludes partner rating since it's not relevant for discovering new content
 */
export interface SearchFilters {
    /** Content type filter - null means "all" */
    contentType: 'movies' | 'tv' | null;

    /** Selected genres */
    genres: string[];

    /** Sort order */
    sortBy: SortOption;

    /** Minimum IMDb rating (0-10 scale) */
    minImdbRating: number;

    /** Maximum runtime in minutes */
    maxRuntime: number;

    /** Selected decades (multi-select) */
    releaseDecades: ReleaseDecade[];

    /** Custom year range (optional, takes precedence over decades if set) */
    customYearRange: YearRange | null;

    /** Filter to only show content available on streaming services */
    availableToStream: boolean;
}

/**
 * Default search filter values (no filtering applied)
 */
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
    contentType: null,
    genres: [],
    sortBy: 'popular',
    minImdbRating: 0,
    maxRuntime: 240,
    releaseDecades: [],
    customYearRange: null,
    availableToStream: false,
};

/**
 * Check if any search filters are active
 */
export function hasActiveSearchFilters(filters: SearchFilters): boolean {
    return (
        filters.contentType !== null ||
        filters.genres.length > 0 ||
        filters.minImdbRating > 0 ||
        filters.maxRuntime < 240 ||
        filters.releaseDecades.length > 0 ||
        filters.customYearRange !== null ||
        filters.availableToStream
    );
}

/**
 * Extended content data for detail view
 */
export interface ContentDetailData extends ContentCardData {
    /** Full plot overview */
    overview: string;
    /** Backdrop image URL (for trailer poster) */
    backdropUrl: string | null;
    /** YouTube video key for trailer */
    trailerKey: string | null;
    /** MPAA rating (PG-13, R, etc.) */
    mpaaRating: string | null;
    /** Streaming providers by availability type */
    watchProviders: {
        flatrate: StreamingProviderInfo[];
        rent: StreamingProviderInfo[];
        buy: StreamingProviderInfo[];
    } | null;
    /** User's own rating for this content */
    userRating: PartnerStatus;
    /** Cast members for the content */
    cast: CastMember[];
}

/**
 * Cast member information
 */
export interface CastMember {
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
}

/**
 * Filter state specifically for the Matches page
 */
export interface MatchesFilters {
    /** Selected streaming services */
    streamingServices: StreamingServiceId[];

    /** Selected genres */
    genres: string[];

    /** Show only unwatched content? (In a real app, this would check if both users watched it) */
    unwatchedOnly: boolean;
}

/**
 * Default matches filter values
 */
export const DEFAULT_MATCHES_FILTERS: MatchesFilters = {
    streamingServices: [],
    genres: [],
    unwatchedOnly: false,
};

/**
 * Check if any matches filters are active
 */
export function hasActiveMatchesFilters(filters: MatchesFilters): boolean {
    return (
        filters.streamingServices.length > 0 ||
        filters.genres.length > 0 ||
        filters.unwatchedOnly
    );
}

/**
 * Display label for partner status
 */
export function getPartnerStatusLabel(status: PartnerStatus): string {
    if (!status) return '';
    switch (status) {
        case 'liked':
            return 'Love It';
        case 'not_important':
            return 'Not Important';
        case 'wont_watch':
            return "Won't Watch";
        default:
            return '';
    }
}
