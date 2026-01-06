// Global state management for The Shared Screen
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdvancedFilters, DEFAULT_FILTERS, ContentCardData, SearchFilters, DEFAULT_SEARCH_FILTERS } from '@/types/content';
import { MOCK_BUNDLES } from '@/lib/mockBundles';
import { BundleWithId } from '@/types/firestore';
import { Timestamp } from 'firebase/firestore';

export type UserProfile = 'user1' | 'user2';

export interface WatchlistItem {
    id: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath: string | null;
    addedAt: Date;
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

    // Watchlists for each user
    user1Watchlist: WatchlistItem[];
    user2Watchlist: WatchlistItem[];

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
    addItemToBundle: (bundleId: string, itemId: string) => void;
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
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial state
            activeProfile: 'user1',
            hasSelectedProfile: false,
            user1Watchlist: [],
            user2Watchlist: [],
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
            bundles: MOCK_BUNDLES, // Start with mock bundles for development

            // Bundle modal initial state
            isBundleModalOpen: false,
            contentToAddToBundle: null,

            // Profile actions
            setActiveProfile: (profile) => set({ activeProfile: profile, isFilterOverlayOpen: false }), // Close filters on switch just in case

            // New action to permanently select profile
            selectProfile: (profile) => set({ activeProfile: profile, hasSelectedProfile: true }),

            toggleProfile: () => set((state) => ({
                activeProfile: state.activeProfile === 'user1' ? 'user2' : 'user1'
            })),

            // Watchlist actions
            addToWatchlist: (item) => {
                const { activeProfile, user1Watchlist, user2Watchlist } = get();
                const newItem: WatchlistItem = { ...item, addedAt: new Date() };

                if (activeProfile === 'user1') {
                    // Check if already in watchlist
                    if (user1Watchlist.some(i => i.id === item.id && i.mediaType === item.mediaType)) {
                        return;
                    }

                    // Add to user1's watchlist
                    const newUser1List = [...user1Watchlist, newItem];

                    // Check for match
                    const isMatch = user2Watchlist.some(
                        i => i.id === item.id && i.mediaType === item.mediaType
                    );

                    if (isMatch) {
                        const match: Match = {
                            id: item.id,
                            mediaType: item.mediaType,
                            title: item.title,
                            posterPath: item.posterPath,
                            matchedAt: new Date(),
                        };
                        set((state) => ({
                            user1Watchlist: newUser1List,
                            matches: [...state.matches, match],
                        }));
                    } else {
                        set({ user1Watchlist: newUser1List });
                    }
                } else {
                    // Check if already in watchlist
                    if (user2Watchlist.some(i => i.id === item.id && i.mediaType === item.mediaType)) {
                        return;
                    }

                    // Add to user2's watchlist
                    const newUser2List = [...user2Watchlist, newItem];

                    // Check for match
                    const isMatch = user1Watchlist.some(
                        i => i.id === item.id && i.mediaType === item.mediaType
                    );

                    if (isMatch) {
                        const match: Match = {
                            id: item.id,
                            mediaType: item.mediaType,
                            title: item.title,
                            posterPath: item.posterPath,
                            matchedAt: new Date(),
                        };
                        set((state) => ({
                            user2Watchlist: newUser2List,
                            matches: [...state.matches, match],
                        }));
                    } else {
                        set({ user2Watchlist: newUser2List });
                    }
                }
            },

            removeFromWatchlist: (id, mediaType) => {
                const { activeProfile } = get();

                if (activeProfile === 'user1') {
                    set((state) => ({
                        user1Watchlist: state.user1Watchlist.filter(
                            i => !(i.id === id && i.mediaType === mediaType)
                        ),
                    }));
                } else {
                    set((state) => ({
                        user2Watchlist: state.user2Watchlist.filter(
                            i => !(i.id === id && i.mediaType === mediaType)
                        ),
                    }));
                }
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
            addBundle: (bundle) => set((state) => {
                const newBundle: BundleWithId = {
                    ...bundle,
                    id: `bundle-${Date.now()}`, // Temporary ID generation
                    createdAt: Timestamp.now(),
                } as BundleWithId;
                return { bundles: [...state.bundles, newBundle] };
            }),

            removeBundle: (id) => set((state) => ({
                bundles: state.bundles.filter(b => b.id !== id)
            })),

            addItemToBundle: (bundleId, itemId) => set((state) => ({
                bundles: state.bundles.map(b => {
                    if (b.id === bundleId) {
                        // Avoid duplicates
                        if (b.contentIds.includes(itemId)) return b;
                        return { ...b, contentIds: [...b.contentIds, itemId] };
                    }
                    return b;
                })
            })),

            removeItemFromBundle: (bundleId, itemId) => set((state) => ({
                bundles: state.bundles.map(b => {
                    if (b.id === bundleId) {
                        return { ...b, contentIds: b.contentIds.filter(id => id !== itemId) };
                    }
                    return b;
                })
            })),

            // Content detail modal actions
            setSelectedContent: (content) => set({ selectedContent: content }),
            setDetailModalOpen: (open) => set({ isDetailModalOpen: open }),
            openDetailModal: (content) => set({ selectedContent: content, isDetailModalOpen: true }),
            closeDetailModal: () => set({ selectedContent: null, isDetailModalOpen: false }),

            // Bundle modal actions
            setBundleModalOpen: (open) => set({ isBundleModalOpen: open }),
            openBundleModal: (content) => set({ contentToAddToBundle: content, isBundleModalOpen: true }),
            closeBundleModal: () => set({ contentToAddToBundle: null, isBundleModalOpen: false }),
        }),
        {
            name: 'watch-match-storage',
            partialize: (state) => ({
                activeProfile: state.activeProfile,
                hasSelectedProfile: state.hasSelectedProfile,
                user1Name: state.user1Name,
                user2Name: state.user2Name,
                user1Watchlist: state.user1Watchlist,
                user2Watchlist: state.user2Watchlist,
                matches: state.matches,
                bundles: state.bundles,
            }),
        }
    )
);
