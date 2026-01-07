// Time utility functions
import { Timestamp } from 'firebase/firestore';

/**
 * Format a date as a relative time string (e.g., "2h ago", "1d ago", "1w ago")
 * @param date - Date object or Firestore Timestamp
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date | Timestamp): string {
    const now = new Date();
    let targetDate: Date;

    if (!date) {
        return '';
    }

    // Handle Firestore Timestamp (instance or serialized)
    if (typeof (date as any).toDate === 'function') {
        targetDate = (date as Timestamp).toDate();
    } else if (typeof (date as any).toMillis === 'function') {
        targetDate = new Date((date as any).toMillis());
    } else if ('seconds' in (date as any)) {
        // Serialized timestamp
        targetDate = new Date((date as any).seconds * 1000);
    } else {
        // Assume Date object, string, or number
        targetDate = new Date(date as any);
    }

    // Check for invalid date
    if (isNaN(targetDate.getTime())) {
        return '';
    }
    const diffMs = now.getTime() - targetDate.getTime();

    // Convert to various units
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMonths >= 1) {
        return `${diffMonths}mo ago`;
    } else if (diffWeeks >= 1) {
        return `${diffWeeks}w ago`;
    } else if (diffDays >= 1) {
        return `${diffDays}d ago`;
    } else if (diffHours >= 1) {
        return `${diffHours}h ago`;
    } else if (diffMinutes >= 1) {
        return `${diffMinutes}m ago`;
    } else {
        return 'just now';
    }
}
