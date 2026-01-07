'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    browserLocalPersistence,
    setPersistence,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
    currentUser: User | null;
    isAuthLoading: boolean;
    authError: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    // Set up auth state listener on mount
    useEffect(() => {
        // Ensure persistent auth session (survives browser restart)
        setPersistence(auth, browserLocalPersistence).catch(console.error);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setIsAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        setAuthError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: unknown) {
            const errorMessage = getAuthErrorMessage(error);
            setAuthError(errorMessage);
            throw error;
        }
    };

    const signUp = async (email: string, password: string) => {
        setAuthError(null);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error: unknown) {
            const errorMessage = getAuthErrorMessage(error);
            setAuthError(errorMessage);
            throw error;
        }
    };

    const signOut = async () => {
        setAuthError(null);
        try {
            await firebaseSignOut(auth);
        } catch (error: unknown) {
            const errorMessage = getAuthErrorMessage(error);
            setAuthError(errorMessage);
            throw error;
        }
    };

    const clearError = () => setAuthError(null);

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                isAuthLoading,
                authError,
                signIn,
                signUp,
                signOut,
                clearError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Helper to convert Firebase auth errors to user-friendly messages
function getAuthErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        switch (code) {
            case 'auth/invalid-email':
                return 'Invalid email address.';
            case 'auth/user-disabled':
                return 'This account has been disabled.';
            case 'auth/user-not-found':
                return 'No account found with this email.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/invalid-credential':
                return 'Invalid email or password.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password must be at least 6 characters.';
            case 'auth/too-many-requests':
                return 'Too many attempts. Please try again later.';
            default:
                return 'An error occurred. Please try again.';
        }
    }
    return 'An unexpected error occurred.';
}
