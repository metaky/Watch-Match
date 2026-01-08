'use client';

import React, { useState } from 'react';
import { X, Plus, Check, Film } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { BundleWithId } from '@/types/firestore';
import { ContentCardData } from '@/types/content';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

interface BundleSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    contentToAdd: ContentCardData | null;
}

export function BundleSelectionModal({
    isOpen,
    onClose,
    contentToAdd,
}: BundleSelectionModalProps) {
    const { bundles, addBundle, addItemToBundle, addToWatchlist, user1Name } = useAppStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newBundleTitle, setNewBundleTitle] = useState('');

    if (!isOpen || !contentToAdd) return null;

    // Helper to safely get milliseconds from Timestamp or serialized object
    const getMillis = (timestamp: any) => {
        if (!timestamp) return 0;
        if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
        if (timestamp.seconds) return timestamp.seconds * 1000;
        return 0;
    };

    const orderedBundles = [...bundles].sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));

    const handleCreateBundle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBundleTitle.trim()) return;

        addBundle({
            title: newBundleTitle,
            title: newBundleTitle,
            // Store will replace this with auth.currentUser.uid for Firestore
            // We pass a placeholder here for local optimistic update
            createdBy: activeProfile === 'user1' ? 'user-1' : 'user-2',
            contentIds: [contentToAdd.id.toString()],
            contentIds: [contentToAdd.id.toString()],
        });

        // Also add to watchlist
        addToWatchlist({
            id: contentToAdd.id,
            mediaType: contentToAdd.mediaType,
            title: contentToAdd.title,
            posterPath: contentToAdd.posterUrl ? contentToAdd.posterUrl.split('/').pop() || null : null,
        });

        setNewBundleTitle('');
        setIsCreating(false);
        onClose();
    };

    const handleToggleBundle = (bundle: BundleWithId) => {
        const contentId = contentToAdd.id.toString();
        // Since we only want to ADD from this view (usually), we check if it's there
        if (!bundle.contentIds.includes(contentId)) {
            addItemToBundle(bundle.id, contentId, contentToAdd.mediaType, {
                title: contentToAdd.title,
                posterPath: contentToAdd.posterUrl ? contentToAdd.posterUrl.split('/').pop() || undefined : undefined,
            });

            // Also add to watchlist
            addToWatchlist({
                id: contentToAdd.id,
                mediaType: contentToAdd.mediaType,
                title: contentToAdd.title,
                posterPath: contentToAdd.posterUrl ? contentToAdd.posterUrl.split('/').pop() || null : null,
            });
        }
    };

    // We need to access removeItemFromBundle from store if we want toggle behavior
    // But let's just use addItemToBundle as per previous step which handled duplicates check inside store (or should have).
    // Reviewing store: addItemToBundle checks duplicates. Good.

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm bg-bg-card rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h3 className="text-lg font-bold text-text-primary">Save to Bundle</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Preview */}
                <div className="px-4 py-3 bg-white/5 flex items-center gap-3">
                    {contentToAdd.posterUrl ? (
                        <img
                            src={contentToAdd.posterUrl}
                            alt={contentToAdd.title}
                            className="w-10 h-14 object-cover rounded shadow-sm"
                        />
                    ) : (
                        <div className="w-10 h-14 bg-bg-elevated rounded flex items-center justify-center">
                            <Film className="w-5 h-5 text-text-tertiary" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{contentToAdd.title}</p>
                        <p className="text-xs text-text-tertiary">{contentToAdd.year} • {contentToAdd.mediaType === 'movie' ? 'Movie' : 'TV Show'}</p>
                    </div>
                </div>

                {/* Bundle List */}
                <div className="max-h-60 overflow-y-auto p-2">
                    {orderedBundles.length === 0 && !isCreating && (
                        <div className="text-center py-8 px-4">
                            <p className="text-text-secondary text-sm mb-2">No bundles yet</p>
                            <p className="text-text-tertiary text-xs">Create a bundle to organize your movies and shows.</p>
                        </div>
                    )}

                    {!isCreating && orderedBundles.map(bundle => {
                        const isAdded = bundle.contentIds.includes(contentToAdd.id.toString());
                        return (
                            <button
                                key={bundle.id}
                                onClick={() => handleToggleBundle(bundle)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-lg bg-bg-elevated flex items-center justify-center overflow-hidden relative",
                                    isAdded && "ring-2 ring-accent-primary"
                                )}>
                                    {/* Simple collage preview or icon */}
                                    <div className="grid grid-cols-2 w-full h-full">
                                        <div className="bg-accent-primary/20"></div>
                                        <div className="bg-accent-secondary/20"></div>
                                        <div className="bg-accent-tertiary/20"></div>
                                        <div className="bg-accent-quaternary/20"></div>
                                    </div>
                                    {isAdded && (
                                        <div className="absolute inset-0 bg-accent-primary/50 flex items-center justify-center">
                                            <Check className="w-6 h-6 text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={cn("text-sm font-medium truncate", isAdded ? "text-accent-primary" : "text-text-primary")}>
                                        {bundle.title}
                                    </h4>
                                    <p className="text-xs text-text-tertiary">
                                        {bundle.contentIds.length} items
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Create New Bundle Input */}
                {isCreating ? (
                    <form onSubmit={handleCreateBundle} className="p-4 border-t border-white/5 bg-bg-elevated/30">
                        <label className="block text-xs text-text-secondary mb-1.5 font-medium">Bundle Name</label>
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                type="text"
                                value={newBundleTitle}
                                onChange={(e) => setNewBundleTitle(e.target.value)}
                                placeholder="e.g. Scifi Marthon"
                                className="flex-1 bg-bg-card border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary"
                            />
                            <button
                                type="submit"
                                disabled={!newBundleTitle.trim()}
                                className="bg-accent-primary text-white px-3 py-2 rounded-lg font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="mt-2 text-xs text-text-tertiary hover:text-text-primary"
                        >
                            Cancel
                        </button>
                    </form>
                ) : (
                    <div className="p-4 border-t border-white/5">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-text-primary py-2.5 rounded-lg text-sm font-medium transition-colors border border-white/5"
                        >
                            <Plus className="w-4 h-4" />
                            Create New Bundle
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
