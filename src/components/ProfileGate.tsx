'use client';

import { useAppStore } from '@/store/useAppStore';
import { UserSelection } from './UserSelection';
import { useEffect, useState } from 'react';

export function ProfileGate({ children }: { children: React.ReactNode }) {
    const { hasSelectedProfile } = useAppStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by waiting for mount
    if (!mounted) {
        return <div className="invisible">{children}</div>;
    }

    return (
        <>
            <UserSelection />
            {children}
        </>
    );
}
