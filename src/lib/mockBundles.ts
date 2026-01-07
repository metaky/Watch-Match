// Mock bundle data for development
import { BundleWithId } from '@/types/firestore';
import { Timestamp } from 'firebase/firestore';

/**
 * Extended Bundle type with poster paths for UI display
 */
export interface BundleDisplayData extends BundleWithId {
    posterPaths: string[];
}

/**
 * Create a timestamp for a given time ago
 */
function createPastTimestamp(
    value: number,
    unit: 'hours' | 'days' | 'weeks' | 'months'
): Timestamp {
    const now = new Date();
    const multipliers = {
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000,
        weeks: 7 * 24 * 60 * 60 * 1000,
        months: 30 * 24 * 60 * 60 * 1000,
    };
    const pastDate = new Date(now.getTime() - value * multipliers[unit]);
    return Timestamp.fromDate(pastDate);
}

/**
 * Mock bundles matching the Stitch design
 */
export const MOCK_BUNDLES: BundleDisplayData[] = [
    {
        id: 'bundle-1',
        title: 'Friday Night Romcoms',
        createdBy: 'user-1',
        contentIds: ['346698', '508442', '453395', '284054', '339403'], // Barbie, Marry Me, Set It Up, Black Panther, Baby Driver
        createdAt: createPastTimestamp(2, 'hours'),
        posterPaths: [
            'https://image.tmdb.org/t/p/w342/qAZ0pzat24kLdO3o8ejmbLxyOac.jpg', // Crazy Rich Asians
            'https://image.tmdb.org/t/p/w342/2bXbqYdUdNVa8VIWXVrclwHkNK2.jpg', // To All the Boys
            'https://image.tmdb.org/t/p/w342/uXfYYVuniJTlUWPyBExAF3xKzYo.jpg', // The Proposal
        ],
    },
    {
        id: 'bundle-2',
        title: 'Marvel Marathon',
        createdBy: 'user-1',
        // Real Marvel movie IDs from TMDB
        contentIds: ['299536', '299534', '1726', '299537', '10138', '68721', '118340', '284053', '271110'],
        createdAt: createPastTimestamp(1, 'days'),
        posterPaths: [
            'https://image.tmdb.org/t/p/w342/or06FN3Dka5tukK1e9sl16pB3iy.jpg', // Avengers: Endgame
            'https://image.tmdb.org/t/p/w342/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg', // Avengers: IW
            'https://image.tmdb.org/t/p/w342/xLPffWMhMj1l50ND3KchMjYoKmE.jpg', // Iron Man
        ],
    },
    {
        id: 'bundle-3',
        title: 'Showtime Series',
        createdBy: 'user-1',
        contentIds: ['1396', '1399'], // Breaking Bad, Game of Thrones (TV)
        createdAt: createPastTimestamp(3, 'days'),
        posterPaths: [
            'https://image.tmdb.org/t/p/w342/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', // Breaking Bad
        ],
    },
    {
        id: 'bundle-4',
        title: 'Indie Gems',
        createdBy: 'user-1',
        // Real indie movie IDs: Juno, Moonlight, Lady Bird, Little Miss Sunshine, The Florida Project
        contentIds: ['7326', '376867', '391713', '773', '399174'],
        createdAt: createPastTimestamp(1, 'weeks'),
        posterPaths: [
            'https://image.tmdb.org/t/p/w342/pThyQovXQrw2m0s9x82twj48Jq4.jpg', // Juno
            'https://image.tmdb.org/t/p/w342/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', // Moonlight
            'https://image.tmdb.org/t/p/w342/i7EvoNmzNLf2rQOgI5QbX6qe4YU.jpg', // Lady Bird
        ],
    },
    {
        id: 'bundle-5',
        title: 'Sci-Fi Classics',
        createdBy: 'user-1',
        // Real sci-fi movie IDs: Interstellar, Matrix, Inception, Blade Runner 2049, Arrival, Ex Machina
        contentIds: ['157336', '603', '27205', '335984', '329865', '264660'],
        createdAt: createPastTimestamp(2, 'weeks'),
        posterPaths: [
            'https://image.tmdb.org/t/p/w342/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', // Interstellar
            'https://image.tmdb.org/t/p/w342/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', // Matrix
            'https://image.tmdb.org/t/p/w342/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg', // Inception
        ],
    },
    {
        id: 'bundle-6',
        title: '80s Horror',
        createdBy: 'user-1',
        // Real 80s horror movie IDs: The Shining, A Nightmare on Elm Street, The Thing, Friday the 13th, Halloween
        contentIds: ['694', '377', '1091', '755', '948'],
        createdAt: createPastTimestamp(1, 'months'),
        posterPaths: [
            'https://image.tmdb.org/t/p/w342/4c8nEiIMGLnAqLfBKl4QoNZ9tBM.jpg', // The Shining
        ],
    },
];

/**
 * Get mock bundles for the current user
 */
export function getMockBundles(): BundleDisplayData[] {
    return MOCK_BUNDLES;
}
