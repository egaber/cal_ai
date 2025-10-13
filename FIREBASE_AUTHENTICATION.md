# Firebase Authentication & Cloud Database Setup

This guide covers the setup of Firebase authentication with Google Sign-In, Email/Password authentication, Face Recognition, and cloud database (Firestore) for storing user data.

## Table of Contents
1. [Features](#features)
2. [Firebase Setup](#firebase-setup)
3. [Authentication Methods](#authentication-methods)
4. [Database Schema](#database-schema)
5. [Face Recognition Setup](#face-recognition-setup)
6. [Usage](#usage)
7. [Security](#security)

## Features

✅ **Multiple Authentication Methods**
- Google Sign-In with OAuth
- Email/Password authentication
- Face Recognition authentication

✅ **Cloud Database (Firestore)**
- User profiles with preferences
- Family members management
- Events storage
- Memories and AI context
- Secure credentials storage

✅ **Face Recognition**
- Biometric authentication using face-api.js
- Secure face descriptor storage
- Camera-based sign-in

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "calendar-ai")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable the following providers:
   - **Google**: Click Edit, enable, add authorized domains
   - **Email/Password**: Click Edit, enable

### 3. Set up Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in production mode**
3. Select a location closest to your users
4. Click "Enable"

### 4. Configure Firestore Security Rules

Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User data subcollections
      match /data/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 5. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (</>)
4. Register your app
5. Copy the configuration object

### 6. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Fill in your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
   ```

### 7. Configure Google OAuth

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **Google** → **Edit**
3. Add your app domain to **Authorized domains**:
   - For development: `localhost`
   - For production: your domain (e.g., `calendar-ai.com`)

## Authentication Methods

### 1. Google Sign-In

```typescript
import { signInWithGoogle } from '@/services/authService';

const handleGoogleSignIn = async () => {
  try {
    const user = await signInWithGoogle();
    console.log('Signed in:', user);
  } catch (error) {
    console.error('Sign in failed:', error);
  }
};
```

**Features:**
- One-click authentication
- Automatic profile information
- Google Calendar access token
- No password management

### 2. Email/Password

**Sign Up:**
```typescript
import { signUpWithEmail } from '@/services/authService';

const handleSignUp = async () => {
  try {
    const user = await signUpWithEmail(email, password, displayName);
    console.log('Account created:', user);
  } catch (error) {
    console.error('Sign up failed:', error);
  }
};
```

**Sign In:**
```typescript
import { signInWithEmail } from '@/services/authService';

const handleSignIn = async () => {
  try {
    const user = await signInWithEmail(email, password);
    console.log('Signed in:', user);
  } catch (error) {
    console.error('Sign in failed:', error);
  }
};
```

### 3. Face Recognition

**Requirements:**
- Camera access permission
- Face-api.js models (see [Face Recognition Setup](#face-recognition-setup))

**Sign In with Face:**
```typescript
import { findUserByFace } from '@/services/faceRecognitionService';

const handleFaceSignIn = async (videoElement: HTMLVideoElement) => {
  try {
    const result = await findUserByFace(videoElement);
    if (result.success) {
      console.log('Face recognized! User ID:', result.userId);
    }
  } catch (error) {
    console.error('Face recognition failed:', error);
  }
};
```

**Register Face:**
```typescript
import { storeFaceDescriptor, extractFaceDescriptor } from '@/services/authService';

const registerFace = async (uid: string, videoElement: HTMLVideoElement) => {
  const descriptor = await extractFaceDescriptor(videoElement);
  if (descriptor) {
    await storeFaceDescriptor(uid, descriptor);
  }
};
```

## Database Schema

### Users Collection (`/users/{userId}`)

```typescript
{
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  faceDescriptor?: number[];  // For face recognition
  faceDescriptorUpdatedAt?: Timestamp;
  familyMembers: FamilyMember[];
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: 'en' | 'he';
    timezone: string;
    calendarView: 'week' | 'month';
    notifications: boolean;
    geminiApiKey?: string;
    preferredLLMModel?: string;
  }
}
```

### User Data Subcollections

**Memories** (`/users/{userId}/data/memories`)
```typescript
{
  userMemories: UserMemory[];
  familyMemories: FamilyMemory[];
  places: Place[];
  travelInfo: TravelInfo[];
}
```

**Events** (`/users/{userId}/data/events`)
```typescript
{
  events: CalendarEvent[];
}
```

**Credentials** (`/users/{userId}/data/credentials`)
```typescript
{
  googleCalendarToken?: string;
  googleCalendarRefreshToken?: string;
}
```

## Face Recognition Setup

### 1. Download Face-api.js Models

Download the required models from the [face-api.js repository](https://github.com/justadudewhohacks/face-api.js):

1. Create a `public/models` directory in your project
2. Download these model files:
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1` and `shard2`
   - `ssd_mobilenetv1_model-weights_manifest.json`
   - `ssd_mobilenetv1_model-shard1` and `shard2`

Or use this command:
```bash
mkdir -p public/models
cd public/models
# Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights
```

### 2. Model Files Structure

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

### 3. Camera Permissions

Face recognition requires camera access. Users will be prompted to allow camera access when they click "Sign in with Face Recognition".

**Browser Support:**
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Requires HTTPS (even for localhost)

## Usage

### Authentication Flow

1. User visits the app
2. Welcome screen displays with three options:
   - Google Sign-In
   - Face Recognition
   - Email/Password
3. User chooses authentication method
4. On success, user data is loaded from Firestore
5. App displays the calendar interface

### Sign Out

```typescript
import { signOut } from '@/services/authService';

const handleSignOut = async () => {
  try {
    await signOut();
    // User will be redirected to Welcome screen
  } catch (error) {
    console.error('Sign out failed:', error);
  }
};
```

### Auth State Listener

The app automatically listens to authentication state changes:

```typescript
import { onAuthStateChange } from '@/services/authService';

useEffect(() => {
  const unsubscribe = onAuthStateChange((user) => {
    if (user) {
      console.log('User signed in:', user);
    } else {
      console.log('User signed out');
    }
  });

  return () => unsubscribe();
}, []);
```

## Security

### Best Practices

1. **Environment Variables**: Never commit `.env` file to version control
2. **Firestore Rules**: Ensure users can only access their own data
3. **Face Descriptors**: Stored as numerical arrays (not images)
4. **API Keys**: Use Firebase App Check for additional security
5. **HTTPS**: Always use HTTPS in production

### Face Recognition Security

- Face descriptors are 128-dimensional vectors (not actual images)
- Descriptors are stored securely in Firestore
- Comparison threshold set to 0.6 (adjustable for security/usability)
- Camera access only granted with user permission

### Credentials Storage

- Google Calendar tokens stored in secure Firestore subcollection
- Firestore rules prevent unauthorized access
- Tokens never exposed in client code
- Refresh tokens handled securely by Firebase

## Troubleshooting

### Firebase Connection Issues

**Problem**: "Firebase not initialized"
**Solution**: Ensure `.env` file has correct Firebase configuration

### Google Sign-In Fails

**Problem**: "Unauthorized domain"
**Solution**: Add your domain to Firebase Console → Authentication → Authorized domains

### Face Recognition Not Working

**Problem**: "Failed to load models"
**Solution**: 
1. Check `public/models` directory exists
2. Verify all model files are present
3. Check browser console for specific errors

### Camera Access Denied

**Problem**: "Camera access denied"
**Solution**:
1. Check browser permissions
2. For Safari, ensure using HTTPS
3. Restart browser if needed

## Next Steps

1. Set up Firebase project and enable authentication
2. Configure Firestore database and security rules
3. Add environment variables
4. Download face-api.js models
5. Test authentication flow
6. Configure Google Calendar integration (optional)

## Support

For issues or questions:
- Check Firebase documentation: https://firebase.google.com/docs
- Face-api.js: https://github.com/justadudewhohacks/face-api.js
- Project issues: Create an issue in the repository
