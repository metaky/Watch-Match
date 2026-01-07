// Cached TMDB Service - Optimized API calls with caching and append_to_response
// Reduces multiple API calls into single requests where possible

import { tmdbApi, getImageUrl, TMDB_CONFIG } from '@/services/api';
import { cachedFetch, CacheKeys, setCache, getCached } from '@/lib/cache';
import type {
    MovieDetails,
    TVDetails,
    WatchProvider,
    WatchProviders,
    Video
} from '@/services/tmdb';

// Extended details response that includes appended data
interface MovieDetailsExtended extends MovieDetails {
    watchProviders: WatchProviders | null;
    externalIds: { imdbId: string | null };
    videos: Video[];
    cast: CastMember[];
}

interface TVDetailsExtended extends TVDetails {
    watchProviders: WatchProviders | null;
    externalIds: { imdbId: string | null };
    videos: Video[];
    cast: CastMember[];
}

interface CastMember {
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
}

/**
 * Get full movie details with providers, external IDs, videos, and credits in ONE API call
 * Uses append_to_response to reduce 5 API calls to 1
 */
export async function getMovieDetailsEnriched(id: number, region = 'US'): Promise<MovieDetailsExtended> {
    const cacheKey = CacheKeys.contentEnriched(id, 'movie');

    return cachedFetch(cacheKey, async () => {
        const response = await tmdbApi.get(`/movie/${id}`, {
            params: {
                append_to_response: 'watch/providers,external_ids,credits,videos',
            },
        });

        const data = response.data;

        // Parse watch providers for region
        const regionProviders = data['watch/providers']?.results?.[region];
        const watchProviders = regionProviders ? parseWatchProviders(regionProviders) : null;

        // Parse external IDs
        const externalIds = {
            imdbId: data.external_ids?.imdb_id || null,
        };

        // Parse videos (YouTube only)
        const videos: Video[] = (data.videos?.results || [])
            .filter((v: any) => v.site === 'YouTube')
            .map((v: any) => ({
                id: v.id,
                key: v.key,
                name: v.name,
                site: v.site,
                type: v.type,
                official: v.official,
            }));

        // Parse cast (top 10)
        const cast: CastMember[] = (data.credits?.cast || [])
            .slice(0, 10)
            .map((c: any) => ({
                id: c.id,
                name: c.name,
                character: c.character,
                profilePath: c.profile_path,
            }));

        return {
            id: data.id,
            title: data.title,
            originalTitle: data.original_title,
            overview: data.overview || '',
            posterPath: data.poster_path,
            backdropPath: data.backdrop_path,
            releaseDate: data.release_date,
            voteAverage: data.vote_average,
            voteCount: data.vote_count,
            popularity: data.popularity,
            mediaType: 'movie' as const,
            genreIds: data.genre_ids || [],
            runtime: data.runtime,
            genres: data.genres || [],
            tagline: data.tagline,
            status: data.status,
            budget: data.budget,
            revenue: data.revenue,
            productionCompanies: data.production_companies?.map((c: any) => ({
                id: c.id,
                name: c.name,
                logoPath: c.logo_path,
            })) || [],
            watchProviders,
            externalIds,
            videos,
            cast,
        };
    });
}

/**
 * Get full TV details with providers, external IDs, videos, and credits in ONE API call
 */
export async function getTVDetailsEnriched(id: number, region = 'US'): Promise<TVDetailsExtended> {
    const cacheKey = CacheKeys.contentEnriched(id, 'tv');

    return cachedFetch(cacheKey, async () => {
        const response = await tmdbApi.get(`/tv/${id}`, {
            params: {
                append_to_response: 'watch/providers,external_ids,credits,videos',
            },
        });

        const data = response.data;

        // Parse watch providers for region
        const regionProviders = data['watch/providers']?.results?.[region];
        const watchProviders = regionProviders ? parseWatchProviders(regionProviders) : null;

        // Parse external IDs
        const externalIds = {
            imdbId: data.external_ids?.imdb_id || null,
        };

        // Parse videos (YouTube only)
        const videos: Video[] = (data.videos?.results || [])
            .filter((v: any) => v.site === 'YouTube')
            .map((v: any) => ({
                id: v.id,
                key: v.key,
                name: v.name,
                site: v.site,
                type: v.type,
                official: v.official,
            }));

        // Parse cast (top 10)
        const cast: CastMember[] = (data.credits?.cast || [])
            .slice(0, 10)
            .map((c: any) => ({
                id: c.id,
                name: c.name,
                character: c.character,
                profilePath: c.profile_path,
            }));

        return {
            id: data.id,
            title: data.name,
            originalTitle: data.original_name,
            overview: data.overview || '',
            posterPath: data.poster_path,
            backdropPath: data.backdrop_path,
            releaseDate: data.first_air_date,
            voteAverage: data.vote_average,
            voteCount: data.vote_count,
            popularity: data.popularity,
            mediaType: 'tv' as const,
            genreIds: data.genre_ids || [],
            numberOfSeasons: data.number_of_seasons,
            numberOfEpisodes: data.number_of_episodes,
            genres: data.genres || [],
            status: data.status,
            firstAirDate: data.first_air_date,
            lastAirDate: data.last_air_date,
            episodeRunTime: data.episode_run_time || [],
            networks: data.networks?.map((n: any) => ({
                id: n.id,
                name: n.name,
                logoPath: n.logo_path,
            })) || [],
            watchProviders,
            externalIds,
            videos,
            cast,
        };
    });
}

/**
 * Get enriched details for any content type
 */
export async function getContentDetailsEnriched(
    id: number,
    mediaType: 'movie' | 'tv',
    region = 'US'
): Promise<MovieDetailsExtended | TVDetailsExtended> {
    if (mediaType === 'movie') {
        return getMovieDetailsEnriched(id, region);
    }
    return getTVDetailsEnriched(id, region);
}

/**
 * Get trailer from enriched details (uses cached videos if available)
 */
export function getTrailerFromVideos(videos: Video[]): Video | null {
    return (
        videos.find(v => v.type === 'Trailer' && v.official) ||
        videos.find(v => v.type === 'Trailer') ||
        videos.find(v => v.type === 'Teaser') ||
        videos[0] ||
        null
    );
}

// Helper to parse watch providers from API response
function parseWatchProviders(regionData: any): WatchProviders {
    const mapProviders = (providers: any[]): WatchProvider[] =>
        providers?.map((p: any) => ({
            providerId: p.provider_id,
            providerName: p.provider_name,
            logoPath: getImageUrl(p.logo_path, 'small') || '',
            displayPriority: p.display_priority,
        })) || [];

    return {
        flatrate: mapProviders(regionData.flatrate),
        rent: mapProviders(regionData.rent),
        buy: mapProviders(regionData.buy),
        free: mapProviders(regionData.free),
    };
}
