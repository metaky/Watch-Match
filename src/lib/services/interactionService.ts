// Interaction Service - CRUD operations for user_interactions collection
import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
    UserInteractionWithId,
    CreateInteractionInput,
    InteractionStatus,
} from '@/types/firestore';

const COLLECTION = 'user_interactions';

/**
 * Generate composite document ID
 */
function getInteractionId(userId: string, tmdbId: string): string {
    return `${userId}_${tmdbId}`;
}

/**
 * Get a specific interaction by user and content
 */
export async function getInteraction(
    userId: string,
    tmdbId: string
): Promise<UserInteractionWithId | null> {
    const docId = getInteractionId(userId, tmdbId);
    const docRef = doc(db, COLLECTION, docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return {
        id: docId,
        ...docSnap.data(),
    } as UserInteractionWithId;
}

/**
 * Get all interactions for a user
 */
export async function getUserInteractions(
    userId: string
): Promise<UserInteractionWithId[]> {
    const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as UserInteractionWithId[];
}

/**
 * Get interactions by status for a user
 */
export async function getUserInteractionsByStatus(
    userId: string,
    status: InteractionStatus
): Promise<UserInteractionWithId[]> {
    const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('status', '==', status)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as UserInteractionWithId[];
}

/**
 * Create or update an interaction
 */
export async function setInteraction(
    input: CreateInteractionInput
): Promise<string> {
    const docId = getInteractionId(input.userId, input.tmdbId);
    const docRef = doc(db, COLLECTION, docId);

    // Check if document exists to preserve createdAt
    const docSnap = await getDoc(docRef);
    const exists = docSnap.exists();

    const data: any = {
        userId: input.userId,
        tmdbId: input.tmdbId,
        contentType: input.contentType,
        status: input.status,
        updatedAt: serverTimestamp(),
    };

    if (!exists) {
        data.createdAt = serverTimestamp();
    }

    await setDoc(docRef, data, { merge: true });

    return docId;
}

/**
 * Update interaction status
 */
export async function updateInteractionStatus(
    userId: string,
    tmdbId: string,
    status: InteractionStatus
): Promise<void> {
    const docId = getInteractionId(userId, tmdbId);
    const docRef = doc(db, COLLECTION, docId);

    await setDoc(
        docRef,
        {
            status,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
}

/**
 * Delete an interaction
 */
export async function deleteInteraction(
    userId: string,
    tmdbId: string
): Promise<void> {
    const docId = getInteractionId(userId, tmdbId);
    const docRef = doc(db, COLLECTION, docId);
    await deleteDoc(docRef);
}
