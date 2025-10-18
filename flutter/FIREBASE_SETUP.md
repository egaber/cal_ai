# Firebase Setup Guide for Calendar AI Flutter App

This guide explains how to configure the Flutter app to connect to your existing Firebase/Firestore database so it can access all current user data, tasks, and events.

## Prerequisites

- Flutter SDK installed (3.x or higher)
- Access to your Firebase project console
- The same Firebase project used by your web app

## Step 1: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (the same one used by the web app)
3. Click the gear icon ⚙️ → **Project settings**
4. Scroll down to **Your apps** section
5. If you haven't added a Flutter/Web app yet:
   - Click **Add app** → Select **Web** (</>) 
   - Register the app with a nickname like "Calendar AI Flutter"
6. Copy the configuration values:
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID
   - Measurement ID (optional)

## Step 2: Create Environment Configuration

1. Navigate to the `flutter/` directory
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and fill in your Firebase credentials:
   ```env
   FIREBASE_API_KEY=AIzaSy...
   FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=1234567890
   FIREBASE_APP_ID=1:1234567890:web:abc123
   FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

4. **Important**: Add `.env` to `.gitignore` (already done) to keep credentials secure

## Step 3: Install Dependencies

Run the following command in the `flutter/` directory:

```bash
flutter pub get
```

This will install:
- `firebase_core` - Firebase initialization
- `firebase_auth` - Authentication
- `cloud_firestore` - Database access
- `hive` - Local caching
- `flutter_dotenv` - Environment variables
- Other dependencies

## Step 4: Update Assets in pubspec.yaml

The `pubspec.yaml` already includes the `.env` file in assets. Verify it contains:

```yaml
flutter:
  assets:
    - .env
    - assets/images/
    - assets/icons/
```

## Step 5: Verify Firestore Rules

The app follows the existing Firestore security rules structure:

```
/families/{familyId}/members/{userId}/tasks/{taskId}
/families/{familyId}/members/{userId}/calendars/{source}/events/{eventId}
```

Ensure your Firestore rules match the ones in `/firestore.rules` at the root of the project.

## Step 6: Set Family ID and User ID

After Firebase is initialized, you need to set the family ID and user ID:

### For Development/Testing

The app currently signs in anonymously. You'll need to manually set the family ID:

1. In `lib/main.dart`, after authentication, add:
   ```dart
   // Set family ID after authentication
   container.read(currentFamilyIdProvider.notifier).state = 'your-family-id';
   ```

2. Find your family ID in Firestore console under `/families` collection

### For Production

Implement proper authentication flow:
1. Replace anonymous auth with email/password or Google Sign-In
2. Store family ID in user profile
3. Load family ID automatically after authentication

## Step 7: Run the App

### Web (PWA)

```bash
flutter run -d chrome
```

### Windows Desktop

```bash
flutter run -d windows
```

### Build for Production

```bash
# Web
flutter build web

# Windows
flutter build windows
```

## Data Structure

### Tasks

Tasks are stored at:
```
/families/{familyId}/members/{userId}/tasks/{taskId}
```

Fields match the TypeScript `Task` interface from `src/types/task.ts`:
- `id`, `title`, `description`
- `status`, `priority`, `category`
- `estimatedDuration`, `deadline`
- `assignedToMemberIds[]`
- `subtasks[]`
- And more...

### Events

Events are stored at:
```
/families/{familyId}/members/{userId}/calendars/{source}/events/{eventId}
```

Where `{source}` is typically:
- `local` - Manually created events
- `google` - Synced from Google Calendar

Fields match the TypeScript `CalendarEvent` interface from `src/types/calendar.ts`:
- `id`, `title`, `description`
- `startTime`, `endTime`
- `category`, `priority`
- `memberId`, `memberIds[]`
- `isAllDay`, `recurrence`
- And more...

## Features

### Available Now
✅ Real-time task synchronization from Firestore
✅ Real-time event synchronization from Firestore
✅ Offline-first with local caching
✅ Create new tasks (syncs to Firestore)
✅ Create new events (syncs to Firestore)
✅ Update tasks and events
✅ Delete tasks and events
✅ View all tasks and events from web app

### Firebase Providers

The app uses Riverpod providers for state management:

**For Tasks:**
- `firebaseTasksProvider` - Stream of all tasks
- `firebaseTaskNotifierProvider` - Task CRUD operations

**For Events:**
- `firebaseEventsProvider` - Stream of events
- `allFirebaseEventsProvider` - All events from all sources
- `eventsForDateProvider` - Events for specific date
- `firebaseEventNotifierProvider` - Event CRUD operations

### Usage Example

```dart
// Watch tasks in real-time
final tasksAsync = ref.watch(firebaseTasksProvider);

tasksAsync.when(
  data: (tasks) => ListView.builder(...),
  loading: () => CircularProgressIndicator(),
  error: (err, stack) => Text('Error: $err'),
);

// Create a task
await ref.read(firebaseTaskNotifierProvider.notifier).addTask(newTask);

// Watch events for a date
final eventsAsync = ref.watch(eventsForDateProvider(selectedDate));
```

## Troubleshooting

### Firebase not initialized
- Ensure `.env` file exists with correct credentials
- Check console for initialization errors
- Verify Firebase project exists and credentials are correct

### No data appearing
- Verify `currentFamilyIdProvider` is set
- Check Firestore rules allow read access
- Confirm data exists in Firestore console
- Check console for authentication errors

### Authentication issues
- For development, app signs in anonymously
- Check Firebase console that anonymous auth is enabled
- For production, implement proper auth flow

### Firestore permission denied
- Verify Firestore security rules match `/firestore.rules`
- Ensure user is authenticated
- Confirm family ID is correct

## Next Steps

1. **Configure Environment**: Create `.env` with Firebase credentials
2. **Install Dependencies**: Run `flutter pub get`
3. **Set Family ID**: Update code to use your family ID
4. **Run App**: Test with `flutter run`
5. **Verify Sync**: Create a task in Flutter, check it appears in web app
6. **Implement Auth**: Replace anonymous auth with proper authentication

## Additional Resources

- [Flutter Firebase Setup](https://firebase.google.com/docs/flutter/setup)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Riverpod Documentation](https://riverpod.dev/)
- [Flutter Desktop Support](https://flutter.dev/desktop)
