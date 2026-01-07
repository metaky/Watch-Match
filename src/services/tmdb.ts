// TMDB API service for movie/TV metadata and watch providers
import { tmdbApi, getImageUrl } from './api';

// Types
export interface MediaItem {
    id: number;
    title: string;
    originalTitle?: string;
    overview: string;
    posterPath: string | null;
    backdropPath: string | null;
    releaseDate: string;
    voteAverage: number;
    voteCount: number;
    popularity: number;
    mediaType: 'movie' | 'tv';
    genreIds: number[];
}

export interface MovieDetails extends MediaItem {
    runtime: number;
    genres: { id: number; name: string }[];
    tagline: string;
    status: string;
    budget: number;
    revenue: number;
    productionCompanies: { id: number; name: string; logoPath: string | null }[];
}

export interface TVDetails extends MediaItem {
    numberOfSeasons: number;
    numberOfEpisodes: number;
    genres: { id: number; name: string }[];
    status: string;
    firstAirDate: string;
    lastAirDate: string;
    episodeRunTime: number[];
    networks: { id: number; name: string; logoPath: string | null }[];
}

export interface WatchProvider {
    providerId: number;
    providerName: string;
    logoPath: string;
    displayPriority: number;
}

export interface WatchProviders {
    flatrate?: WatchProvider[]; // Streaming
    rent?: WatchProvider[];
    buy?: WatchProvider[];
    free?: WatchProvider[];
}

export interface Video {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
}

// Search movies and TV shows
export async function searchMulti(query: string, page = 1): Promise<{
    results: MediaItem[];
    totalPages: number;
    totalResults: number;
}> {
    const response = await tmdbApi.get('/search/multi', {
        params: { query, page, include_adult: false },
    });

    const results = response.data.results
        .filter((item: { media_type: string }) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: Record<string, unknown>) => normalizeMediaItem(item));

    return {
        results,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
    };
}

// Pagination result type
export interface PaginatedResult<T> {
    results: T[];
    page: number;
    totalPages: number;
    totalResults: number;
}

// Get trending movies and TV shows with pagination support
export async function getTrending(
    mediaType: 'movie' | 'tv' | 'all' = 'all',
    timeWindow: 'day' | 'week' = 'week',
    page = 1
): Promise<PaginatedResult<MediaItem>> {
    const response = await tmdbApi.get(`/trending/${mediaType}/${timeWindow}`, {
        params: { page },
    });
    return {
        results: response.data.results.map((item: Record<string, unknown>) => normalizeMediaItem(item)),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
    };
}

// Get popular movies
export async function getPopularMovies(page = 1): Promise<MediaItem[]> {
    const response = await tmdbApi.get('/movie/popular', { params: { page } });
    return response.data.results.map((item: Record<string, unknown>) => normalizeMediaItem(item, 'movie'));
}

// Get popular TV shows
export async function getPopularTV(page = 1): Promise<MediaItem[]> {
    const response = await tmdbApi.get('/tv/popular', { params: { page } });
    return response.data.results.map((item: Record<string, unknown>) => normalizeMediaItem(item, 'tv'));
}

// Discover media with sorting
export async function discoverMedia(
    mediaType: 'movie' | 'tv',
    sortBy: 'popularity.desc' | 'primary_release_date.desc' | 'vote_average.desc' = 'popularity.desc',
    page = 1,
    filters: Record<string, any> = {}
): Promise<PaginatedResult<MediaItem>> {
    const params: Record<string, any> = {
        page,
        sort_by: sortBy,
        include_adult: false,
        'vote_count.gte': 100, // Filter out noise
        ...filters,
    };

    // If sorting by latest, ensure we don't show future content (unless desired)
    // Actually "Latest Added" usually means released. 
    // TMDB "primary_release_date.desc" includes future. 
    if (sortBy === 'primary_release_date.desc') {
        const today = new Date().toISOString().split('T')[0];
        params['primary_release_date.lte'] = today;
        params['air_date.lte'] = today;
    }

    const response = await tmdbApi.get(`/discover/${mediaType}`, { params });

    return {
        results: response.data.results.map((item: Record<string, unknown>) => normalizeMediaItem(item, mediaType)),
        page: response.data.page,
        totalPages: response.data.total_pages,
        totalResults: response.data.total_results,
    };
}

// Get movie details
export async function getMovieDetails(id: number): Promise<MovieDetails> {
    const response = await tmdbApi.get(`/movie/${id}`);
    return {
        ...normalizeMediaItem(response.data, 'movie'),
        runtime: response.data.runtime,
        genres: response.data.genres,
        tagline: response.data.tagline,
        status: response.data.status,
        budget: response.data.budget,
        revenue: response.data.revenue,
        productionCompanies: response.data.production_companies?.map((c: Record<string, unknown>) => ({
            id: c.id,
            name: c.name,
            logoPath: c.logo_path,
        })) || [],
    } as MovieDetails;
}

