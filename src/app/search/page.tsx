// Search Page - Discover and discover content
'use client';

import React, { useState } from 'react';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { SearchFiltersBar } from '@/components/SearchFiltersBar';
import { ContentCard } from '@/components/ContentCard';
import { FilterOverlay } from '@/components/ui';
import { ContentDetailModal } from '@/components/ContentDetailModal';
import { BundleSelectionModal } from '@/components/BundleSelectionModal';
import { SearchSuggestions } from '@/components/SearchSuggestions';
import { useSearch } from '@/hooks/useSearch';
import { useAppStore } from '@/store/useAppStore';
import type { ContentCardData } from '@/types/content';

export default function SearchPage() {
    // Track whether suggestions dropdown should be shown
    const [showSuggestions, setShowSuggestions] = useState(true);

    const {
        searchQuery,
        setSearchQuery,
        searchFilters,
        updateSearchFilter,
        resetSearchFilters,
        isFilterOverlayOpen,
        setFilterOverlayOpen,
        selectedContent,
        isDetailModalOpen,
        openDetailModal,
        closeDetailModal,
        addToWatchlist,
        // Bundle actions
        isBundleModalOpen,
        openBundleModal,
        closeBundleModal,
        contentToAddToBundle,
    } = useAppStore();

    const {
        results,
        isLoading,
        error,
        isBrowseMode,
        hasFiltersActive,
        hasMore,
        loadMore,
        suggestions,
    } = useSearch(searchQuery, searchFilters, { debounceMs: 400 });

    const handleCardClick = (item: ContentCardData) => {
        openDetailModal(item);
    };

    const handleAddToBundle = (item: ContentCardData) => {
        openBundleModal(item);
    };

    const handleAddToWatchlist = (item: ContentCardData) => {
        addToWatchlist({
            id: item.id,
            mediaType: item.mediaType,
            title: item.title,
            posterPath: item.posterUrl ? item.posterUrl.split('/').pop() || null : null,
        });
    };

    // Handle suggestion selection
    const handleSuggestionSelect = (item: ContentCardData) => {
        // Open modal immediately
        openDetailModal(item);
        // Hide suggestions after selection
        setShowSuggestions(false);
    };

    // Handle Enter key press to close suggestions
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setShowSuggestions(false);
            // Blur the input to dismiss keyboard on mobile
            (e.target as HTMLInputElement).blur();
        }
    };

    // Handle blur (click outside) to close suggestions
    const handleSearchBlur = () => {
        // Small delay to allow click on suggestion to register first
        setTimeout(() => {
            setShowSuggestions(false);
        }, 150);
    };

    // Handle focus to re-show suggestions
    const handleSearchFocus = () => {
        setShowSuggestions(true);
    };

    // Handle search query change - re-show suggestions when typing
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setShowSuggestions(true);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Search Area */}
            <div className="space-y-4 px-1">
                <h1 className="text-2xl font-bold text-text-primary">Discover</h1>

                <div className="relative z-50">
                    <SearchBar
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search movies, TV shows, actors..."
                        onKeyDown={handleSearchKeyDown}
                        onBlur={handleSearchBlur}
                        onFocus={handleSearchFocus}
                    />

                    <SearchSuggestions
                        suggestions={suggestions}
                        isLoading={isLoading}
                        isVisible={showSuggestions && searchQuery.trim().length > 0 && suggestions.length > 0}
                        onSelect={handleSuggestionSelect}
                    />
                </div>

                <SearchFiltersBar
                    filters={searchFilters}
                    onFilterChange={updateSearchFilter}
                    onOpenFullFilters={() => setFilterOverlayOpen(true)}
                />
            </div>

            {/* Results Area */}
            <div className="space-y-4">
                <h2 className="text-sm font-bold text-text-tertiary uppercase tracking-wider pl-1">
                    {isBrowseMode
                        ? (hasFiltersActive ? 'Filtered Results' : 'Trending Now')
                        : `Results for "${searchQuery}"`
                    }
                </h2>

                {isLoading && results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-accent-primary animate-spin mb-4" />
                        <p className="text-text-secondary text-sm">Searching the galaxy...</p>
                    </div>
                ) : error ? (
                    <div className="bg-accent-danger/10 border border-accent-danger/20 rounded-xl p-6 text-center">
                        <p className="text-accent-danger font-medium mb-1">Search failed</p>
                        <p className="text-text-secondary text-sm">{error.message}</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4">
                        <div className="w-16 h-16 rounded-full bg-bg-card flex items-center justify-center mb-4">
                            <SearchIcon className="w-8 h-8 text-text-tertiary" />
                        </div>
                        <p className="text-text-primary font-medium mb-1">No results found</p>
                        <p className="text-text-secondary text-sm text-center">
                            We couldn't find anything matching your search and filters.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            {results.map((item) => (
                                <ContentCard
                                    key={`${item.mediaType}-${item.id}`}
                                    content={item}
                                    onAddToBundle={handleAddToBundle}
                                    onAddToWatchlist={handleAddToWatchlist}
                                    onClick={handleCardClick}
                                />
                            ))}
                        </div>

                        {hasMore && (
                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={loadMore}
                                    disabled={isLoading}
                                    className="px-6 py-2 rounded-lg bg-bg-card text-text-secondary hover:text-text-primary font-medium transition-colors"
                                >
                                    {isLoading ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* JustWatch Attribution */}
            {!isLoading && results.length > 0 && (
                <p className="text-center text-xs text-text-tertiary pt-4">
                    Streaming data powered by{' '}
                    <a
                        href="https://www.justwatch.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-text-secondary"
                    >
                        JustWatch
                    </a>
                </p>
            )}

            {/* Advanced Filters Overlay */}
            <FilterOverlay
                isOpen={isFilterOverlayOpen}
                onClose={() => setFilterOverlayOpen(false)}
                onApply={() => setFilterOverlayOpen(false)}
                mode="search"
            />

            {/* Content Detail Modal */}
            <ContentDetailModal
                content={selectedContent}
                isOpen={isDetailModalOpen}
                onClose={closeDetailModal}
            />

            {/* Bundle Selection Modal */}
            <BundleSelectionModal
                isOpen={isBundleModalOpen}
                onClose={closeBundleModal}
                contentToAdd={contentToAddToBundle}
            />
        </div>
    );
}
