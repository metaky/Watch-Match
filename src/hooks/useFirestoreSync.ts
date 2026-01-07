// Hook for hydrating Zustand store from Firestore on app initialization
'use client';

import { useEffect, useRef } from 'react';
import { useAppStore, WatchlistItem } from '@/store/useAppStore';
import { getUserInteractions } from '@/lib/services/interactionService';
import { getAllBundles } from '@/lib/services/bundleService';
import { UserInteractionWithId, BundleWithId } from '@/types/firestore';

/**
 * Converts Firestore interactions to WatchlistItem format
 */
function interactionToWatchlistItem(interaction: UserInteractionWithId): WatchlistItem | null {
    // Only include 'liked' status items in watchlist
    if (interaction.status !== 'liked') {
        return null;
    }

    const meta = interaction.meta;
    if (!meta) {
        // Can't create watchlist item without metadata
        console.warn(`Interaction ${interaction.id} missing metadata, skipping`);
        return null;
    }

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

/**
 * Hook that syncs data from Firestore to Zustand on app initialization.
 * Should be called once at the app root level.
 */
export function useFirestoreSync() {
    const {
        isHydrated,
        setHydrated,
        hydrateWatchlist,
        hydrateBundles,
    } = useAppStore();

    const hasInitialized = useRef(false);

    useEffect(() => {
        // Only run once
        if (hasInitialized.current || isHydrated) {
            return;
        }
        hasInitialized.current = true;

        async function syncFromFirestore() {
            try {
                console.log('[FirestoreSync] Starting hydration from Firestore...');

                // Fetch interactions for both users in parallel
                const [user1Interactions, user2Interactions, bundles] = await Promise.all([
                    getUserInteractions('user1'),
                    getUserInteractions('user2'),
                    getAllBundles(),
                ]);

                // Merge interactions from both users (shared watchlist)
                // Use a Map to dedupe by tmdbId
                const watchlistMap = new Map<string, WatchlistItem>();

                [...user1Interactions, ...user2Interactions].forEach((interaction) => {
                    const item = interactionToWatchlistItem(interaction);
                    if (item) {
                        const key = `${item.id}_${item.mediaType}`;
                        // Keep the most recent one if duplicate
                        const existing = watchlistMap.get(key);
                        if (!existing || item.addedAt > existing.addedAt) {
                            watchlistMap.set(key, item);
                        }
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
    }, [isHydrated, setHydrated, hydrateWatchlist, hydrateBundles]);

    return { isHydrated };
}
