// Hook for hydrating Zustand store from Firestore on app initialization
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore, WatchlistItem } from '@/store/useAppStore';
import { getUserInteractions } from '@/lib/services/interactionService';
import { getAllBundles } from '@/lib/services/bundleService';
import { getUidByProfile } from '@/lib/services/userService';
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
    }, [currentUser, isHydrated, setHydrated, hydrateWatchlist, hydrateBundles]);

    return { isHydrated };
}
