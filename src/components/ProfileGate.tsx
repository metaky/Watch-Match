'use client';

import { useAppStore } from '@/store/useAppStore';
import { UserSelection } from './UserSelection';
import { useEffect, useState } from 'react';
import { useFirestoreSync } from '@/hooks/useFirestoreSync';

export function ProfileGate({ children }: { children: React.ReactNode }) {
    const { hasSelectedProfile } = useAppStore();
    const [mounted, setMounted] = useState(false);

    // Hydrate data from Firestore on app init
    const { isHydrated } = useFirestoreSync();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by waiting for mount
    if (!mounted) {
        return <div className="invisible">{children}</div>;
    }

    // Show UserSelection immediately (uses locally persisted Zustand state)
    // Only block the main content until Firestore is hydrated
    return (
        <>
            <UserSelection />
            {isHydrated ? (
                children
            ) : (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        <p className="text-muted-foreground text-sm">Loading your watchlist...</p>
                    </div>
                </div>
            )}
        </>
    );
}
