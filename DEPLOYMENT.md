# Watch Match Deployment Guide

## Prerequisites

1. **Firebase CLI installed** (v13.0.0 or later for App Hosting):
   ```bash
   npm install -g firebase-tools
   ```
2. **Logged into Firebase**: `firebase login`
3. **Firebase project**: `watch-match-6ee61`

---

## 1. Enable Email/Password Authentication

Before deploying, enable email/password auth:

1. Go to [Firebase Console → Authentication](https://console.firebase.google.com/project/watch-match-6ee61/authentication/providers)
2. Click **Email/Password** provider
3. Toggle **Enable** on → **Save**

---

## 2. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

## 3. Initialize Firebase Hosting (First Time Only)

```bash
firebase init hosting
```

When prompted:
- Select **"use an existing project"** → `watch-match-6ee61`
- For framework, select **"Next.js"**
- Choose default region (e.g., `us-central1`)

---

## 4. Build & Deploy

```bash
# Build and deploy in one command
firebase deploy --only hosting
```

Your app will be live at: **https://watch-match-6ee61.web.app**

---

## Environment Variables

For production, set environment variables in Firebase Console:
1. Go to Firebase Console → Hosting → Settings
2. Add variables under "Environment variables"

Or use `.env.production.local` for build-time variables.

---

## Custom Domain (Optional)

1. Firebase Console → Hosting → **Add custom domain**
2. Follow DNS verification steps
3. SSL is provisioned automatically
