// Mock content data for bundle detail view
import type { ContentDetailData } from '@/types/content';

/**
 * Bundle-specific rating for swipe actions
 */
export type BundleRating = 'yes' | 'not_now' | 'never';

/**
 * Content item within a bundle with additional bundle-specific data
 */
export interface BundleContentItem extends ContentDetailData {
    /** Who added this item to the bundle */
    addedBy: 'user' | 'partner';
    /** Whether the item has been watched by both users */
    watched?: boolean;
}

// Use reliable placeholder images for mock data
// In production, these would come from TMDB API
const POSTER_PLACEHOLDERS = [
    'https://picsum.photos/seed/romcom1/300/450',
    'https://picsum.photos/seed/romcom2/300/450',
    'https://picsum.photos/seed/romcom3/300/450',
    'https://picsum.photos/seed/romcom4/300/450',
    'https://picsum.photos/seed/romcom5/300/450',
    'https://picsum.photos/seed/romcom6/300/450',
    'https://picsum.photos/seed/romcom7/300/450',
    'https://picsum.photos/seed/romcom8/300/450',
    'https://picsum.photos/seed/romcom9/300/450',
    'https://picsum.photos/seed/romcom10/300/450',
    'https://picsum.photos/seed/romcom11/300/450',
    'https://picsum.photos/seed/romcom12/300/450',
];

/**
 * Mock content items for the "Friday Night Romcoms" bundle
 */
