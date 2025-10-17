# Calendar AI Flutter App

A cross-platform mobile application built with Flutter that provides a native iOS feel with task management, calendar, and AI chat capabilities.

## Overview

This Flutter app complements the existing Calendar AI web application, providing:
- Native iOS user experience with Cupertino widgets
- Offline-first architecture with local storage
- Real-time sync with Firebase
- Cross-platform support (iOS, Android, Web)

## Features

### Phase 1: Todos (Current)
- ✅ Todoist-inspired task list with circular checkboxes
- ✅ Time/deadline badges with color coding
- ✅ Bottom drawer for task details
- ✅ Subtask management
- ✅ Attachment support (files, links, comments)
- ✅ Floating action button for quick task creation
- ✅ Offline capability with local caching
- ✅ Real-time sync with Firebase

### Future Phases
- Calendar view with month/week/day views
- AI Chat interface with LLM integration
- Progressive Web App (PWA) support
- Native iOS and Android apps

## Architecture

The app follows Clean Architecture principles with clear separation of concerns:

```
lib/
├── models/          # Data models (Freezed classes)
├── services/        # Business logic
├── repositories/    # Data access layer
├── providers/       # Riverpod state management
├── screens/         # Full-screen views
├── widgets/         # Reusable UI components
├── utils/           # Helper functions
└── config/          # App configuration
```

### Key Technologies
- **Framework**: Flutter 3.x
- **State Management**: Riverpod 2.x
- **Local Storage**: Hive
- **Cloud Backend**: Firebase (Firestore, Auth)
- **Navigation**: go_router
- **Code Generation**: Freezed, JSON Serializable

## Getting Started

### Prerequisites

1. **Flutter SDK** (3.24.0 or higher)
   ```bash
   flutter doctor -v
   ```

2. **Development Environment**
   - Visual Studio Code with Flutter extension
   - Or Android Studio with Flutter plugin

3. **Firebase Project**
   - Use the existing Calendar AI Firebase project
   - Download configuration files (see Setup below)

### Installation

1. **Clone the repository** (if not already cloned)
   ```bash
   git clone <repository-url>
   cd cal_ai/flutter
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Generate code** (for Freezed and JSON Serializable)
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

### Firebase Setup

#### Web Platform
1. Copy Firebase configuration from existing web app
2. Create `lib/config/firebase_options.dart` with your Firebase project credentials

#### iOS Platform
1. Download `GoogleService-Info.plist` from Firebase Console
2. Place in `ios/Runner/` directory
3. Add to Xcode project

#### Android Platform
1. Download `google-services.json` from Firebase Console
2. Place in `android/app/` directory

### Running the App

```bash
# Web (for development and PWA)
flutter run -d chrome

# iOS Simulator
flutter run -d ios

# Android Emulator  
flutter run -d android

# Physical device (with USB debugging)
flutter run
```

### Building for Production

```bash
# Web (PWA)
flutter build web --release

# iOS
flutter build ios --release

# Android
flutter build apk --release      # APK
flutter build appbundle          # App Bundle for Play Store
```

## Project Structure

```
flutter/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── models/                   # Data models
│   │   ├── task.dart            # Task model with Freezed
│   │   ├── subtask.dart         # Subtask model
│   │   └── task_category.dart   # Category enum
│   ├── services/                 # Business logic
│   │   ├── task_service.dart    # Task operations
│   │   └── sync_service.dart    # Cloud sync
│   ├── repositories/             # Data access
│   │   ├── interfaces/          # Abstract interfaces
│   │   └── impl/                # Implementations
│   ├── data_sources/            # Storage implementations
│   │   ├── local/              # Hive local storage
│   │   └── remote/             # Firebase Firestore
│   ├── providers/               # Riverpod providers
│   │   └── task_providers.dart
│   ├── screens/                 # Full screens
│   │   ├── todos_screen.dart   # Todos tab
│   │   ├── calendar_screen.dart # Calendar tab
│   │   └── chat_screen.dart    # AI Chat tab
│   ├── widgets/                 # Reusable widgets
│   │   ├── todo_item.dart      # Task list item
│   │   ├── task_drawer.dart    # Task details drawer
│   │   ├── circular_checkbox.dart
│   │   └── time_badge.dart
│   ├── utils/                   # Utilities
│   │   ├── constants.dart
│   │   ├── date_formatter.dart
│   │   └── color_utils.dart
│   └── config/                  # Configuration
│       ├── theme.dart
│       └── firebase_options.dart
├── assets/                      # Static assets
│   ├── images/
│   └── icons/
├── test/                        # Unit tests
├── integration_test/            # Integration tests
├── memory-bank/                 # Project documentation
│   ├── projectbrief.md
│   ├── activeContext.md
│   ├── productContext.md
│   ├── systemPatterns.md
│   ├── techContext.md
│   └── progress.md
├── pubspec.yaml                 # Dependencies
├── analysis_options.yaml        # Linting rules
└── README.md                    # This file
```

## Development Guidelines

### Code Quality Standards

1. **SOLID Principles**: Follow throughout the codebase
2. **File Size**: Maximum 500 lines per file
3. **Documentation**: Comment all public APIs
4. **Testing**: Aim for 80%+ coverage on business logic
5. **Linting**: Zero warnings in production builds

### Naming Conventions

- **Files**: `snake_case.dart` (e.g., `todo_item.dart`)
- **Classes**: `PascalCase` (e.g., `TodoItem`)
- **Variables**: `camelCase` (e.g., `taskTitle`)
- **Constants**: `lowerCamelCase` with `const` (e.g., `defaultPadding`)

### Performance Best Practices

- Use `const` constructors where possible
- Use `ListView.builder` for long lists
- Implement proper disposal of resources
- Cache frequently accessed data
- Use `ValueKey` for list items

## Testing

### Run Tests

```bash
# All tests
flutter test

# With coverage
flutter test --coverage

# Specific test file
flutter test test/models/task_test.dart
```

### Test Structure

- **Unit Tests**: `test/` directory
- **Widget Tests**: Test individual widgets
- **Integration Tests**: `integration_test/` directory

## Troubleshooting

### Common Issues

1. **Build Runner Conflicts**
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

2. **Firebase Not Initialized**
   - Ensure `Firebase.initializeApp()` is called in `main.dart`
   - Verify configuration files are in place

3. **Hive Box Errors**
   - Delete app data and reinstall
   - Check Hive initialization in `main.dart`

4. **iOS Simulator Issues**
   ```bash
   flutter clean
   flutter pub get
   cd ios && pod install && cd ..
   flutter run
   ```

## Contributing

### Before Committing

1. Run linter: `flutter analyze`
2. Run tests: `flutter test`
3. Format code: `flutter format .`
4. Update documentation if needed

### Commit Message Format

```
type: short description

Longer description if needed

- Bullet points for details
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Resources

### Documentation
- [Flutter Documentation](https://flutter.dev/docs)
- [Riverpod Documentation](https://riverpod.dev)
- [Hive Documentation](https://docs.hivedb.dev)
- [Firebase for Flutter](https://firebase.google.com/docs/flutter)

### Design References
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [Material Design](https://material.io/design)

### Project Documentation
See the `memory-bank/` directory for detailed project documentation:
- `projectbrief.md` - Project overview and requirements
- `productContext.md` - User needs and product vision
- `systemPatterns.md` - Architecture and design patterns
- `techContext.md` - Technology stack and setup
- `activeContext.md` - Current work and decisions
- `progress.md` - Project progress tracking

## License

This project is part of the Calendar AI application suite.

## Contact

For questions or issues, please refer to the main Calendar AI project repository.
