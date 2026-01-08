// Bundle Service - CRUD operations for bundles collection
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
    Bundle,
    BundleWithId,
    CreateBundleInput,
    UpdateBundleInput,
} from '@/types/firestore';

const COLLECTION = 'bundles';

/**
 * Get a bundle by ID
 */
export async function getBundle(id: string): Promise<BundleWithId | null> {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return {
        id,
        ...docSnap.data(),
    } as BundleWithId;
}

/**
 * Get all bundles
 */
export async function getAllBundles(): Promise<BundleWithId[]> {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as BundleWithId[];
}

/**
 * Get bundles created by a specific user
 */
export async function getUserBundles(userId: string): Promise<BundleWithId[]> {
    const q = query(
        collection(db, COLLECTION),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as BundleWithId[];
}

/**
 * Create a new bundle
 */
export async function createBundle(input: CreateBundleInput): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
        title: input.title,
        createdBy: input.createdBy,
        contentIds: input.contentIds,
        createdAt: serverTimestamp(),
    });

    return docRef.id;
}

/**
 * Update a bundle
 */
export async function updateBundle(
    id: string,
    input: UpdateBundleInput
): Promise<void> {
    const docRef = doc(db, COLLECTION, id);

    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) {
        updateData.title = input.title;
    }
    if (input.contentIds !== undefined) {
        updateData.contentIds = input.contentIds;
    }

    if (Object.keys(updateData).length > 0) {
        await updateDoc(docRef, updateData);
    }
}

/**
 * Add content to a bundle (optimized: stores mediaType to avoid trial-and-error API calls)
 */
export async function addContentToBundle(
    bundleId: string,
    tmdbId: string,
    mediaType: 'movie' | 'tv',
    metadata?: { title?: string; posterPath?: string }
): Promise<void> {
    const bundle = await getBundle(bundleId);
    if (!bundle) {
        throw new Error('Bundle not found');
    }

    // Check if already in bundle
    if (bundle.contentIds.includes(tmdbId)) {
        return;
    }

    // Add to both legacy contentIds AND new contentItems
    const newContentItem = {
        tmdbId,
        mediaType,
        ...(metadata?.title && { title: metadata.title }),
        ...(metadata?.posterPath && { posterPath: metadata.posterPath }),
    };

    await updateDoc(doc(db, COLLECTION, bundleId), {
        contentIds: [...bundle.contentIds, tmdbId],
        contentItems: [...(bundle.contentItems || []), newContentItem],
    });
}

/**
 * Remove content from a bundle
 */
export async function removeContentFromBundle(
    bundleId: string,
    tmdbId: string
): Promise<void> {
    const bundle = await getBundle(bundleId);
    if (!bundle) {
        throw new Error('Bundle not found');
    }

    await updateDoc(doc(db, COLLECTION, bundleId), {
        contentIds: bundle.contentIds.filter((id) => id !== tmdbId),
        ...(bundle.contentItems && {
            contentItems: bundle.contentItems.filter((item) => item.tmdbId !== tmdbId),
        }),
    });
}

/**
 * Delete a bundle
 */
export async function deleteBundle(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
}
