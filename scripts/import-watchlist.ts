#!/usr/bin/env npx ts-node
/**
 * Watchlist Import Script
 * 
 * Imports titles from a Google Takeout CSV into Watch Match's Firestore.
 * 
 * Usage:
 *   npx ts-node scripts/import-watchlist.ts --csv=path/to/watchlist.csv [--dry-run] [--user-id=UID]
 * 
 * The CSV should have columns: "Added Time" and "Title"
 * The script will search TMDB for each title and import it as a 'liked' interaction.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

// Firebase Admin SDK for server-side Firestore access
import admin from 'firebase-admin';

// Load environment variables from .env.local
import * as dotenv from 'dotenv';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ============================================
// Configuration
// ============================================

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Rate limiting: TMDB allows ~40 requests per 10 seconds
const REQUEST_DELAY_MS = 300; // ~3.3 requests per second to be safe

// ============================================
// Types
// ============================================

interface CSVRow {
    'Added Time'?: string;
    'Title'?: string;
    // Alternative lowercase column names (some CSVs use different casing)
    'added time'?: string;
    'title'?: string;
}

interface TMDBSearchResult {
    id: number;
    title?: string;        // For movies
    name?: string;         // For TV shows
    media_type: 'movie' | 'tv';
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    popularity: number;
    poster_path: string | null;
    overview: string;
}

interface ImportResult {
    title: string;
    status: 'imported' | 'skipped' | 'not_found' | 'error';
    tmdbId?: number;
    mediaType?: 'movie' | 'tv';
    matchedTitle?: string;
    error?: string;
}

// ============================================
// TMDB API Functions
// ============================================

async function searchTMDB(query: string): Promise<TMDBSearchResult[]> {
    if (!TMDB_API_KEY) {
        throw new Error('TMDB API key not found in environment');
    }

    const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Filter to only movies and TV shows
    return data.results.filter(
        (item: TMDBSearchResult) => item.media_type === 'movie' || item.media_type === 'tv'
    );
}

function getBestMatch(query: string, results: TMDBSearchResult[]): TMDBSearchResult | null {
    if (results.length === 0) return null;

    const queryLower = query.toLowerCase().trim();

    // First, try exact title match (case-insensitive)
    const exactMatch = results.find(r => {
        const title = (r.title || r.name || '').toLowerCase().trim();
        return title === queryLower;
    });
    if (exactMatch) return exactMatch;

    // Next, try starts-with match
    const startsWithMatch = results.find(r => {
        const title = (r.title || r.name || '').toLowerCase().trim();
        return title.startsWith(queryLower) || queryLower.startsWith(title);
    });
    if (startsWithMatch) return startsWithMatch;

    // Otherwise, return the most popular result (first one is usually most popular)
    return results[0];
}

// ============================================
// Firebase Setup
// ============================================

function initializeFirebase() {
    // Check for service account credentials
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        path.resolve(__dirname, '../service-account.json');

    if (fs.existsSync(serviceAccountPath)) {
        // Use service account file
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase initialized with service account');
    } else {
        // Try using default credentials (works in GCP environments)
        try {
            admin.initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });
            console.log('✅ Firebase initialized with default credentials');
        } catch (error) {
            console.error('❌ Failed to initialize Firebase. Please provide a service account file.');
            console.error('   Set GOOGLE_APPLICATION_CREDENTIALS environment variable or');
            console.error('   place service-account.json in the project root.');
            process.exit(1);
        }
    }
}

// ============================================
// Import Logic
// ============================================

async function importTitle(
    db: admin.firestore.Firestore,
    userId: string,
    title: string,
    dryRun: boolean
): Promise<ImportResult> {
    try {
        // Search TMDB
        const results = await searchTMDB(title);
        const match = getBestMatch(title, results);

        if (!match) {
            return { title, status: 'not_found' };
        }

        const tmdbId = match.id.toString();
        const mediaType = match.media_type;
        const matchedTitle = match.title || match.name || title;

        // Check if already exists
        const docId = `${userId}_${tmdbId}`;
        const docRef = db.collection('user_interactions').doc(docId);
        const existing = await docRef.get();

        if (existing.exists) {
            return {
                title,
                status: 'skipped',
                tmdbId: match.id,
                mediaType,
                matchedTitle,
            };
        }

        if (dryRun) {
            return {
                title,
                status: 'imported',  // Would be imported
                tmdbId: match.id,
                mediaType,
                matchedTitle,
            };
        }

        // Create the interaction document
        await docRef.set({
            userId,
            tmdbId,
            contentType: mediaType,
            status: 'liked',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            meta: {
                title: matchedTitle,
                posterPath: match.poster_path,
                voteAverage: match.vote_average || 0,
                popularity: match.popularity || 0,
                releaseDate: match.release_date || match.first_air_date || null,
            },
        });

        return {
            title,
            status: 'imported',
            tmdbId: match.id,
            mediaType,
            matchedTitle,
        };

    } catch (error) {
        return {
            title,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Main
// ============================================

async function main() {
    const args = process.argv.slice(2);

    // Parse arguments
    const csvArg = args.find(a => a.startsWith('--csv='));
    const dryRun = args.includes('--dry-run');
    const userIdArg = args.find(a => a.startsWith('--user-id='));

    if (!csvArg) {
        console.error('Usage: npx ts-node scripts/import-watchlist.ts --csv=path/to/file.csv [--dry-run] [--user-id=UID]');
        process.exit(1);
    }

    const csvPath = csvArg.replace('--csv=', '');
    const userId = userIdArg?.replace('--user-id=', '');

    // Validate CSV file exists
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ CSV file not found: ${csvPath}`);
        process.exit(1);
    }

    // Check TMDB API key
    if (!TMDB_API_KEY) {
        console.error('❌ TMDB API key not found. Make sure .env.local has NEXT_PUBLIC_TMDB_API_KEY');
        process.exit(1);
    }

    console.log('🎬 Watch Match - Watchlist Import Script');
    console.log('=========================================');
    console.log(`📄 CSV File: ${csvPath}`);
    console.log(`🔑 TMDB API Key: ${TMDB_API_KEY.substring(0, 8)}...`);
    console.log(`🏃 Dry Run: ${dryRun ? 'Yes (no changes will be made)' : 'No'}`);
    console.log('');

    // Initialize Firebase
    initializeFirebase();
    const db = admin.firestore();

    // Get or prompt for user ID
    let targetUserId = userId;
    if (!targetUserId) {
        console.error('❌ User ID required. Use --user-id=YOUR_FIREBASE_UID');
        console.error('   You can find your UID in the Firebase Console under Authentication > Users');
        process.exit(1);
    }
    console.log(`👤 Importing for user: ${targetUserId}`);
    console.log('');

    // Read and parse CSV/TSV (Google Takeout uses tab-separated)
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const records: CSVRow[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: csvContent.includes('\t') ? '\t' : ',', // Auto-detect tabs vs commas
    });

    console.log(`📚 Found ${records.length} titles to import`);
    console.log('');

    // Process each title
    const results: ImportResult[] = [];
    let imported = 0;
    let skipped = 0;
    let notFound = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const title = row['Title'] || row['title'];

        if (!title) {
            console.log(`⚠️  Row ${i + 1}: No title found, skipping`);
            continue;
        }

        process.stdout.write(`[${i + 1}/${records.length}] "${title}"... `);

        const result = await importTitle(db, targetUserId, title, dryRun);
        results.push(result);

        switch (result.status) {
            case 'imported':
                imported++;
                console.log(`✅ ${dryRun ? 'Would import' : 'Imported'} as ${result.mediaType}: "${result.matchedTitle}"`);
                break;
            case 'skipped':
                skipped++;
                console.log(`⏭️  Already exists: "${result.matchedTitle}"`);
                break;
            case 'not_found':
                notFound++;
                console.log(`❓ Not found on TMDB`);
                break;
            case 'error':
                errors++;
                console.log(`❌ Error: ${result.error}`);
                break;
        }

        // Rate limiting
        if (i < records.length - 1) {
            await sleep(REQUEST_DELAY_MS);
        }
    }

    // Summary
    console.log('');
    console.log('=========================================');
    console.log('📊 Import Summary');
    console.log('=========================================');
    console.log(`✅ ${dryRun ? 'Would import' : 'Imported'}: ${imported}`);
    console.log(`⏭️  Skipped (already exists): ${skipped}`);
    console.log(`❓ Not found: ${notFound}`);
    console.log(`❌ Errors: ${errors}`);

    // List not-found titles for manual review
    const notFoundTitles = results.filter(r => r.status === 'not_found');
    if (notFoundTitles.length > 0) {
        console.log('');
        console.log('📝 Titles not found (may need manual adding):');
        notFoundTitles.forEach(r => console.log(`   - ${r.title}`));
    }

    // List errors for debugging
    const errorTitles = results.filter(r => r.status === 'error');
    if (errorTitles.length > 0) {
        console.log('');
        console.log('🔧 Errors encountered:');
        errorTitles.forEach(r => console.log(`   - ${r.title}: ${r.error}`));
    }

    console.log('');
    console.log('🎉 Import complete!');

    // Exit explicitly
    process.exit(0);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
