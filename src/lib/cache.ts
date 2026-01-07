// Content Cache - In-memory cache with TTL for API responses
// Reduces duplicate API calls across components

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data if still valid
 */
export function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
        cache.delete(key);
        return null;
    }
    return entry.data as T;
}

/**
 * Store data in cache with TTL
 */
export function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    cache.set(key, {
        data,
        expiry: Date.now() + ttlMs,
    });
}

/**
 * Delete cached entry
 */
export function deleteCache(key: string): void {
    cache.delete(key);
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
    cache.clear();
}

/**
 * Execute a cached fetch with request deduplication
 * Prevents multiple identical requests from running simultaneously
 */
export async function cachedFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
    // Check cache first
    const cached = getCached<T>(key);
    if (cached !== null) {
        return cached;
    }

    // Check if request is already in-flight
    const inFlight = inFlightRequests.get(key);
    if (inFlight) {
        return inFlight as Promise<T>;
    }

    // Execute fetch with deduplication
    const fetchPromise = fetchFn()
        .then(data => {
            setCache(key, data, ttlMs);
            return data;
        })
        .finally(() => {
            inFlightRequests.delete(key);
        });

    inFlightRequests.set(key, fetchPromise);
    return fetchPromise;
}

// Cache key generators for consistent key naming
export const CacheKeys = {
    movieDetails: (id: number) => `movie:${id}:details`,
    tvDetails: (id: number) => `tv:${id}:details`,
    watchProviders: (id: number, type: 'movie' | 'tv') => `${type}:${id}:providers`,
    externalIds: (id: number, type: 'movie' | 'tv') => `${type}:${id}:external`,
    omdbRatings: (imdbId: string) => `omdb:${imdbId}`,
    cast: (id: number, type: 'movie' | 'tv') => `${type}:${id}:cast`,
    videos: (id: number, type: 'movie' | 'tv') => `${type}:${id}:videos`,
    contentEnriched: (id: number, type: 'movie' | 'tv') => `${type}:${id}:enriched`,
};
