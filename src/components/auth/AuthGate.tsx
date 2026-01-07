'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from './LoginPage';
import { UserSelection } from '@/components/UserSelection';
import { useAppStore } from '@/store/useAppStore';
import { getUserProfile } from '@/lib/services/userService';
import { Loader2 } from 'lucide-react';

/**
 * AuthGate protects the app content:
 * 1. If not authenticated → show LoginPage
 * 2. If authenticated but no profile claimed → show UserSelection
 * 3. If authenticated and profile claimed → show children (app content)
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
    const { currentUser, isAuthLoading } = useAuth();
    const { hasSelectedProfile, selectProfile } = useAppStore();
    const [isCheckingProfile, setIsCheckingProfile] = useState(false);
    const [hasCheckedProfile, setHasCheckedProfile] = useState(false);

    // Check if the authenticated user has already claimed a profile
    useEffect(() => {
        async function checkUserProfile() {
            if (!currentUser) {
                setHasCheckedProfile(false);
                return;
            }

            setIsCheckingProfile(true);
            try {
                const profile = await getUserProfile(currentUser.uid);
                if (profile) {
                    // User has already claimed a profile, auto-select it
                    selectProfile(profile);
                }
            } catch (error) {
                console.error('Error checking user profile:', error);
            } finally {
                setIsCheckingProfile(false);
                setHasCheckedProfile(true);
            }
        }

        checkUserProfile();
    }, [currentUser, selectProfile]);

    // Show loading while checking auth state
    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-bg-app flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
                    <p className="text-text-secondary text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated → show login
    if (!currentUser) {
        return <LoginPage />;
    }

    // Authenticated but still checking if user has a profile
    if (isCheckingProfile || !hasCheckedProfile) {
        return (
            <div className="min-h-screen bg-bg-app flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
                    <p className="text-text-secondary text-sm">Loading your profile...</p>
                </div>
            </div>
        );
    }

    // Authenticated but no profile selected → show profile selection
    // UserSelection will call claimProfile when user selects
    if (!hasSelectedProfile) {
        return <UserSelection />;
    }

    // Fully authenticated and profile selected → show app content
    return <>{children}</>;
}
