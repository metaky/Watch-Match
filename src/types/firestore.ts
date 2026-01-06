// Firestore Type Definitions for The Shared Screen
import { Timestamp } from 'firebase/firestore';

// ============================================
// Enums
// ============================================

export type ContentType = 'movie' | 'tv';

export type InteractionStatus =
    | 'liked'
    | 'Yes'
    | 'No'
    | 'watched'
    | 'wont_watch'
    | 'not_important';

export type StreamingService =
    | 'netflix'
    | 'max'
    | 'hulu'
    | 'disney_plus'
    | 'amazon_prime'
    | 'apple_tv'
    | 'peacock'
    | 'paramount_plus'
    | 'other';

// ============================================
// Collection Types
// ============================================

/**
 * User profile stored in the `users` collection.
 * Document ID: Firebase Auth UID
 */
export interface User {
    displayName: string;
    email: string;
    photoURL: string;
    streamingServices: StreamingService[];
    lastActive: Timestamp;
}

/**
 * User's interaction with content, stored in `user_interactions` collection.
 * Document ID: `{uid}_{tmdbId}`
 */
export interface UserInteraction {
    userId: string;
    tmdbId: string;
    contentType: ContentType;
    status: InteractionStatus;
    updatedAt: Timestamp;
    createdAt?: Timestamp;
}

/**
 * Match record when two users both mark a title as 'Yes'.
 * Document ID: `tmdbId`
 */
export interface Match {
    tmdbId: string;
    contentType: ContentType;
    usersWhoLiked: string[];
    isActiveMatch: boolean;
    matchTimestamp: Timestamp;
    // Optional cached metadata
    title?: string;
    posterPath?: string;
}

/**
 * Curated content bundle created by a user.
 * Document ID: Auto-generated
 */
export interface Bundle {
    title: string;
    createdBy: string;
    contentIds: string[];
    createdAt: Timestamp;
}

// ============================================
// Input Types (for creating/updating)
// ============================================

export interface CreateUserInput {
    displayName: string;
    email: string;
    photoURL?: string;
    streamingServices?: StreamingService[];
}

export interface UpdateUserInput {
    displayName?: string;
    photoURL?: string;
    streamingServices?: StreamingService[];
}

export interface CreateInteractionInput {
    userId: string;
    tmdbId: string;
    contentType: ContentType;
    status: InteractionStatus;
}

export interface CreateBundleInput {
    title: string;
    createdBy: string;
    contentIds: string[];
}

export interface UpdateBundleInput {
    title?: string;
    contentIds?: string[];
}

// ============================================
// Response Types (with document ID)
// ============================================

export interface UserWithId extends User {
    uid: string;
}

export interface UserInteractionWithId extends UserInteraction {
    id: string;
}

export interface MatchWithId extends Match {
    id: string;
}

export interface BundleWithId extends Bundle {
    id: string;
}
