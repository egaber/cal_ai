# Tech Context

## Development Environment

### Required Tools
- **Flutter SDK**: 3.24.0 or higher (stable channel)
- **Dart SDK**: Bundled with Flutter (3.5.0+)
- **IDE**: Visual Studio Code with Flutter extension
- **Platform**: Windows 11 development machine
- **Git**: For version control

### Installation Verification
```bash
flutter doctor -v
```

Expected output should show:
- Flutter SDK installed
- Dart SDK available
- VS Code + Flutter extension
- Connected devices or web browser available

## Project Dependencies

### pubspec.yaml Configuration

```yaml
name: calendar_ai_flutter
description: Mobile app for Calendar AI with iOS-native feel
version: 1.0.0+1

environment:
  sdk: '>=3.5.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.6.1
  riverpod_annotation: ^2.6.1
  
  # Local Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  shared_preferences: ^2.3.3
  
  # Firebase
  firebase_core: ^3.8.1
  cloud_firestore: ^5.7.1
  firebase_auth: ^5.3.3
  
  # Navigation
  go_router: ^14.6.2
  
  # UI Utilities
  intl: ^0.20.1
  uuid: ^4.5.1
  cupertino_icons: ^1.0.8
  
  # Code Generation
  freezed_annotation: ^2.4.4
  json_annotation: ^4.9.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  
  # Linting
  flutter_lints: ^5.0.0
  
  # Code Generation
  build_runner: ^2.4.14
  freezed: ^2.5.7
  json_serializable: ^6.9.2
  riverpod_generator: ^2.6.2
  
  # Testing
  mockito: ^5.4.4
  
  # Hive
  hive_generator: ^2.0.1

flutter:
  uses-material-design: true
  
  # Assets
  assets:
    - assets/images/
    - assets/icons/
```

## Technology Choices

### Flutter 3.x
**Why:** Latest stable version with best performance and features
- Native compilation for iOS/Android
- Web support for PWA
- Excellent developer experience
- Hot reload for fast iteration

### Riverpod 2.x
**Why:** Modern, type-safe state management
- Compile-time safety
- Better testability than Provider
- No BuildContext required
- Excellent DevTools integration
- Code generation support

### Hive
**Why:** Fast, lightweight local database
- No native dependencies
- Type-safe
- Lazy loading
- Encryption support
- Better performance than sqflite for our use case

### Firebase
**Why:** Existing backend infrastructure
- Already used in web app
- Real-time sync capabilities
- Authentication handled
- Security rules defined
- Free tier sufficient for MVP

### go_router
**Why:** Declarative navigation
- Type-safe routes
- Deep linking support
- Query parameters
- Redirect logic
- Better than Navigator 1.0

### Freezed
**Why:** Immutable data classes
- Generated code for models
- Pattern matching
- copyWith method
- Equality/hashCode
- JSON serialization

## Development Constraints

### Platform Limitations

#### iOS (Primary Target)
- **Minimum**: iOS 14.0
- **Recommended**: iOS 16.0+
- **PWA Support**: Limited but functional
- **Safe Areas**: Must handle notch and home indicator
- **Haptics**: Taptic Engine available

#### Web (Secondary Target)
- **Browsers**: Chrome, Safari, Firefox, Edge
- **PWA**: Service worker for offline
- **Limitations**: No file system access, limited native features
- **Performance**: Generally good, but not native

#### Android (Future)
- **Minimum**: Android 7.0 (API 24)
- **Recommended**: Android 12+ (API 31)
- **Material**: Will use Material Design

### Performance Requirements
- **App Launch**: < 2 seconds cold start
- **Frame Rate**: Maintain 60fps during scrolling
- **Build Time**: < 30 seconds for debug
- **Bundle Size**: < 15MB for web

### Code Quality Requirements
- **Max Lines**: 500 lines per file
- **Test Coverage**: Aim for 80%+ on business logic
- **Linting**: No warnings in production builds
- **Documentation**: All public APIs documented

## Firebase Configuration

### Shared with Web App
The Flutter app uses the **same Firebase project** as the web app:

**Project ID**: (from existing `.firebaserc`)
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### Required Setup Files

#### 1. Firebase Configuration (iOS)
- Download `GoogleService-Info.plist` from Firebase Console
- Place in `ios/Runner/`
- Add to Xcode project

#### 2. Firebase Configuration (Android)
- Download `google-services.json` from Firebase Console
- Place in `android/app/`

#### 3. Firebase Configuration (Web)
Create `lib/config/firebase_config.dart`:
```dart
// Copy values from existing web app's firebase.ts
const firebaseConfig = FirebaseOptions(
  apiKey: 'your-api-key',
  authDomain: 'your-auth-domain',
  projectId: 'your-project-id',
  storageBucket: 'your-storage-bucket',
  messagingSenderId: 'your-sender-id',
  appId: 'your-app-id',
);
```

