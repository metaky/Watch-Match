// Global state management for The Shared Screen
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdvancedFilters, DEFAULT_FILTERS, ContentCardData, SearchFilters, DEFAULT_SEARCH_FILTERS } from '@/types/content';
import { BundleWithId } from '@/types/firestore';
import { Timestamp } from 'firebase/firestore';
import { setInteraction, deleteInteraction } from '@/lib/services/interactionService';
import { createBundle as createBundleInFirestore, deleteBundle as deleteBundleInFirestore, addContentToBundle, removeContentFromBundle } from '@/lib/services/bundleService';

export type UserProfile = 'user1' | 'user2';

export interface WatchlistItem {
    id: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath: string | null;
    addedAt: Date;
    // Metadata for sorting
    voteAverage?: number;
    popularity?: number;
    releaseDate?: string;
}

export interface Match {
    id: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath: string | null;
    matchedAt: Date;
}

interface AppState {
    // Current active profile
    activeProfile: UserProfile;
    hasSelectedProfile: boolean;
    setActiveProfile: (profile: UserProfile) => void;
    selectProfile: (profile: UserProfile) => void;
    toggleProfile: () => void;

    // Shared watchlist (both users see the same list)
    watchlist: WatchlistItem[];

    // Matches (items both users have added)
    matches: Match[];

    // User Profile Names
    user1Name: string;
    user2Name: string;

    // Actions
    addToWatchlist: (item: Omit<WatchlistItem, 'addedAt'>) => void;
    removeFromWatchlist: (id: number, mediaType: 'movie' | 'tv') => void;
    clearMatches: () => void;
    setUserName: (profile: UserProfile, name: string) => void;

    // Loading states
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;

    // Filter overlay state
    isFilterOverlayOpen: boolean;
    setFilterOverlayOpen: (open: boolean) => void;
    advancedFilters: AdvancedFilters;
    setAdvancedFilters: (filters: AdvancedFilters) => void;
    updateAdvancedFilter: <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => void;
    resetAdvancedFilters: () => void;

    // Search state
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchFilters: SearchFilters;
    setSearchFilters: (filters: SearchFilters) => void;
    updateSearchFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
    resetSearchFilters: () => void;

    // Bundle state
    bundles: BundleWithId[];
    addBundle: (bundle: Omit<BundleWithId, 'id' | 'createdAt'>) => void;
    removeBundle: (id: string) => void;
    addItemToBundle: (bundleId: string, itemId: string, mediaType: 'movie' | 'tv', metadata?: { title?: string; posterPath?: string }) => void;
    removeItemFromBundle: (bundleId: string, itemId: string) => void;

    // Content detail modal state
    selectedContent: ContentCardData | null;
    setSelectedContent: (content: ContentCardData | null) => void;
    isDetailModalOpen: boolean;
    setDetailModalOpen: (open: boolean) => void;
    openDetailModal: (content: ContentCardData) => void;
    closeDetailModal: () => void;

    // Bundle selection modal state
    isBundleModalOpen: boolean;
    setBundleModalOpen: (open: boolean) => void;
    contentToAddToBundle: ContentCardData | null;
    openBundleModal: (content: ContentCardData) => void;
    closeBundleModal: () => void;

    // Hydration state (Firestore sync)
    isHydrated: boolean;
    setHydrated: (hydrated: boolean) => void;
    hydrateWatchlist: (items: WatchlistItem[]) => void;
    hydrateBundles: (bundles: BundleWithId[]) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial state
            activeProfile: 'user1',
            hasSelectedProfile: false,
            watchlist: [], // Single shared watchlist
            matches: [],
            user1Name: 'Kyle',
            user2Name: 'Melanie',
            isLoading: false,
            isFilterOverlayOpen: false,
            advancedFilters: DEFAULT_FILTERS,
            searchQuery: '',
            searchFilters: DEFAULT_SEARCH_FILTERS,
            selectedContent: null,
            isDetailModalOpen: false,
            bundles: [], // Will be hydrated from Firestore

            // Bundle modal initial state
            isBundleModalOpen: false,
            contentToAddToBundle: null,

            // Hydration initial state
            isHydrated: false,

            // Profile actions
            setActiveProfile: (profile) => set({ activeProfile: profile, isFilterOverlayOpen: false }), // Close filters on switch just in case

            // New action to permanently select profile
            selectProfile: (profile) => set({ activeProfile: profile, hasSelectedProfile: true }),

            toggleProfile: () => set((state) => ({
                activeProfile: state.activeProfile === 'user1' ? 'user2' : 'user1'
            })),

            // Watchlist actions - SHARED between both users
            addToWatchlist: (item) => {
                const { activeProfile, watchlist } = get();

                // Check if already in shared watchlist
                if (watchlist.some(i => i.id === item.id && i.mediaType === item.mediaType)) {
                    return;
                }

                const newItem: WatchlistItem = { ...item, addedAt: new Date() };

                // Persist to Firestore for the active user (tracks who added it)
                setInteraction({
                    userId: activeProfile,
                    tmdbId: item.id.toString(),
                    contentType: item.mediaType,
                    status: 'liked', // 'liked' implies added to watchlist
                    meta: {
                        title: item.title,
                        posterPath: item.posterPath,
                        voteAverage: item.voteAverage || 0,
                        popularity: item.popularity || 0,
                        releaseDate: item.releaseDate || null,
                    }
                }).catch(err => console.error("Failed to persist watchlist item", err));

                // Add to shared watchlist
                set({ watchlist: [...watchlist, newItem] });
            },

