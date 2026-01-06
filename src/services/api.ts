// Centralized API configuration and utilities
import axios from 'axios';

// TMDB Configuration
export const TMDB_CONFIG = {
    baseUrl: process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3',
    apiKey: process.env.NEXT_PUBLIC_TMDB_API_KEY || '',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    posterSizes: {
        small: 'w185',
        medium: 'w342',
        large: 'w500',
        original: 'original',
    },
    backdropSizes: {
        small: 'w300',
        medium: 'w780',
        large: 'w1280',
        original: 'original',
    },
};

// OMDb Configuration
export const OMDB_CONFIG = {
    baseUrl: process.env.NEXT_PUBLIC_OMDB_BASE_URL || 'https://www.omdbapi.com',
    apiKey: process.env.NEXT_PUBLIC_OMDB_API_KEY || '',
};

// Create axios instances with default config
export const tmdbApi = axios.create({
    baseURL: TMDB_CONFIG.baseUrl,
    params: {
        api_key: TMDB_CONFIG.apiKey,
    },
});

export const omdbApi = axios.create({
    baseURL: OMDB_CONFIG.baseUrl,
    params: {
        apikey: OMDB_CONFIG.apiKey,
    },
});

// Helper to get full image URL
export function getImageUrl(
    path: string | null,
    size: 'small' | 'medium' | 'large' | 'original' = 'medium',
    type: 'poster' | 'backdrop' = 'poster'
): string | null {
    if (!path) return null;

    const sizeValue = type === 'poster'
        ? TMDB_CONFIG.posterSizes[size]
        : TMDB_CONFIG.backdropSizes[size];

    return `${TMDB_CONFIG.imageBaseUrl}/${sizeValue}${path}`;
}

// YouTube embed URL generator
export function getYouTubeEmbedUrl(videoKey: string): string {
    return `https://www.youtube.com/embed/${videoKey}`;
}

export function getYouTubeThumbnail(videoKey: string): string {
    return `https://img.youtube.com/vi/${videoKey}/mqdefault.jpg`;
}
