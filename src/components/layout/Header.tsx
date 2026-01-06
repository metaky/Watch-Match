// Header component with logo, notification, and avatar
'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

export function Header() {
    const { activeProfile, user1Name, user2Name } = useAppStore();

    const currentUserName = activeProfile === 'user1' ? user1Name : user2Name;
    const initial = currentUserName.charAt(0).toUpperCase();

    return (
        <header className={cn(
            'sticky top-0 z-50 w-full',
            'bg-bg-dark/90 backdrop-blur-md',
            'border-b border-border-default',
            'transition-colors duration-300'
        )}>
            <div className="px-4 py-3">
                <div className="flex items-center justify-between h-12">
                    {/* Logo & Title - Links to Home */}
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className={cn(
                            'flex items-center justify-center w-8 h-8 rounded-lg',
                            'bg-accent-primary text-white'
                        )}>
                            <Film className="w-5 h-5" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-text-primary">
                            The Shared Screen
                        </h1>
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Notification Bell */}
                        <button
                            className={cn(
                                'flex items-center justify-center w-10 h-10 rounded-full',
                                'hover:bg-white/10 transition-colors'
                            )}
                            aria-label="Notifications"
                        >
                            <Bell className="w-5 h-5 text-text-secondary" />
                        </button>

                        {/* User Avatar */}
                        <Link
                            href="/profile"
                            className="h-8 w-8 rounded-full bg-gradient-to-tr from-accent-primary to-purple-500 p-[2px] hover:scale-105 transition-transform active:scale-95"
                        >
                            <div className={cn(
                                'h-full w-full rounded-full',
                                'bg-bg-elevated flex items-center justify-center',
                                'border-2 border-bg-dark'
                            )}>
                                <span className="text-xs font-semibold text-text-primary">
                                    {initial}
                                </span>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