### Firestore Schema
Uses existing schema from web app (see `firestore.rules`):
- **Collection**: `tasks` - Task documents
- **Collection**: `users` - User profiles
- **Collection**: `families` - Family groups
- **Collection**: `events` - Calendar events

## Build Configuration

### analysis_options.yaml
```yaml
include: package:flutter_lints/flutter.yaml

linter:
  rules:
    - always_declare_return_types
    - always_use_package_imports
    - avoid_print
    - avoid_unnecessary_containers
    - prefer_const_constructors
    - prefer_const_declarations
    - prefer_final_fields
    - prefer_final_locals
    - sort_child_properties_last
    - use_key_in_widget_constructors
    - file_names
    - lines_longer_than_80_chars # Warning only

analyzer:
  errors:
    lines_longer_than_80_chars: warning
  exclude:
    - '**/*.g.dart'
    - '**/*.freezed.dart'
```

### Build Commands

```bash
# Development
flutter run -d chrome              # Web browser
flutter run -d ios                 # iOS simulator
flutter run -d android             # Android emulator

# Production
flutter build web --release        # PWA
flutter build ios --release        # iOS app
flutter build android --release    # Android app

# Code Generation
flutter pub run build_runner build --delete-conflicting-outputs

# Testing
flutter test
flutter test --coverage
```

## Local Storage Strategy

### Hive Boxes
```dart
// Box names (constants)
const tasksBox = 'tasks';
const settingsBox = 'settings';
const cacheBox = 'cache';

// Type adapters needed
@HiveType(typeId: 0)
class Task extends HiveObject {
  // ... fields with @HiveField annotations
}
```

### Data Structure
```
Hive Storage/
├── tasks.hive           # All tasks
├── settings.hive        # User preferences
└── cache.hive          # Temporary data
```

### Encryption
For sensitive data:
```dart
final encryptionKey = Hive.generateSecureKey();
final box = await Hive.openBox('secure', 
  encryptionCipher: HiveAesCipher(encryptionKey)
);
```

## Testing Setup

### Unit Tests
```dart
// test/models/task_test.dart
void main() {
  group('Task Model', () {
    test('creates task with required fields', () {
      final task = Task(
        id: '1',
        title: 'Test',
        createdAt: DateTime.now(),
      );
      expect(task.title, 'Test');
    });
  });
}
```

### Widget Tests
```dart
// test/widgets/todo_item_test.dart
void main() {
  testWidgets('TodoItem displays task title', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: TodoItem(task: mockTask),
      ),
    );
    expect(find.text('Test Task'), findsOneWidget);
  });
}
```

### Integration Tests
```dart
// integration_test/app_test.dart
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  testWidgets('Complete task flow', (tester) async {
    // Test complete user journey
  });
}
```

## Debugging Tools

### Flutter DevTools
```bash
flutter pub global activate devtools
flutter pub global run devtools
```

Features:
- Widget inspector
- Performance profiler
- Network inspector
- Logging view
- Riverpod state inspector

### Logging
```dart
// Use logger package for structured logging
import 'package:logger/logger.dart';

final logger = Logger();

logger.d('Debug message');
logger.i('Info message');
logger.w('Warning message');
logger.e('Error message');
```

## Deployment

### Web (PWA)
```bash
flutter build web --release
# Output: build/web/
# Deploy to Firebase Hosting or any static host
```

### iOS
```bash
flutter build ios --release
# Opens Xcode for signing and deployment
# Or use Codemagic/Bitrise for CI/CD
```

### Android
```bash
flutter build apk --release      # APK
flutter build appbundle          # AAB for Play Store
```

## Environment Variables

### .env File (not committed)
```
FIREBASE_API_KEY=your-key-here
GEMINI_API_KEY=your-key-here
```

### Loading in Dart
```dart
// Use flutter_dotenv package
import 'package:flutter_dotenv/flutter_dotenv.dart';

await dotenv.load(fileName: '.env');
final apiKey = dotenv.env['FIREBASE_API_KEY'];
```

## Known Technical Limitations

### Web Platform
- No direct file system access
- Service workers for offline (limited)
- Push notifications limited
- No haptic feedback

### iOS PWA
- Limited push notifications
- No true background sync
- Add to home screen required
- Some Safari quirks

### Flutter Web
- Larger initial bundle size than native JavaScript
- SEO requires pre-rendering
- Not all packages support web

## Future Technical Considerations

### Native Features (when compiled)
- Push notifications
- Background sync
- Widgets (iOS/Android)
- Share extension
- Siri shortcuts
- Apple Watch companion

### Performance Optimizations
- Image caching
- Lazy loading
- Code splitting (web)
- Tree shaking
- Minification

### Analytics
- Firebase Analytics
- Crash reporting (Crashlytics)
- Performance monitoring
- User behavior tracking
