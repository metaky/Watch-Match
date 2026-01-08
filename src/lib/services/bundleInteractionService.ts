// Bundle Interaction Service - CRUD operations for bundle_interactions collection
// These are bundle-scoped ratings that only affect the specific bundle they belong to
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
    BundleInteractionWithId,
    CreateBundleInteractionInput,
    BundleRatingStatus,
} from '@/types/firestore';

const COLLECTION = 'bundle_interactions';

/**
 * Generate composite document ID for bundle-scoped interaction
 */
function getBundleInteractionId(bundleId: string, userId: string, tmdbId: string): string {
    return `${bundleId}_${userId}_${tmdbId}`;
}

/**
 * Get a specific bundle interaction
 */
export async function getBundleInteraction(
    bundleId: string,
    userId: string,
    tmdbId: string
): Promise<BundleInteractionWithId | null> {
    const docId = getBundleInteractionId(bundleId, userId, tmdbId);
    const docRef = doc(db, COLLECTION, docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return {
        id: docId,
        ...docSnap.data(),
    } as BundleInteractionWithId;
}

/**
 * Get all interactions for a user within a specific bundle
 */
export async function getBundleInteractions(
    bundleId: string,
    userId: string
): Promise<BundleInteractionWithId[]> {
    const q = query(
        collection(db, COLLECTION),
        where('bundleId', '==', bundleId),
        where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as BundleInteractionWithId[];
}

/**
 * Get all interactions for a bundle (all users)
 * Useful for determining matches within a bundle
 */
export async function getAllBundleInteractions(
    bundleId: string
): Promise<BundleInteractionWithId[]> {
    const q = query(
        collection(db, COLLECTION),
        where('bundleId', '==', bundleId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as BundleInteractionWithId[];
}

/**
 * Get interactions by status for a user within a bundle
 */
export async function getBundleInteractionsByStatus(
    bundleId: string,
    userId: string,
    status: BundleRatingStatus
): Promise<BundleInteractionWithId[]> {
    const q = query(
        collection(db, COLLECTION),
        where('bundleId', '==', bundleId),
        where('userId', '==', userId),
        where('status', '==', status)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as BundleInteractionWithId[];
}

/**
 * Create or update a bundle interaction
 */
export async function setBundleInteraction(
    input: CreateBundleInteractionInput
): Promise<string> {
    const docId = getBundleInteractionId(input.bundleId, input.userId, input.tmdbId);
    const docRef = doc(db, COLLECTION, docId);

    // Check if document exists to preserve createdAt
    const docSnap = await getDoc(docRef);
    const exists = docSnap.exists();

    const data: Record<string, unknown> = {
        bundleId: input.bundleId,
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
 * Delete a bundle interaction
 */
export async function deleteBundleInteraction(
    bundleId: string,
    userId: string,
    tmdbId: string
): Promise<void> {
    const docId = getBundleInteractionId(bundleId, userId, tmdbId);
    const docRef = doc(db, COLLECTION, docId);
    await deleteDoc(docRef);
}
