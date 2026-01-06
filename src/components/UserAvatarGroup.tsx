// User avatar group component - shows stacked circular avatars with initials
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { MockUser } from '@/lib/mockUsers';

interface UserAvatarGroupProps {
    users: MockUser[];
    className?: string;
}

export function UserAvatarGroup({ users, className }: UserAvatarGroupProps) {
    if (!users || users.length === 0) return null;

    return (
        <div className={cn('flex -space-x-2', className)}>
            {users.map((user) => (
                <div
                    key={user.id}
                    className={cn(
                        'h-6 w-6 rounded-full',
                        'flex items-center justify-center',
                        'text-[10px] font-bold text-white',
                        'ring-2 ring-bg-dark',
                        'shadow-sm',
                        user.color
                    )}
                    title={user.displayName}
                >
                    {user.initial}
                </div>
            ))}
        </div>
    );
}