export const MOCK_BUNDLE_CONTENT: Record<string, BundleContentItem[]> = {
    'bundle-1': [
        {
            id: 313369,
            mediaType: 'movie',
            title: 'The Big Sick',
            year: '2017',
            runtime: '2h 0m',
            genre: 'Romance',
            posterUrl: POSTER_PLACEHOLDERS[0],
            rottenTomatoes: '98%',
            imdbRating: '7.5',
            metacritic: '86',
            streamingProvider: { id: 'amazon_prime', name: 'Prime Video' },
            partnerStatus: 'liked',
            overview: 'Pakistan-born comedian Kumail Nanjiani and grad student Emily Gardner fall in love but struggle as their cultures clash. When Emily contracts a mysterious illness, Kumail finds himself forced to face her feisty parents, his family\'s expectations, and his true feelings.',
            backdropUrl: null,
            trailerKey: 'tCqNKBVnOqc',
            mpaaRating: 'R',
            watchProviders: {
                flatrate: [{ id: 'amazon_prime', name: 'Prime Video' }],
                rent: [],
                buy: [],
            },
            userRating: null,
            cast: [
                { id: 1, name: 'Kumail Nanjiani', character: 'Kumail', profilePath: null },
                { id: 2, name: 'Zoe Kazan', character: 'Emily', profilePath: null },
            ],
            addedBy: 'partner',
            watched: true,
        },
        {
            id: 508442,
            mediaType: 'movie',
            title: 'Crazy Rich Asians',
            year: '2018',
            runtime: '2h 1m',
            genre: 'Comedy',
            posterUrl: POSTER_PLACEHOLDERS[1],
            rottenTomatoes: '91%',
            imdbRating: '7.0',
            metacritic: '74',
            streamingProvider: { id: 'max', name: 'Max' },
            partnerStatus: null,
            overview: 'An economics professor accompanies her boyfriend to Singapore for his best friend\'s wedding, only to discover that not only is he the scion of one of the country\'s wealthiest families, but also one of its most sought-after bachelors.',
            backdropUrl: null,
            trailerKey: 'ZQ-YX-5bAs0',
            mpaaRating: 'PG-13',
            watchProviders: {
                flatrate: [{ id: 'max', name: 'Max' }],
                rent: [],
                buy: [],
            },
            userRating: null,
            cast: [
                { id: 3, name: 'Constance Wu', character: 'Rachel Chu', profilePath: null },
                { id: 4, name: 'Henry Golding', character: 'Nick Young', profilePath: null },
            ],
            addedBy: 'user',
        },
        {
            id: 284054,
            mediaType: 'movie',
            title: 'The Proposal',
            year: '2009',
            runtime: '1h 48m',
            genre: 'Romance',
            posterUrl: POSTER_PLACEHOLDERS[2],
            rottenTomatoes: '44%',
            imdbRating: '6.7',
            metacritic: '48',
            streamingProvider: { id: 'disney_plus', name: 'Disney+' },
            partnerStatus: 'liked',
            overview: 'When she learns she\'s in danger of losing her visa status and being deported, high-powered book editor Margaret Tate forces her assistant Andrew Paxton to marry her.',
            backdropUrl: null,
            trailerKey: 'qj6IlBMJgjQ',
            mpaaRating: 'PG-13',
            watchProviders: {
                flatrate: [{ id: 'disney_plus', name: 'Disney+' }],
                rent: [],
                buy: [],
            },
            userRating: null,
            cast: [
                { id: 5, name: 'Sandra Bullock', character: 'Margaret Tate', profilePath: null },
                { id: 6, name: 'Ryan Reynolds', character: 'Andrew Paxton', profilePath: null },
            ],
            addedBy: 'partner',
            watched: false,
        },
        {
            id: 453395,
            mediaType: 'movie',
            title: 'To All the Boys I\'ve Loved Before',
            year: '2018',
            runtime: '1h 40m',
            genre: 'Romance',
            posterUrl: POSTER_PLACEHOLDERS[3],
            rottenTomatoes: '96%',
            imdbRating: '7.1',
            metacritic: '60',
            streamingProvider: { id: 'netflix', name: 'Netflix' },
            partnerStatus: 'not_important',
            overview: 'Lara Jean\'s love life goes from imaginary to out of control when her secret letters to every boy she\'s ever fallen for are mysteriously mailed out.',
            backdropUrl: null,
            trailerKey: '555wJOYIqXM',
            mpaaRating: 'PG-13',
            watchProviders: {
                flatrate: [{ id: 'netflix', name: 'Netflix' }],
                rent: [],
                buy: [],
            },
            userRating: null,
            cast: [
                { id: 7, name: 'Lana Condor', character: 'Lara Jean Covey', profilePath: null },
                { id: 8, name: 'Noah Centineo', character: 'Peter Kavinsky', profilePath: null },
            ],
            addedBy: 'user',
        },
        {
            id: 332562,
            mediaType: 'movie',
            title: 'A Star Is Born',
            year: '2018',
            runtime: '2h 16m',
            genre: 'Drama',
            posterUrl: POSTER_PLACEHOLDERS[4],
            rottenTomatoes: '90%',
            imdbRating: '7.6',
            metacritic: '88',
            streamingProvider: { id: 'max', name: 'Max' },
            partnerStatus: 'liked',
            overview: 'Seasoned musician Jackson Maine discovers — and falls in love with — struggling artist Ally. She has just about given up on her dream to make it big as a singer until Jack coaxes her into the spotlight.',
            backdropUrl: null,
            trailerKey: 'nSbzyEJ8X9E',
            mpaaRating: 'R',
            watchProviders: {
                flatrate: [{ id: 'max', name: 'Max' }],
                rent: [],
                buy: [],
            },
            userRating: null,
            cast: [
                { id: 9, name: 'Lady Gaga', character: 'Ally', profilePath: null },
                { id: 10, name: 'Bradley Cooper', character: 'Jackson Maine', profilePath: null },
            ],
            addedBy: 'partner',
            watched: true,
        },
        {
            id: 194662,
            mediaType: 'movie',
            title: 'Birdman',
            year: '2014',
            runtime: '1h 59m',
            genre: 'Drama',
            posterUrl: POSTER_PLACEHOLDERS[5],
            rottenTomatoes: '91%',
            imdbRating: '7.7',
            metacritic: '88',
            streamingProvider: { id: 'hulu', name: 'Hulu' },
            partnerStatus: null,
            overview: 'A washed-up super hero actor attempts to revive his fading career by writing, directing, and starring in a Broadway production.',
            backdropUrl: null,
            trailerKey: 'uJfLoE6hanc',
            mpaaRating: 'R',
            watchProviders: {
                flatrate: [{ id: 'hulu', name: 'Hulu' }],
                rent: [],
                buy: [],
            },
            userRating: null,
            cast: [
                { id: 11, name: 'Michael Keaton', character: 'Riggan Thomson', profilePath: null },
                { id: 12, name: 'Emma Stone', character: 'Sam Thomson', profilePath: null },
            ],
            addedBy: 'user',
        },
        {
            id: 136797,
            mediaType: 'movie',
            title: 'About Time',
            year: '2013',
            runtime: '2h 3m',
            genre: 'Romance',
            posterUrl: POSTER_PLACEHOLDERS[6],
            rottenTomatoes: '69%',
            imdbRating: '7.8',
            metacritic: '55',
            streamingProvider: { id: 'netflix', name: 'Netflix' },
            partnerStatus: 'liked',
            overview: 'At the age of 21, Tim discovers he can travel in time and change what happens and has happened in his own life. His decision to make his world a better place by getting a girlfriend turns out not to be as easy as you might think.',
            backdropUrl: null,
            trailerKey: 'T7A810duHvw',
            mpaaRating: 'R',
            watchProviders: {
                flatrate: [{ id: 'netflix', name: 'Netflix' }],
                rent: [],
                buy: [],
            },
            userRating: null,
            cast: [
                { id: 13, name: 'Domhnall Gleeson', character: 'Tim Lake', profilePath: null },
                { id: 14, name: 'Rachel McAdams', character: 'Mary', profilePath: null },
            ],
            addedBy: 'partner',
            watched: false,
        },
        {
            id: 413594,
            mediaType: 'movie',
            title: 'Set It Up',
            year: '2018',
            runtime: '1h 45m',
            genre: 'Comedy',
            posterUrl: POSTER_PLACEHOLDERS[7],
            rottenTomatoes: '92%',
            imdbRating: '6.5',
            metacritic: '64',
            streamingProvider: { id: 'netflix', name: 'Netflix' },
            partnerStatus: null,
            overview: 'Two overworked and underpaid assistants come up with a plan to get their bosses off their backs by setting them up with each other.',
            backdropUrl: null,
            trailerKey: 'r0c3u2vHKxg',
            mpaaRating: 'TV-MA',
            watchProviders: {
                flatrate: [{ id: 'netflix', name: 'Netflix' }],
                rent: [],
                buy: [],
            },
            userRating: null,
            cast: [
                { id: 15, name: 'Zoey Deutch', character: 'Harper', profilePath: null },
                { id: 16, name: 'Glen Powell', character: 'Charlie', profilePath: null },
            ],
            addedBy: 'partner',
        },
        {
            id: 399579,
            mediaType: 'movie',
            title: 'Always Be My Maybe',
            year: '2019',
            runtime: '1h 41m',
            genre: 'Comedy',
            posterUrl: POSTER_PLACEHOLDERS[8],
            rottenTomatoes: '90%',
            imdbRating: '6.8',
            metacritic: '64',
            streamingProvider: { id: 'netflix', name: 'Netflix' },
            partnerStatus: 'liked',
            overview: 'Childhood sweethearts reunite after 15 years apart and grapple with their long-buried feelings for each other.',
            backdropUrl: null,
            trailerKey: 'HgJbWM__muk',
            mpaaRating: 'PG-13',
            watchProviders: {
                flatrate: [{ id: 'netflix', name: 'Netflix' }],
                rent: [],
                buy: [],
            },
            userRating: null,
            cast: [
                { id: 17, name: 'Ali Wong', character: 'Sasha Tran', profilePath: null },
                { id: 18, name: 'Randall Park', character: 'Marcus Kim', profilePath: null },
            ],
            addedBy: 'user',
        },
        {
            id: 568332,
            mediaType: 'movie',
            title: 'Palm Springs',
            year: '2020',
            runtime: '1h 30m',
            genre: 'Comedy',
            posterUrl: POSTER_PLACEHOLDERS[9],
            rottenTomatoes: '94%',
            imdbRating: '7.4',
            metacritic: '83',
            streamingProvider: { id: 'hulu', name: 'Hulu' },
            partnerStatus: null,
            overview: 'When carefree Nyles and reluctant maid of honor Sarah have a chance encounter at a Palm Springs wedding, things get complicated when they find themselves unable to escape the venue, themselves, or each other.',
            backdropUrl: null,
            trailerKey: 'CpBLtXwlwDc',
            mpaaRating: 'R',
            watchProviders: {
                flatrate: [{ id: 'hulu', name: 'Hulu' }],
                rent: [],
                buy: [],
            },
            userRating: null,
            cast: [
                { id: 19, name: 'Andy Samberg', character: 'Nyles', profilePath: null },
                { id: 20, name: 'Cristin Milioti', character: 'Sarah', profilePath: null },
            ],
            addedBy: 'partner',
        },
        {
            id: 466272,
            mediaType: 'movie',
            title: 'Long Shot',
            year: '2019',
            runtime: '2h 5m',
            genre: 'Comedy',
            posterUrl: POSTER_PLACEHOLDERS[10],
            rottenTomatoes: '81%',
            imdbRating: '6.8',
            metacritic: '60',
            streamingProvider: { id: 'amazon_prime', name: 'Prime Video' },
            partnerStatus: 'not_important',
            overview: 'Fred Flarsky is a gifted and free-spirited journalist with an affinity for trouble. Charlotte Field is one of the most influential women in the world. Smart, sophisticated, and accomplished, she\'s a powerhouse diplomat with a talent for inspiring people.',
            backdropUrl: null,
            trailerKey: '8rOK2h1CA_4',
            mpaaRating: 'R',
            watchProviders: {
                flatrate: [{ id: 'amazon_prime', name: 'Prime Video' }],
                rent: [],
                buy: [],
            },
            userRating: null,
            cast: [
                { id: 21, name: 'Seth Rogen', character: 'Fred Flarsky', profilePath: null },
                { id: 22, name: 'Charlize Theron', character: 'Charlotte Field', profilePath: null },
            ],
            addedBy: 'user',
        },
        {
            id: 337167,
            mediaType: 'movie',
            title: 'Fifty Shades Freed',
            year: '2018',
            runtime: '1h 45m',
            genre: 'Drama',
            posterUrl: POSTER_PLACEHOLDERS[11],
            rottenTomatoes: '11%',
            imdbRating: '4.5',
            metacritic: '32',
            streamingProvider: { id: 'peacock', name: 'Peacock' },
            partnerStatus: 'wont_watch',
            overview: 'Believing they have left behind shadowy figures from their past, newlyweds Christian and Ana fully embrace an inextricable connection and shared life of luxury.',
            backdropUrl: null,
            trailerKey: 'pHl4ywPF0Lc',
            mpaaRating: 'R',
            watchProviders: {
                flatrate: [{ id: 'peacock', name: 'Peacock' }],
                rent: [],
                buy: [],
            },
            userRating: null,
            cast: [
                { id: 23, name: 'Dakota Johnson', character: 'Anastasia Grey', profilePath: null },
                { id: 24, name: 'Jamie Dornan', character: 'Christian Grey', profilePath: null },
            ],
            addedBy: 'partner',
        },
    ],
};

/**
 * Get mock content for a specific bundle
 */
export function getMockBundleContent(bundleId: string): BundleContentItem[] {
    return MOCK_BUNDLE_CONTENT[bundleId] || [];
}

/**
 * Get number of matches in a bundle (mock)
 */
export function getMockBundleMatchCount(bundleId: string): number {
    const content = MOCK_BUNDLE_CONTENT[bundleId] || [];
    // Count items where partner liked and we assume user would also like
    return content.filter(item => item.partnerStatus === 'liked').length;
}

/**
 * Get matched items for a bundle (items where both users said "yes")
 * For mock purposes, we filter items where partner liked (assuming user also likes)
 */
export function getMockBundleMatches(bundleId: string): BundleContentItem[] {
    const content = MOCK_BUNDLE_CONTENT[bundleId] || [];
    // Filter items where partner liked - simulating mutual match
    return content.filter(item => item.partnerStatus === 'liked');
}
