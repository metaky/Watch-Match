// Home Page Dashboard
'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FilterBar, FilterOverlay } from '@/components/ui';
import { ContentCard } from '@/components/ContentCard';
import { ContentDetailModal } from '@/components/ContentDetailModal';
import { BundleSelectionModal } from '@/components/BundleSelectionModal';
import { useContentWithDetails } from '@/hooks/useContentWithDetails';
import { useAppStore } from '@/store/useAppStore';
import type { ContentFilter, ContentCardData } from '@/types/content';
import { hasActiveFilters } from '@/types/content';

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<ContentFilter>('all');

  const {
    isFilterOverlayOpen,
    setFilterOverlayOpen,
    advancedFilters,
    selectedContent,
    isDetailModalOpen,
    openDetailModal,
    closeDetailModal,
    // Bundle modal actions
    isBundleModalOpen,
    openBundleModal,
    closeBundleModal,
    contentToAddToBundle,
  } = useAppStore();

  const {
    content,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
  } = useContentWithDetails({
    filter: activeFilter,
    // Always pass advanced filters so sorting changes are detected
    advancedFilters: advancedFilters,
    limit: 10,
  });

  const handleAddToBundle = (item: ContentCardData) => {
    openBundleModal(item);
  };

  const handleCardClick = (item: ContentCardData) => {
    openDetailModal(item);
  };

  const handleOpenFilterOverlay = () => {
    setFilterOverlayOpen(true);
  };

  const handleCloseFilterOverlay = () => {
    setFilterOverlayOpen(false);
  };

  const handleApplyFilters = () => {
    // TODO: Apply advanced filters to content query
    console.log('Applied filters:', advancedFilters);
  };

  // Check if any advanced filters are active
  const hasFiltersActive = hasActiveFilters(advancedFilters);

  return (
    <>
      <div className="space-y-4 pb-20">
        {/* Filter Bar */}
        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onOpenSettings={handleOpenFilterOverlay}
          hasActiveFilters={hasFiltersActive}
          className="pt-2"
        />

        {/* Section Header */}
        <h2 className="text-sm font-bold text-text-tertiary uppercase tracking-wider pl-1">
          Recently Added
        </h2>

        {/* Content Grid */}
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error.message} />
        ) : content.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {content.map((item) => (
                <ContentCard
                  key={`${item.mediaType}-${item.id}`}
                  content={item}
                  onAddToBundle={handleAddToBundle}
                  onClick={handleCardClick}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2.5 rounded-full bg-accent-primary/10 text-accent-primary font-medium text-sm hover:bg-accent-primary/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* JustWatch Attribution */}
        {!isLoading && content.length > 0 && (
          <p className="text-center text-xs text-text-tertiary pt-8">
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
      </div>

      {/* Filter Overlay */}
      <FilterOverlay
        isOpen={isFilterOverlayOpen}
        onClose={handleCloseFilterOverlay}
        onApply={handleApplyFilters}
        resultCount={content.length}
      />

      {/* Content Detail Modal */}
      <ContentDetailModal
        content={selectedContent}
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
      />

      {/* Bundle Selection Modal */}
      {/* We need to import it first, but let's assume it's imported at top */}
      <BundleSelectionModal
        isOpen={isBundleModalOpen}
        onClose={closeBundleModal}
        contentToAdd={contentToAddToBundle}
      />
    </>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-accent-primary animate-spin mb-3" />
      <p className="text-text-secondary text-sm">Loading your watchlist...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-full bg-accent-danger/10 flex items-center justify-center mb-3">
        <span className="text-accent-danger text-xl">!</span>
      </div>
      <p className="text-text-primary font-medium mb-1">Something went wrong</p>
      <p className="text-text-secondary text-sm text-center">{message}</p>
    </div>
  );
}

function EmptyState({ filter }: { filter: ContentFilter }) {
  const messages: Record<ContentFilter, string> = {
    all: "No content in your watchlist yet. Start adding movies and shows!",
    movies: "No movies in your watchlist yet.",
    tv: "No TV shows in your watchlist yet.",
    available: "None of your watchlist items are currently streaming.",
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-bg-card flex items-center justify-center mb-4">
        <span className="text-2xl">🎬</span>
      </div>
      <p className="text-text-secondary text-sm text-center">
        {messages[filter]}
      </p>
    </div>
  );
}
