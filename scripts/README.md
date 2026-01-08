# Watchlist Import Script

Imports titles from a Google Takeout CSV into Watch Match's Firestore.

## Prerequisites

1. **Firebase Service Account**: You need a service account key file for Firebase Admin access.
   - Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `service-account.json` in the project root (it's gitignored)

2. **Your Firebase UID**: Find your user ID in Firebase Console → Authentication → Users

## Usage

```bash
# Test with sample data (dry run - no changes made)
npx ts-node scripts/import-watchlist.ts --csv=scripts/sample-watchlist.csv --user-id=YOUR_UID --dry-run

# Import for real
npx ts-node scripts/import-watchlist.ts --csv=path/to/your-watchlist.csv --user-id=YOUR_UID
```

## CSV Format

The script expects a CSV with columns:
- `Added Time` (ignored)
- `Title` (the movie or TV show name)

Example:
```csv
Added Time	Title
2024-01-15T10:30:00Z	Breaking Bad
2024-01-14T15:45:00Z	The Dark Knight
```

## What It Does

1. Reads each title from the CSV
2. Searches TMDB for both movies and TV shows
3. Picks the best match (exact title match preferred, then most popular)
4. Writes to Firestore's `user_interactions` collection with status `'liked'`
5. Skips titles that already exist in your watchlist

## Output

The script shows progress and a summary:
- ✅ Imported (or would import in dry-run)
- ⏭️ Skipped (already exists)
- ❓ Not found on TMDB
- ❌ Error

Titles not found are listed at the end for manual adding in the app.
