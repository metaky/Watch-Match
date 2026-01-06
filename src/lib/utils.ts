// Utility functions for The Shared Screen

import { type ClassValue, clsx } from 'clsx';

/**
 * Merge class names conditionally
 */
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

/**
 * Format runtime from minutes to hours and minutes
 */
export function formatRuntime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/**
 * Get year from date string
 */
export function getYear(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).getFullYear().toString();
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
}
