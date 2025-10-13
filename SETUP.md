# Quick Setup Guide

Follow these steps to set up Firebase authentication and cloud database for Calendar AI.

## Prerequisites

- Node.js 16+ installed
- A Google account
- Camera (for face recognition)

## Step 1: Install Dependencies

Already done! The following packages are installed:
- `firebase` - Firebase SDK
- `face-api.js` - Face recognition library

## Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "calendar-ai" (or your preferred name)
4. Follow the wizard to create the project

## Step 3: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable:
   - ✅ **Google** (recommended)
   - ✅ **Email/Password**

## Step 4: Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Select **Production mode**
4. Choose a location (e.g., us-central)
5. Click "Enable"

## Step 5: Set Security Rules

1. In Firestore, go to **Rules** tab
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /data/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

3. Click "Publish"

## Step 6: Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click web icon `</>`
4. Register app (name: "Calendar AI")
5. Copy the config object

## Step 7: Configure Environment Variables

1. Copy the example file:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` and fill in your Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
   ```

## Step 8: Download Face Recognition Models (Optional)

For face recognition to work, you need to download the face-api.js models:

1. Create the models directory:
   ```bash
   mkdir public\models
   ```

2. Download models from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

   Required files:
   - `tiny_face_detector_model-*`
   - `face_landmark_68_model-*`
   - `face_recognition_model-*`
   - `ssd_mobilenetv1_model-*`

3. Place all files in `public/models/`

**Quick download script** (if you have curl):
```bash
cd public\models
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard2
cd ..\..
```

## Step 9: Run the Application

```bash
npm run dev
```

The app will open at http://localhost:5173

## Step 10: Test Authentication

1. You should see the Welcome screen
2. Try signing in with:
   - **Google** (easiest)
   - **Email/Password** (create account first)
   - **Face Recognition** (requires models from Step 8)

## What's Configured

✅ **Authentication**
- Google Sign-In
- Email/Password
- Face Recognition

✅ **Cloud Database (Firestore)**
- User profiles
- Family members
- Events
- Memories
- Credentials

✅ **Security**
- Firestore rules restrict access to user's own data
- Environment variables for sensitive config
- Secure credential storage

## Verification Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Google + Email/Password)
- [ ] Firestore database created
- [ ] Security rules configured
- [ ] `.env` file created with Firebase config
- [ ] Face models downloaded (optional)
- [ ] App runs successfully
- [ ] Can sign in with Google
- [ ] Can create account with email
- [ ] User data appears in Firestore

## Troubleshooting

### "Firebase not initialized"
- Check `.env` file exists and has correct values
- Restart dev server after creating `.env`

### "Unauthorized domain"
- Add `localhost` to Firebase Console → Authentication → Authorized domains

### Face recognition not working
- Ensure models are in `public/models/`
- Check browser console for errors
- Allow camera permissions

### Can't sign in with Google
- Check Firebase Console → Authentication → Google is enabled
- Verify authorized domains include localhost

## Next Steps

After setup is complete:

1. **Customize Family Members**: Update default family in `src/services/authService.ts`
2. **Add More Auth Providers**: Facebook, Apple, etc. in Firebase Console
3. **Set up Google Calendar Sync**: Follow `GOOGLE_CALENDAR_INTEGRATION.md`
4. **Configure AI Assistant**: Add Gemini API key
5. **Deploy to Production**: Update authorized domains in Firebase

## Support

For detailed information, see:
- **Full Documentation**: `FIREBASE_AUTHENTICATION.md`
- **Firebase Docs**: https://firebase.google.com/docs
- **Face-api.js**: https://github.com/justadudewhohacks/face-api.js
