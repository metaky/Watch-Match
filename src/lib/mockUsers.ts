// Mock user data for the app - will be replaced with real user profiles later
// These represent the two users sharing the app (partners)

export interface MockUser {
    id: string;
    displayName: string;
    initial: string;
    color: string; // Tailwind color class for avatar background
}

/**
 * Mock users for the app
 * In production, these will come from Firebase Auth and Firestore
 */
export const MOCK_USERS: Record<string, MockUser> = {
    user1: {
        id: 'user1',
        displayName: 'John',
        initial: 'J',
        color: 'bg-blue-500',
    },
    user2: {
        id: 'user2',
        displayName: 'Sarah',
        initial: 'S',
        color: 'bg-pink-500',
    },
};

/**
 * Get the current logged-in user (mock)
 */
export function getCurrentUser(): MockUser {
    return MOCK_USERS.user1;
}

/**
 * Get the partner user (mock)
 */
export function getPartnerUser(): MockUser {
    return MOCK_USERS.user2;
}

/**
 * Get both users as an array
 */
export function getBothUsers(): MockUser[] {
    return [MOCK_USERS.user1, MOCK_USERS.user2];
}
