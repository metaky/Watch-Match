// Content Detail Modal - Slide up modal showing detailed content info
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, Check, Plus, Trash2, Heart, Loader2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrailerPlayer } from './TrailerPlayer';
import { UserRatingButtons } from './UserRatingButtons';
import { WhereToWatch } from './WhereToWatch';
import { CastRow } from './CastRow';
import { useAppStore } from '@/store/useAppStore';
import { getImageUrl } from '@/services/api';
import { getMovieDetails, getTVDetails, getTrailer, getWatchProviders, getCast } from '@/services/tmdb';
import { mapProviderToServiceId } from './StreamingBadge';
import type { ContentCardData, ContentDetailData, PartnerStatus, StreamingProviderInfo, CastMember } from '@/types/content';
import type { InteractionStatus } from '@/types/firestore';
import { getPartnerStatusLabel } from '@/types/content';
import { BundleSelectionModal } from './BundleSelectionModal';
import { deleteInteraction, setInteraction } from '@/lib/services/interactionService';

interface ContentDetailModalProps {
    content: ContentCardData | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ContentDetailModal({ content, isOpen, onClose }: ContentDetailModalProps) {
    const [detailData, setDetailData] = useState<ContentDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userRating, setUserRating] = useState<PartnerStatus>(null);
    const [isWatched, setIsWatched] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
    const { activeProfile, removeFromWatchlist, addToWatchlist, user1Watchlist, user2Watchlist } = useAppStore();

    // Check if content is in current watchlist
    const watchlist = activeProfile === 'user1' ? user1Watchlist : user2Watchlist;
    const isInWatchlist = content ? watchlist.some(i => i.id === content.id && i.mediaType === content.mediaType) : false;

    // Handle remove from watchlist (Trash)
    const handleRemove = async () => {
        if (!content) return;

        try {
            // Remove from local store
            removeFromWatchlist(content.id, content.mediaType);

            // Remove from backend
            await deleteInteraction(activeProfile, content.id.toString());

            // Close modal
            handleClose();
        } catch (error) {
            console.error('Failed to remove content:', error);
        }
    };

    const handleAddToWatchlist = () => {
        if (!content) return;
        addToWatchlist({
            id: content.id,
            mediaType: content.mediaType,
            title: content.title,
            posterPath: content.posterUrl ? content.posterUrl.split('/').pop() || null : null,
        });
        // We could close modal or give feedback, but store updates automatically
    };

    // Handle interaction update (rating/watched)
    const handleInteractionUpdate = async (status: InteractionStatus) => {
        if (!content) return;

        try {
            // Update local state for immediate feedback
            if (status === 'watched') {
                setIsWatched(true);
                // clear rating if strictly watched? or keep it?
                // schema says status is one field. So if it's 'watched', it's not 'liked'.
                setUserRating(null);
            } else {
                setIsWatched(false); // If rated, it's not JUST 'watched' status (though implicitly watched)
                setUserRating(status as PartnerStatus);
            }

            // Update Firestore
            await setInteraction({
                userId: activeProfile,
                tmdbId: content.id.toString(),
                contentType: content.mediaType,
                status: status,
            });

        } catch (error) {
            console.error('Failed to update interaction:', error);
            // Revert on error? For now just log.
        }
    };

    const handleRatingChange = (rating: PartnerStatus) => {
        if (rating) {
            // Map PartnerStatus to InteractionStatus (they are mostly same strings)
            handleInteractionUpdate(rating as InteractionStatus);
        } else {
            // If clearing rating, maybe delete interaction? Or set to null?
            // "removing" a rating usually means un-liking.
            // Let's delete interaction if null passed? 
            // Or maybe just do nothing if cleared? 
            // UserRatingButtons likely passes the new selected rating.
            // If null is passed, it means deselected.
            handleRemove(); // Assuming deselection means "remove interaction"
        }
    };

    const handleWatchedToggle = () => {
        if (isWatched) {
            // If currently watched, and we toggle off -> remove interaction?
            handleRemove();
        } else {
            handleInteractionUpdate('watched');
        }
    };

