# Watch Match - Cloud Run Deployment

## Prerequisites

- Google Cloud project with billing enabled
- GitHub repository connected to Cloud Run
- Firebase project already set up (`watch-match-6ee61`)

---

## Quick Start: Deploy via Cloud Console

### 1. Push to GitHub

```bash
git add .
git commit -m "Add Cloud Run deployment configuration"
git push origin main
```

### 2. Create Cloud Run Service

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click **"Create Service"**
3. Select **"Continuously deploy from a repository"**
4. Connect your GitHub repository
5. Configure build:
   - **Build type**: Dockerfile
   - **Source location**: `/Dockerfile`

### 3. Configure Environment Variables

In Cloud Run service settings, add these **Build-time substitution variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyCqCOb3sS1hvraWCsoyWe_Tm9GqvRUAgio` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `watch-match-6ee61.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `watch-match-6ee61` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `watch-match-6ee61.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `1028231844786` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:1028231844786:web:99bd7cd6c9a1b98456caab` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-KB1W39Z39L` |
| `NEXT_PUBLIC_TMDB_API_KEY` | `6cc8d21ba3543b7f5b7b8a65c0e2f0a1` |
| `NEXT_PUBLIC_OMDB_API_KEY` | `a7e35212` |

### 4. Service Settings

- **Region**: `us-central1` (or your preferred region)
- **Authentication**: Allow unauthenticated invocations
- **Container port**: `8080`
- **Memory**: 512 MiB (minimum recommended)
- **CPU**: 1

### 5. Deploy

Click **Deploy** and wait for the build to complete.

Your app will be available at: `https://your-service-name-xxxxx.run.app`

---

## Enable Firebase Email/Password Auth

Before using the app, enable authentication:

1. Go to [Firebase Console → Authentication](https://console.firebase.google.com/project/watch-match-6ee61/authentication/providers)
2. Click **Email/Password**
3. Toggle **Enable** → **Save**

---

## Custom Domain (Optional)

1. In Cloud Run, go to your service → **Manage Custom Domains**
2. Add your domain and follow DNS verification steps