            removeFromWatchlist: (id, mediaType) => {
                const { activeProfile } = get();

                // Persist delete to Firestore
                deleteInteraction(activeProfile, id.toString())
                    .catch(err => console.error("Failed to remove watchlist item from DB", err));

                // Remove from shared watchlist
                set((state) => ({
                    watchlist: state.watchlist.filter(
                        i => !(i.id === id && i.mediaType === mediaType)
                    ),
                }));
            },

            clearMatches: () => set({ matches: [] }),

            setUserName: (profile, name) => set((state) => ({
                user1Name: profile === 'user1' ? name : state.user1Name,
                user2Name: profile === 'user2' ? name : state.user2Name,
            })),

            setIsLoading: (loading) => set({ isLoading: loading }),

            // Filter overlay actions
            setFilterOverlayOpen: (open) => set({ isFilterOverlayOpen: open }),

            setAdvancedFilters: (filters) => set({ advancedFilters: filters }),

            updateAdvancedFilter: (key, value) => set((state) => ({
                advancedFilters: { ...state.advancedFilters, [key]: value }
            })),

            resetAdvancedFilters: () => set({ advancedFilters: DEFAULT_FILTERS }),

            // Search actions
            setSearchQuery: (query) => set({ searchQuery: query }),
            setSearchFilters: (filters) => set({ searchFilters: filters }),
            updateSearchFilter: (key, value) => set((state) => ({
                searchFilters: { ...state.searchFilters, [key]: value }
            })),
            resetSearchFilters: () => set({ searchFilters: DEFAULT_SEARCH_FILTERS }),

            // Bundle actions
            addBundle: (bundle) => {
                const { activeProfile } = get();
                const newBundle: BundleWithId = {
                    ...bundle,
                    id: `bundle-${Date.now()}`, // Temporary ID, will be replaced by Firestore
                    createdAt: Timestamp.now(),
                } as BundleWithId;

                // Optimistically update local state
                set((state) => ({ bundles: [...state.bundles, newBundle] }));

                // Persist to Firestore
                createBundleInFirestore({
                    title: bundle.title,
                    createdBy: activeProfile,
                    contentIds: bundle.contentIds,
                }).then((firestoreId) => {
                    // Update the bundle with the real Firestore ID
                    set((state) => ({
                        bundles: state.bundles.map(b =>
                            b.id === newBundle.id ? { ...b, id: firestoreId } : b
                        )
                    }));
                }).catch(err => console.error('Failed to persist bundle to Firestore', err));
            },

            removeBundle: (id) => {
                // Optimistically update local state
                set((state) => ({
                    bundles: state.bundles.filter(b => b.id !== id)
                }));

                // Persist to Firestore
                deleteBundleInFirestore(id)
                    .catch(err => console.error('Failed to delete bundle from Firestore', err));
            },

            addItemToBundle: (bundleId, itemId, mediaType, metadata) => {
                // Optimistically update local state
                set((state) => ({
                    bundles: state.bundles.map(b => {
                        if (b.id === bundleId) {
                            // Avoid duplicates
                            if (b.contentIds.includes(itemId)) return b;
                            return { ...b, contentIds: [...b.contentIds, itemId] };
                        }
                        return b;
                    })
                }));

                // Persist to Firestore
                addContentToBundle(bundleId, itemId, mediaType, metadata)
                    .catch(err => console.error('Failed to add content to bundle in Firestore', err));
            },

            removeItemFromBundle: (bundleId, itemId) => {
                // Optimistically update local state
                set((state) => ({
                    bundles: state.bundles.map(b => {
                        if (b.id === bundleId) {
                            return { ...b, contentIds: b.contentIds.filter(id => id !== itemId) };
                        }
                        return b;
                    })
                }));

                // Persist to Firestore
                removeContentFromBundle(bundleId, itemId)
                    .catch(err => console.error('Failed to remove content from bundle in Firestore', err));
            },

            // Content detail modal actions
            setSelectedContent: (content) => set({ selectedContent: content }),
            setDetailModalOpen: (open) => set({ isDetailModalOpen: open }),
            openDetailModal: (content) => set({ selectedContent: content, isDetailModalOpen: true }),
            closeDetailModal: () => set({ selectedContent: null, isDetailModalOpen: false }),

            // Bundle modal actions
            setBundleModalOpen: (open) => set({ isBundleModalOpen: open }),
            openBundleModal: (content) => set({ contentToAddToBundle: content, isBundleModalOpen: true }),
            closeBundleModal: () => set({ contentToAddToBundle: null, isBundleModalOpen: false }),

            // Hydration actions
            setHydrated: (hydrated) => set({ isHydrated: hydrated }),
            hydrateWatchlist: (items) => set({ watchlist: items }),
            hydrateBundles: (bundles) => set({ bundles }),
        }),
        {
            name: 'watch-match-storage',
            partialize: (state) => ({
                activeProfile: state.activeProfile,
                hasSelectedProfile: state.hasSelectedProfile,
                user1Name: state.user1Name,
                user2Name: state.user2Name,
                watchlist: state.watchlist,
                matches: state.matches,
                bundles: state.bundles,
            }),
        }
    )
);
