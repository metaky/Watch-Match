// Hook for hydrating Zustand store from Firestore on app initialization
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore, WatchlistItem } from '@/store/useAppStore';
import { getUserInteractions } from '@/lib/services/interactionService';
import { getAllBundles } from '@/lib/services/bundleService';
import { getUidByProfile } from '@/lib/services/userService';
import { UserInteractionWithId, BundleWithId } from '@/types/firestore';
import { getMovieDetails, getTVDetails } from '@/services/tmdb';
import { getImageUrl } from '@/services/api';
import { setInteraction } from '@/lib/services/interactionService';

/**
 * Converts Firestore interactions to WatchlistItem format
 */
function interactionToWatchlistItem(interaction: UserInteractionWithId): WatchlistItem | null {
    // Only include 'liked' status items in watchlist
    if (interaction.status !== 'liked') {
        return null;
    }

    const meta = interaction.meta;

    // If we have metadata, use it directly
    if (meta) {
        return {
            id: parseInt(interaction.tmdbId, 10),
            mediaType: interaction.contentType,
            title: meta.title,
            posterPath: meta.posterPath,
            addedAt: interaction.createdAt?.toDate() ?? interaction.updatedAt?.toDate?.() ?? new Date(),
            voteAverage: meta.voteAverage,
            popularity: meta.popularity,
            releaseDate: meta.releaseDate ?? undefined,
        };
    }

    // If no metadata, we return null here but handle it in the calling function
    // to fetch the data and update the interaction
    return null;

    return null; // Should not reach here if meta exists, but for safety
}

/**
 * Hook that syncs data from Firestore to Zustand on app initialization.
 * Should be called once at the app root level.
 */
export function useFirestoreSync() {
    const { currentUser } = useAuth();
    const {
        isHydrated,
        setHydrated,
        hydrateWatchlist,
        hydrateBundles,
    } = useAppStore();

    const hasInitialized = useRef(false);

    useEffect(() => {
        // Only run once and only when authenticated
        if (hasInitialized.current || isHydrated || !currentUser) {
            return;
        }
        hasInitialized.current = true;

        async function syncFromFirestore() {
            try {
                console.log('[FirestoreSync] Starting hydration from Firestore...');

                // Resolve UIDs for profiles
                const [user1Uid, user2Uid] = await Promise.all([
                    getUidByProfile('user1'),
                    getUidByProfile('user2')
                ]);

                // Fetch interactions for both users in parallel (if UIDs found)
                const [user1Interactions, user2Interactions, bundles] = await Promise.all([
                    user1Uid ? getUserInteractions(user1Uid) : Promise.resolve([]),
                    user2Uid ? getUserInteractions(user2Uid) : Promise.resolve([]),
                    getAllBundles(),
                ]);

                // Merge interactions from both users (shared watchlist)
                // Use a Map to dedupe by tmdbId
                const watchlistMap = new Map<string, WatchlistItem>();

                // Process all interactions
                const allInteractions = [...user1Interactions, ...user2Interactions];

                // Track missing metadata promises to resolve in parallel
                const validItems: WatchlistItem[] = [];
                const missingMetadataPromises: Promise<WatchlistItem | null>[] = [];

                for (const interaction of allInteractions) {
                    const item = interactionToWatchlistItem(interaction);
                    if (item) {
                        validItems.push(item);
                    } else if (interaction.status === 'liked' && !interaction.meta) {
                        // Handle missing metadata
                        console.log(`[FirestoreSync] Fetching missing metadata for ${interaction.contentType} ${interaction.tmdbId}`);

                        const promise = (async () => {
                            try {
                                const tmdbId = parseInt(interaction.tmdbId);
                                const isMovie = interaction.contentType === 'movie';
                                const details = isMovie
                                    ? await getMovieDetails(tmdbId)
                                    : await getTVDetails(tmdbId);

                                const posterPath = getImageUrl(details.posterPath, 'medium');

                                // Construct new metadata
                                const newMeta = {
                                    title: details.title,
                                    posterPath: details.posterPath, // Store raw path in DB
                                    voteAverage: details.voteAverage,
                                    popularity: details.popularity,
                                    releaseDate: isMovie ? details.releaseDate : (details as any).firstAirDate,
                                };

                                // Update Firestore in background (fire and forget)
                                setInteraction({
                                    userId: interaction.userId,
                                    tmdbId: interaction.tmdbId,
                                    contentType: interaction.contentType,
                                    status: interaction.status,
                                    meta: newMeta
                                }).catch(e => console.error(`[FirestoreSync] Failed to update metadata for ${interaction.tmdbId}:`, e));

                                // Return constructed item for local state
                                return {
                                    id: tmdbId,
                                    mediaType: interaction.contentType,
                                    title: details.title,
                                    posterPath: details.posterPath,
                                    addedAt: interaction.createdAt?.toDate() ?? interaction.updatedAt?.toDate?.() ?? new Date(),
                                    voteAverage: details.voteAverage,
                                    popularity: details.popularity,
                                    releaseDate: isMovie ? details.releaseDate : (details as any).firstAirDate,
                                } as WatchlistItem;

                            } catch (e) {
                                console.error(`[FirestoreSync] Failed to recover metadata for ${interaction.tmdbId}:`, e);
                                return null;
                            }
                        })();
                        missingMetadataPromises.push(promise);
                    }
                }

                // Wait for any recovered items
                const recoveredItems = await Promise.all(missingMetadataPromises);

                // Add recovered items to valid items
                recoveredItems.forEach(item => {
                    if (item) validItems.push(item);
                });

                validItems.forEach((item) => {
                    const key = `${item.id}_${item.mediaType}`;
                    // Keep the most recent one if duplicate
                    const existing = watchlistMap.get(key);
                    if (!existing || item.addedAt > existing.addedAt) {
                        watchlistMap.set(key, item);
                    }
                });

                const watchlistItems = Array.from(watchlistMap.values());

                console.log(`[FirestoreSync] Loaded ${watchlistItems.length} watchlist items`);
                console.log(`[FirestoreSync] Loaded ${bundles.length} bundles`);

                // Hydrate the store
                hydrateWatchlist(watchlistItems);
                hydrateBundles(bundles);
                setHydrated(true);

                console.log('[FirestoreSync] Hydration complete');
            } catch (error) {
                console.error('[FirestoreSync] Failed to sync from Firestore:', error);
                // Mark as hydrated anyway to prevent blocking the app
                setHydrated(true);
            }
        }

        syncFromFirestore();
    }, [currentUser, isHydrated, setHydrated, hydrateWatchlist, hydrateBundles]);

    return { isHydrated };
}