    // Fetch full details when content changes
    useEffect(() => {
        if (!content || !isOpen) {
            setDetailData(null);
            return;
        }

        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                // Fetch details based on media type
                const details = content.mediaType === 'movie'
                    ? await getMovieDetails(content.id)
                    : await getTVDetails(content.id);

                // Fetch trailer
                const trailer = await getTrailer(content.id, content.mediaType);

                // Fetch watch providers
                const providers = await getWatchProviders(content.id, content.mediaType);

                // Fetch cast
                const castData = await getCast(content.id, content.mediaType, 8);

                // Map providers to our format
                const mapProviders = (providerList: { providerId: number; providerName: string; logoPath: string }[]): StreamingProviderInfo[] => {
                    return providerList.map(p => ({
                        id: mapProviderToServiceId(p.providerName),
                        name: p.providerName,
                        logoUrl: p.logoPath,
                    }));
                };

                // Map cast to our format
                const cast: CastMember[] = castData.map(c => ({
                    id: c.id,
                    name: c.name,
                    character: c.character,
                    profilePath: c.profilePath,
                }));

                // Get runtime for movies, or first episode runtime for TV
                const runtime = content.mediaType === 'movie'
                    ? (details as { runtime?: number }).runtime
                    : ((details as { episodeRunTime?: number[] }).episodeRunTime?.[0] || 0);

                // Format runtime
                const formatRuntime = (mins: number) => {
                    if (!mins) return content.runtime;
                    const hours = Math.floor(mins / 60);
                    const minutes = mins % 60;
                    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
                    if (hours > 0) return `${hours}h`;
                    return `${minutes}m`;
                };

                const detailContent: ContentDetailData = {
                    ...content,
                    overview: details.overview || '',
                    backdropUrl: getImageUrl(details.backdropPath, 'large', 'backdrop'),
                    trailerKey: trailer?.key || null,
                    mpaaRating: null, // Would need additional API call
                    runtime: formatRuntime(runtime || 0),
                    watchProviders: providers ? {
                        flatrate: mapProviders(providers.flatrate || []),
                        rent: mapProviders(providers.rent || []),
                        buy: mapProviders(providers.buy || []),
                    } : null,
                    userRating: null, // Should fetch MY rating here if needed, but not in ContentCardData
                    cast,
                };

                setDetailData(detailContent);
            } catch (error) {
                console.error('Failed to fetch content details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [content, isOpen]);

    // Handle close with animation
    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 300);
    }, [onClose]);

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setUserRating(null);
            setIsWatched(false);
        }
    }, [isOpen]);

    if (!isOpen || !content) return null;

    const displayData = detailData || {
        ...content,
        overview: '',
        backdropUrl: content.posterUrl,
        trailerKey: null,
        mpaaRating: null,
        watchProviders: null,
        userRating: null,
        cast: [],
    };

    return (
        <div
            className={cn(
                'fixed inset-0 z-50',
                'bg-black/60 backdrop-blur-sm',
                isClosing ? 'animate-fade-backdrop' : 'animate-fade-backdrop'
            )}
            onClick={handleBackdropClick}
        >
            {/* Modal Panel */}
            <div
                className={cn(
                    'absolute inset-x-0 bottom-0 top-12',
                    'bg-[#101522] rounded-t-[2rem] shadow-2xl',
                    'flex flex-col overflow-hidden',
                    'max-w-[480px] mx-auto',
                    isClosing ? 'animate-slide-down' : 'animate-slide-up'
                )}
            >
                {/* Drag Handle */}
                <div className="absolute top-0 inset-x-0 h-10 flex justify-center pt-3 z-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                    <div className="w-12 h-1 bg-white/30 rounded-full backdrop-blur-md" />
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className={cn(
                        'absolute top-4 right-4 z-30',
                        'w-8 h-8 rounded-full',
                        'bg-black/40 backdrop-blur-sm border border-white/10',
                        'flex items-center justify-center',
                        'hover:bg-black/60 transition-colors'
                    )}
                >
                    <X className="w-4 h-4 text-white" />
                </button>

                {/* Scrollable Content */}
                <div className="overflow-y-auto scrollbar-hide h-full pb-10">
                    {/* Trailer / Backdrop */}
                    <TrailerPlayer
                        backdropUrl={displayData.backdropUrl}
                        trailerKey={displayData.trailerKey}
                        title={content.title}
                    />

                    {/* Content Info */}
                    <div className="px-6 relative -mt-6">
                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                                <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
                            </div>
                        )}

                        {/* Title & Year */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-white leading-tight mb-2">
                                {content.title}{' '}
                                <span className="font-light text-gray-400 text-xl ml-1">
                                    ({content.year})
                                </span>
                            </h1>

                            {/* Metadata Chips */}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                {displayData.mpaaRating && (
                                    <MetadataChip>{displayData.mpaaRating}</MetadataChip>
                                )}
                                {content.runtime && (
                                    <MetadataChip>{content.runtime}</MetadataChip>
                                )}
                                {content.genre && (
                                    <MetadataChip>{content.genre}</MetadataChip>
                                )}

                                {/* IMDb Rating */}
                                {content.imdbRating && (
                                    <div className="flex items-center gap-1 ml-auto text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                                        <span className="text-sm">★</span>
                                        <span className="text-xs font-bold">{content.imdbRating}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-6 gap-3 mb-6">
                            {/* Watched Button */}
                            <button
                                onClick={handleWatchedToggle}
                                className={cn(
                                    'col-span-3 h-12 rounded-xl font-semibold',
                                    'flex items-center justify-center gap-2',
                                    'transition-all active:scale-[0.98]',
                                    isWatched
                                        ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20'
                                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                )}
                            >
                                <Check className="w-5 h-5" />
                                <span>Watched</span>
                            </button>

                            {/* Add to Bundle */}
                            <ActionButton
                                icon={Plus}
                                title="Add to Bundle"
                                onClick={() => setIsBundleModalOpen(true)}
                            />

                            {/* Add/Remove Watchlist */}
                            {isInWatchlist ? (
                                <ActionButton
                                    icon={Trash2}
                                    title="Remove from Watchlist"
                                    onClick={handleRemove}
                                    danger
                                />
                            ) : (
                                <ActionButton
                                    icon={Bookmark}
                                    title="Add to Watchlist"
                                    onClick={handleAddToWatchlist}
                                />
                            )}
                        </div>

                        {/* Partner's Rating */}
                        {content.partnerStatus && (
                            <div className="mb-6 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/5 p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                        <span className="text-indigo-200 font-bold text-sm">J</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            Partner&apos;s Rating
                                        </span>
                                        <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                                            {getPartnerStatusLabel(content.partnerStatus)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-pink-500/20 text-pink-500 px-3 py-1.5 rounded-full border border-pink-500/20">
                                    <Heart className="w-4 h-4" fill="currentColor" />
                                </div>
                            </div>
                        )}

                        {/* User Rating Buttons */}
                        <div className="mb-8">
                            <UserRatingButtons
                                selectedRating={userRating}
                                onRatingChange={handleRatingChange}
                            />
                        </div>

                        {/* Plot Summary */}
                        {displayData.overview && (
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                                    Plot
                                </h3>
                                <p className="text-gray-300 text-[15px] leading-relaxed font-light">
                                    {displayData.overview}
                                </p>
                            </div>
                        )}

                        {/* Where to Watch */}
                        <WhereToWatch
                            providers={displayData.watchProviders}
                            className="mb-8"
                        />

                        {/* Cast */}
                        <CastRow cast={displayData.cast} className="mb-4" />
                    </div>

                    {/* Bottom Spacer */}
                    <div className="h-6 w-full bg-[#101522]" />
                </div>
            </div>

            {/* Bundle Modal */}
            <BundleSelectionModal
                isOpen={isBundleModalOpen}
                onClose={() => setIsBundleModalOpen(false)}
                contentToAdd={content}
            />
        </div>
    );
}

function MetadataChip({ children }: { children: React.ReactNode }) {
    return (
        <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs font-medium text-gray-300 tracking-wide">
            {children}
        </span>
    );
}

interface ActionButtonProps {
    icon: React.ElementType;
    title: string;
    onClick: () => void;
    danger?: boolean;
}

function ActionButton({ icon: Icon, title, onClick, danger }: ActionButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'col-span-1 h-12 rounded-xl',
                'bg-white/5 border border-white/10',
                'flex items-center justify-center',
                'transition-colors active:scale-[0.98]',
                danger
                    ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
            )}
            title={title}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
}
