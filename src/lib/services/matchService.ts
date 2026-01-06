// Match Service - Operations for matches collection
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp,
    arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Match, MatchWithId, ContentType } from '@/types/firestore';

const COLLECTION = 'matches';

/**
 * Get a match by TMDB ID
 */
export async function getMatch(tmdbId: string): Promise<MatchWithId | null> {
    const docRef = doc(db, COLLECTION, tmdbId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return {
        id: tmdbId,
        ...docSnap.data(),
    } as MatchWithId;
}

/**
 * Get all active matches
 */
export async function getActiveMatches(): Promise<MatchWithId[]> {
    const q = query(
        collection(db, COLLECTION),
        where('isActiveMatch', '==', true),
        orderBy('matchTimestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as MatchWithId[];
}

/**
 * Check if content is actively matched
 */
export async function isMatch(tmdbId: string): Promise<boolean> {
    const match = await getMatch(tmdbId);
    return match?.isActiveMatch ?? false;
}

/**
 * Add a user to a match (creates match if doesn't exist)
 */
export async function addUserToMatch(
    tmdbId: string,
    userId: string,
    contentType: ContentType,
    metadata?: { title?: string; posterPath?: string }
): Promise<{ isNewMatch: boolean }> {
    const docRef = doc(db, COLLECTION, tmdbId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        // Create new match document
        await setDoc(docRef, {
            tmdbId,
            contentType,
            usersWhoLiked: [userId],
            isActiveMatch: false,
            matchTimestamp: null,
            ...(metadata?.title && { title: metadata.title }),
            ...(metadata?.posterPath && { posterPath: metadata.posterPath }),
        });
        return { isNewMatch: false };
    }

    // Update existing match
    const existingMatch = docSnap.data() as Match;

    // Check if user already in array
    if (existingMatch.usersWhoLiked.includes(userId)) {
        return { isNewMatch: false };
    }

    const newUsersWhoLiked = [...existingMatch.usersWhoLiked, userId];
    const isNowActive = newUsersWhoLiked.length >= 2;

    await updateDoc(docRef, {
        usersWhoLiked: arrayUnion(userId),
        isActiveMatch: isNowActive,
        ...(isNowActive && { matchTimestamp: serverTimestamp() }),
        ...(metadata?.title && { title: metadata.title }),
        ...(metadata?.posterPath && { posterPath: metadata.posterPath }),
    });

    return { isNewMatch: isNowActive && !existingMatch.isActiveMatch };
}

/**
 * Remove a user from a match
 */
export async function removeUserFromMatch(
    tmdbId: string,
    userId: string
): Promise<void> {
    const docRef = doc(db, COLLECTION, tmdbId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return;
    }

    const existingMatch = docSnap.data() as Match;
    const newUsersWhoLiked = existingMatch.usersWhoLiked.filter(
        (id) => id !== userId
    );

    await updateDoc(docRef, {
        usersWhoLiked: newUsersWhoLiked,
        isActiveMatch: newUsersWhoLiked.length >= 2,
    });
}
