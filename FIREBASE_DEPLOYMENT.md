# Firebase Hosting Deployment Guide

This guide shows you how to deploy Calendar AI to Firebase Hosting so you can use it without localhost.

## Why Deploy to Firebase Hosting?

- Firebase Console doesn't allow adding `localhost` as an authorized domain in newer setups
- Deploying gives you a public URL that works with Google Sign-In
- Free hosting for static sites
- Automatic SSL/HTTPS
- Your app URL: `https://your-project-id.web.app`

## Prerequisites

- Firebase project created
- Firebase CLI installed
- Project built successfully

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open your browser to authenticate with Google.

## Step 3: Initialize Firebase Hosting

In your project directory (`c:\eyalg_repo\cal_ai`):

```bash
firebase init hosting
```

**Select the following options:**

1. **Use an existing project**: Select your Calendar AI project
2. **What do you want to use as your public directory?**: `dist`
3. **Configure as a single-page app?**: `Yes` ✅ (Important!)
4. **Set up automatic builds?**: `No` (we'll build manually)
5. **File dist/index.html already exists. Overwrite?**: `No`

This creates two files:
- `firebase.json` - Hosting configuration
- `.firebaserc` - Project configuration

## Step 4: Build Your App

```bash
npm run build
```

This creates the `dist` folder with your production build.

## Step 5: Deploy to Firebase

```bash
firebase deploy --only hosting
```

You'll see output like:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-id/overview
Hosting URL: https://your-project-id.web.app
```

## Step 6: Add Hosting URL to Authorized Domains

1. Copy your hosting URL: `https://your-project-id.web.app`
2. Go to Firebase Console → Authentication → Settings
3. Scroll to **Authorized domains**
4. Your hosting domain should already be there automatically:
   - `your-project-id.web.app`
   - `your-project-id.firebaseapp.com`

If not, add it manually.

## Step 7: Test Your Deployed App

1. Open: `https://your-project-id.web.app`
2. Try signing in with Google
3. Try creating an account with email
4. Test face recognition (if models are included)

## Configuration Files Created

### firebase.json
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### .firebaserc
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

## Updating Your App

When you make changes:

```bash
# 1. Build the app
npm run build

# 2. Deploy to Firebase
firebase deploy --only hosting
```

## Face Recognition Models

If using face recognition, ensure the models are in `public/models/` before building:

```
public/
└── models/
    ├── tiny_face_detector_model-weights_manifest.json
    ├── tiny_face_detector_model-shard1
    ├── face_landmark_68_model-weights_manifest.json
    ├── face_landmark_68_model-shard1
    ├── face_recognition_model-weights_manifest.json
    ├── face_recognition_model-shard1
    ├── face_recognition_model-shard2
    ├── ssd_mobilenetv1_model-weights_manifest.json
    ├── ssd_mobilenetv1_model-shard1
    └── ssd_mobilenetv1_model-shard2
```

These will be copied to `dist/models/` during build.

## Environment Variables

Your `.env` file is NOT deployed (it's in `.gitignore`). The app will use the hardcoded values in `src/config/firebase.ts` if environment variables are missing.

**Option 1: Use environment variables** (for development):
- Keep `.env` file locally
- Variables work in development: `npm run dev`

**Option 2: Hardcode for production**:
Edit `src/config/firebase.ts` to use your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx",
  measurementId: "G-XXXXXXXXXX"
};
```

Then rebuild and deploy.

## Custom Domain (Optional)

To use your own domain (e.g., `calendar-ai.com`):

1. Go to Firebase Console → Hosting
2. Click **Add custom domain**
3. Enter your domain
4. Follow the verification steps
5. Add the provided DNS records to your domain registrar
6. Wait for DNS propagation (up to 24 hours)
7. Firebase will automatically provision SSL certificate

Then add your custom domain to authorized domains:
- Firebase Console → Authentication → Settings → Authorized domains
- Add: `calendar-ai.com`

## Troubleshooting

### "Unauthorized domain" error
- Check that your hosting URL is in authorized domains
- Wait a few minutes after adding a domain
- Clear browser cache

### Face recognition not working
- Ensure models are in `public/models/` before building
- Check browser console for 404 errors
- Verify models are accessible at: `https://your-app.web.app/models/`

### Google Sign-In fails
- Verify Firebase hosting domain is in authorized domains
- Check that OAuth is enabled in Firebase Console
- Ensure project support email is set

### "Firebase not initialized"
- Check that `src/config/firebase.ts` has correct config
- Rebuild the app: `npm run build`
- Deploy again: `firebase deploy --only hosting`

## Deployment Workflow

```bash
# Daily workflow:
# 1. Make changes to your app
# 2. Test locally
npm run dev

# 3. Build for production
npm run build

# 4. Deploy
firebase deploy --only hosting

# 5. Visit your app
# https://your-project-id.web.app
```

## Firebase CLI Commands

```bash
# Login
firebase login

# Initialize hosting
firebase init hosting

# Deploy
firebase deploy --only hosting

# View hosting URL
firebase hosting:sites:list

# Open hosting in browser
firebase open hosting:site

# View logs
firebase hosting:channel:list

# Delete a deployment (careful!)
firebase hosting:channel:delete <channel-id>
```

## Cost

Firebase Hosting free tier includes:
- 10 GB storage
- 360 MB/day transfer
- Custom domain
- SSL certificate

This is more than enough for most apps!

## Next Steps

1. Deploy your app to Firebase Hosting
2. Share the URL with users: `https://your-project-id.web.app`
3. No need to worry about localhost anymore!
4. Users can sign in from anywhere
5. All data stored securely in Firestore

Your app is now live and accessible to anyone! 🎉
