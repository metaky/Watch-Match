// Bottom Navigation Bar - Updated styling
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
}

export function BottomNav() {
    const pathname = usePathname();

    const navItems: NavItem[] = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/search', label: 'Search', icon: Search },
        { href: '/bundles', label: 'Bundles', icon: Package },
    ];

    return (
        <nav className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'border-t border-border-default',
            'bg-bg-dark/95 backdrop-blur-lg',
            'pb-safe'
        )}>
            <div className="max-w-[480px] mx-auto grid grid-cols-3 h-16">
                {navItems.map((item) => (
                    <NavButton
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                    />
                ))}
            </div>
        </nav>
    );
}

interface NavButtonProps {
    item: NavItem;
    isActive: boolean;
}

function NavButton({ item, isActive }: NavButtonProps) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className={cn(
                'inline-flex flex-col items-center justify-center px-5 group',
                'transition-colors duration-200'
            )}
        >
            <Icon
                className={cn(
                    'w-6 h-6 mb-1 transition-all duration-200',
                    isActive
                        ? 'text-accent-primary scale-110'
                        : 'text-text-tertiary group-hover:text-accent-primary'
                )}
                fill={isActive ? 'currentColor' : 'none'}
            />
            <span className={cn(
                'text-[10px] font-medium transition-colors duration-200',
                isActive
                    ? 'text-accent-primary'
                    : 'text-text-tertiary group-hover:text-accent-primary'
            )}>
                {item.label}
            </span>
        </Link>
    );
}
