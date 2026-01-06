// User Service - CRUD operations for users collection
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
    User,
    UserWithId,
    CreateUserInput,
    UpdateUserInput,
    StreamingService,
} from '@/types/firestore';

const COLLECTION = 'users';

/**
 * Get a user by their UID
 */
export async function getUser(uid: string): Promise<UserWithId | null> {
    const docRef = doc(db, COLLECTION, uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return {
        uid,
        ...docSnap.data(),
    } as UserWithId;
}

/**
 * Create or update a user profile
 */
export async function createOrUpdateUser(
    uid: string,
    input: CreateUserInput
): Promise<void> {
    const docRef = doc(db, COLLECTION, uid);

    await setDoc(
        docRef,
        {
            displayName: input.displayName,
            email: input.email,
            photoURL: input.photoURL || '',
            streamingServices: input.streamingServices || [],
            lastActive: serverTimestamp(),
        },
        { merge: true }
    );
}

/**
 * Update a user's profile
 */
export async function updateUser(
    uid: string,
    input: UpdateUserInput
): Promise<void> {
    const docRef = doc(db, COLLECTION, uid);

    const updateData: Record<string, unknown> = {
        lastActive: serverTimestamp(),
    };

    if (input.displayName !== undefined) {
        updateData.displayName = input.displayName;
    }
    if (input.photoURL !== undefined) {
        updateData.photoURL = input.photoURL;
    }
    if (input.streamingServices !== undefined) {
        updateData.streamingServices = input.streamingServices;
    }

    await updateDoc(docRef, updateData);
}

/**
 * Update a user's streaming services
 */
export async function updateStreamingServices(
    uid: string,
    services: StreamingService[]
): Promise<void> {
    const docRef = doc(db, COLLECTION, uid);

    await updateDoc(docRef, {
        streamingServices: services,
        lastActive: serverTimestamp(),
    });
}

/**
 * Update a user's last active timestamp
 */
export async function updateLastActive(uid: string): Promise<void> {
    const docRef = doc(db, COLLECTION, uid);

    await updateDoc(docRef, {
        lastActive: serverTimestamp(),
    });
}

/**
 * Delete a user profile
 */
export async function deleteUser(uid: string): Promise<void> {
    const docRef = doc(db, COLLECTION, uid);
    await deleteDoc(docRef);
}
