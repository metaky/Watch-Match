// OMDb API service for aggregated ratings
import { omdbApi } from './api';

export interface OMDbRatings {
    imdbId: string;
    imdbRating: string | null;
    imdbVotes: string | null;
    rottenTomatoes: string | null;
    metacritic: string | null;
    rated: string | null;
    awards: string | null;
    boxOffice: string | null;
}

interface OMDbResponse {
    Response: string;
    Error?: string;
    imdbID?: string;
    imdbRating?: string;
    imdbVotes?: string;
    Ratings?: Array<{ Source: string; Value: string }>;
    Rated?: string;
    Awards?: string;
    BoxOffice?: string;
}

/**
 * Get ratings from OMDb by IMDB ID
 */
export async function getRatingsByImdbId(imdbId: string): Promise<OMDbRatings | null> {
    try {
        const response = await omdbApi.get<OMDbResponse>('/', {
            params: { i: imdbId },
        });

        if (response.data.Response === 'False') {
            console.warn('OMDb error:', response.data.Error);
            return null;
        }

        return parseOMDbResponse(response.data);
    } catch (error) {
        console.error('Failed to fetch OMDb ratings:', error);
        return null;
    }
}

/**
 * Get ratings from OMDb by title and year
 */
export async function getRatingsByTitle(
    title: string,
    year?: string,
    type?: 'movie' | 'series'
): Promise<OMDbRatings | null> {
    try {
        const response = await omdbApi.get<OMDbResponse>('/', {
            params: {
                t: title,
                y: year,
                type: type,
            },
        });

        if (response.data.Response === 'False') {
            console.warn('OMDb error:', response.data.Error);
            return null;
        }

        return parseOMDbResponse(response.data);
    } catch (error) {
        console.error('Failed to fetch OMDb ratings:', error);
        return null;
    }
}

/**
 * Parse OMDb response into our rating format
 */
function parseOMDbResponse(data: OMDbResponse): OMDbRatings {
    const ratings = data.Ratings || [];

    const rottenTomatoes = ratings.find(r => r.Source === 'Rotten Tomatoes')?.Value || null;
    const metacritic = ratings.find(r => r.Source === 'Metacritic')?.Value || null;

    return {
        imdbId: data.imdbID || '',
        imdbRating: data.imdbRating !== 'N/A' ? data.imdbRating || null : null,
        imdbVotes: data.imdbVotes !== 'N/A' ? data.imdbVotes || null : null,
        rottenTomatoes: rottenTomatoes !== 'N/A' ? rottenTomatoes : null,
        metacritic: metacritic !== 'N/A' ? metacritic : null,
        rated: data.Rated !== 'N/A' ? data.Rated || null : null,
        awards: data.Awards !== 'N/A' ? data.Awards || null : null,
        boxOffice: data.BoxOffice !== 'N/A' ? data.BoxOffice || null : null,
    };
}
