# Flutter Authentication Guide

This guide explains how authentication works in the Calendar AI Flutter app and how to use it.

## Overview

The Flutter app uses Firebase Authentication with two sign-in methods:
1. **Google Sign-In** - One-tap authentication with Google account
2. **Email/Password** - Traditional email and password authentication

After successful authentication, the app automatically:
- Creates or retrieves user profile from Firestore
- Loads family data if user belongs to a family
- Syncs tasks and events in real-time

## Authentication Flow

```
App Start
    ↓
Firebase Init
    ↓
Check Auth State
    ↓
┌─────────────┴─────────────┐
│                           │
Not Authenticated    Authenticated
    ↓                      ↓
Login Screen         Main App (Tasks/Calendar)
    ↓
Sign In (Google/Email)
    ↓
Create/Load User Profile
    ↓
Load Family Data (if exists)
    ↓
Main App
```

## Files Structure

```
flutter/lib/
├── services/
│   ├── firebase_service.dart          # Core Firebase initialization
│   ├── auth_service.dart              # Authentication logic
│   ├── task_firestore_service.dart    # Task data access
│   └── event_firestore_service.dart   # Event data access
├── providers/
│   ├── auth_provider.dart             # Auth state management
│   ├── firebase_task_provider.dart    # Task state management
│   └── firebase_event_provider.dart   # Event state management
├── screens/
│   └── login_screen.dart              # Login & Sign-up UI
└── main.dart                          # App entry with AuthGate
```

## Key Components

### 1. AuthService (`lib/services/auth_service.dart`)

Handles all authentication operations:

```dart
// Sign in with Google
final profile = await authService.signInWithGoogle();

// Sign in with email/password
final profile = await authService.signInWithEmail(email, password);

// Sign up with email/password
final profile = await authService.signUpWithEmail(email, password, displayName);

// Sign out
await authService.signOut();

// Reset password
await authService.resetPassword(email);
```

### 2. Auth Providers (`lib/providers/auth_provider.dart`)

Riverpod providers for state management:

```dart
// Watch auth state (Firebase User)
final authState = ref.watch(authStateProvider);

// Get current user profile
final profileAsync = ref.watch(currentUserProfileProvider);

// Perform auth operations
await ref.read(authNotifierProvider.notifier).signInWithGoogle();
await ref.read(authNotifierProvider.notifier).signInWithEmail(email, password);
await ref.read(authNotifierProvider.notifier).signOut();
```

### 3. AuthGate (`lib/main.dart`)

Automatically routes to login or main app based on auth state:

```dart
authState.when(
  data: (user) => user == null ? LoginScreen() : MainScreen(),
  loading: () => LoadingIndicator(),
  error: (_, __) => LoginScreen(),
);
```

## User Profile Schema

After authentication, user profile is stored in Firestore:

```
/users/{userId}
{
  uid: string
  email: string
  displayName: string
  photoURL?: string
  phoneNumber?: string
  familyId?: string           // Set when user joins/creates family
  preferences: {
    theme: string
    language: string
    timezone: string
    calendarView: string
    notifications: boolean
  }
  createdAt: timestamp
  lastLoginAt: timestamp
}
```

## Google Sign-In Setup

### Android
1. Add your SHA-1 and SHA-256 keys to Firebase Console
2. Download `google-services.json` to `flutter/android/app/`

### iOS
1. Download `GoogleService-Info.plist` to `flutter/ios/Runner/`
2. Add URL scheme to `Info.plist`

### Web
Already configured via Firebase config

## Usage Examples

### Check if user is authenticated

```dart
@override
Widget build(BuildContext context, WidgetRef ref) {
  final authState = ref.watch(authStateProvider);
  
  return authState.when(
    data: (user) {
      if (user == null) {
        return Text('Please sign in');
      }
      return Text('Welcome ${user.displayName}');
    },
    loading: () => CircularProgressIndicator(),
    error: (error, _) => Text('Error: $error'),
  );
}
```

### Sign in with Google

```dart
Future<void> _signInWithGoogle() async {
  try {
    await ref.read(authNotifierProvider.notifier).signInWithGoogle();
    // Automatically navigates to main app
  } catch (e) {
    // Show error to user
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Sign-in failed: $e')),
    );
  }
}
```