// Get TV show details
export async function getTVDetails(id: number): Promise<TVDetails> {
    const response = await tmdbApi.get(`/tv/${id}`);
    return {
        ...normalizeMediaItem(response.data, 'tv'),
        numberOfSeasons: response.data.number_of_seasons,
        numberOfEpisodes: response.data.number_of_episodes,
        genres: response.data.genres,
        status: response.data.status,
        firstAirDate: response.data.first_air_date,
        lastAirDate: response.data.last_air_date,
        episodeRunTime: response.data.episode_run_time || [],
        networks: response.data.networks?.map((n: Record<string, unknown>) => ({
            id: n.id,
            name: n.name,
            logoPath: n.logo_path,
        })) || [],
    } as TVDetails;
}

// Get watch providers for a movie or TV show
export async function getWatchProviders(
    id: number,
    mediaType: 'movie' | 'tv',
    region = 'US'
): Promise<WatchProviders | null> {
    const response = await tmdbApi.get(`/${mediaType}/${id}/watch/providers`);
    const regionData = response.data.results?.[region];

    if (!regionData) return null;

    const mapProviders = (providers: Record<string, unknown>[]): WatchProvider[] =>
        providers?.map((p: Record<string, unknown>) => ({
            providerId: p.provider_id as number,
            providerName: p.provider_name as string,
            logoPath: getImageUrl(p.logo_path as string, 'small') || '',
            displayPriority: p.display_priority as number,
        })) || [];

    return {
        flatrate: mapProviders(regionData.flatrate),
        rent: mapProviders(regionData.rent),
        buy: mapProviders(regionData.buy),
        free: mapProviders(regionData.free),
    };
}

// Get videos (trailers, teasers, etc.)
export async function getVideos(id: number, mediaType: 'movie' | 'tv'): Promise<Video[]> {
    const response = await tmdbApi.get(`/${mediaType}/${id}/videos`);

    return response.data.results
        .filter((v: Record<string, unknown>) => v.site === 'YouTube')
        .map((v: Record<string, unknown>) => ({
            id: v.id,
            key: v.key,
            name: v.name,
            site: v.site,
            type: v.type,
            official: v.official,
        }));
}

// Get official trailer
export async function getTrailer(id: number, mediaType: 'movie' | 'tv'): Promise<Video | null> {
    const videos = await getVideos(id, mediaType);

    // Prefer official trailer, then any trailer, then teaser
    const trailer =
        videos.find(v => v.type === 'Trailer' && v.official) ||
        videos.find(v => v.type === 'Trailer') ||
        videos.find(v => v.type === 'Teaser') ||
        videos[0];

    return trailer || null;
}

// Get external IDs (IMDb, etc.) for a movie or TV show
export async function getExternalIds(
    id: number,
    mediaType: 'movie' | 'tv'
): Promise<{ imdbId: string | null }> {
    try {
        const response = await tmdbApi.get(`/${mediaType}/${id}/external_ids`);
        return {
            imdbId: response.data.imdb_id || null,
        };
    } catch (error) {
        console.error('Failed to fetch external IDs:', error);
        return { imdbId: null };
    }
}

// Cast member from TMDB API
export interface TMDBCastMember {
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
}

// Get cast for a movie or TV show
export async function getCast(
    id: number,
    mediaType: 'movie' | 'tv',
    limit = 10
): Promise<TMDBCastMember[]> {
    try {
        const response = await tmdbApi.get(`/${mediaType}/${id}/credits`);
        const cast = response.data.cast || [];

        return cast.slice(0, limit).map((member: Record<string, unknown>) => ({
            id: member.id as number,
            name: member.name as string,
            character: member.character as string,
            profilePath: member.profile_path as string | null,
        }));
    } catch (error) {
        console.error('Failed to fetch cast:', error);
        return [];
    }
}

// Helper to normalize API response to MediaItem
function normalizeMediaItem(item: Record<string, unknown>, forceType?: 'movie' | 'tv'): MediaItem {
    const isTV = forceType === 'tv' || item.media_type === 'tv' || 'first_air_date' in item;

    return {
        id: item.id as number,
        title: (isTV ? item.name : item.title) as string,
        originalTitle: (isTV ? item.original_name : item.original_title) as string,
        overview: (item.overview as string) || '',
        posterPath: item.poster_path as string | null,
        backdropPath: item.backdrop_path as string | null,
        releaseDate: (isTV ? item.first_air_date : item.release_date) as string,
        voteAverage: item.vote_average as number,
        voteCount: item.vote_count as number,
        popularity: item.popularity as number,
        mediaType: isTV ? 'tv' : 'movie',
        genreIds: (item.genre_ids as number[]) || [],
    };
}