### Sign in with Email/Password

```dart
Future<void> _signIn() async {
  final email = emailController.text.trim();
  final password = passwordController.text;
  
  try {
    await ref.read(authNotifierProvider.notifier).signInWithEmail(
      email,
      password,
    );
  } catch (e) {
    // Show error
  }
}
```

### Get current user profile

```dart
final profileAsync = ref.watch(currentUserProfileProvider);

profileAsync.when(
  data: (profile) {
    if (profile == null) return Text('Not signed in');
    return Column(
      children: [
        Text('Name: ${profile.displayName}'),
        Text('Email: ${profile.email}'),
        if (profile.familyId != null)
          Text('Family ID: ${profile.familyId}'),
      ],
    );
  },
  loading: () => CircularProgressIndicator(),
  error: (error, _) => Text('Error loading profile'),
);
```

### Sign out

```dart
Future<void> _signOut() async {
  try {
    await ref.read(authNotifierProvider.notifier).signOut();
    // Automatically returns to login screen
  } catch (e) {
    // Handle error
  }
}
```

## Family Integration

After authentication, family data is automatically loaded:

1. User profile contains `familyId` (if user belongs to family)
2. `currentFamilyIdProvider` is automatically updated after sign-in
3. Task and event providers use this family ID to fetch data

```dart
// Family ID is auto-set after authentication
final familyId = ref.watch(currentFamilyIdProvider);

// Tasks automatically filtered by family + user
final tasksAsync = ref.watch(firebaseTasksProvider);

// Events automatically filtered by family + user
final eventsAsync = ref.watch(firebaseEventsProvider);
```

## Security

### Firestore Security Rules

Authentication is enforced by Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Family members can access family data
    match /families/{familyId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.memberUserIds;
      
      // Tasks and events require user authentication
      match /members/{userId}/tasks/{taskId} {
        allow read, write: if request.auth != null && 
          request.auth.uid == userId;
      }
      
      match /members/{userId}/calendars/{source}/events/{eventId} {
        allow read, write: if request.auth != null && 
          request.auth.uid == userId;
      }
    }
  }
}
```

### Password Requirements

- Minimum 6 characters
- Enforced by Firebase Authentication

### Google Calendar Token

Google Calendar access token is securely stored in:
```
/users/{userId}/data/credentials
{
  googleCalendarToken: string
}
```

## Error Handling

Common authentication errors:

```dart
try {
  await signIn();
} catch (e) {
  if (e.toString().contains('user-not-found')) {
    // User doesn't exist
  } else if (e.toString().contains('wrong-password')) {
    // Incorrect password
  } else if (e.toString().contains('email-already-in-use')) {
    // Email already registered
  } else if (e.toString().contains('invalid-email')) {
    // Invalid email format
  } else if (e.toString().contains('weak-password')) {
    // Password too weak
  } else {
    // Other error
  }
}
```

## Testing

### Test with existing web app account

1. Sign in to web app first
2. Use same Google account or email/password in Flutter app
3. Your tasks and events will automatically sync

### Create new test account

```bash
# Run the app
cd flutter
flutter run

# Click "Sign Up" in the app
# Or use Google Sign-In
```

## Troubleshooting

### "Google Sign-In was cancelled"
- User closed the Google Sign-In popup
- Normal behavior, not an error

### "Failed to sign in with Google"
- Check Firebase configuration
- Ensure google_sign_in package is installed
- Verify SHA keys are added (Android)

### "User profile not found"
- Profile creation failed
- Check Firestore permissions
- Check Firebase console for errors

### "No family data"
- User hasn't joined or created a family yet
- Normal for new users
- Family setup will be added in future update

## Next Steps

1. **Run flutter pub get** to install dependencies
2. **Configure .env** with Firebase credentials
3. **Run the app** and test authentication
4. **Sign in** with Google or email/password
5. **Access your data** from the web app

## Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Google Sign-In Flutter Package](https://pub.dev/packages/google_sign_in)
- [Riverpod State Management](https://riverpod.dev/)
