# Project Brief: Calendar AI Flutter App

## Project Overview
A cross-platform mobile application built with Flutter that provides native iOS feel with task management, calendar, and AI chat capabilities. This app complements the existing web-based Calendar AI application and shares the same Firebase backend for seamless data synchronization.

## Core Requirements

### Platform Support
1. **Primary Target**: iPhone as Progressive Web App (PWA) with native feel
2. **Secondary Target**: Desktop web browsers
3. **Future Targets**: 
   - Compiled iOS native app
   - Android mobile app

### User Interface
1. **Bottom Navigation Tabs**:
   - Todos (primary focus for Phase 1)
   - Calendar
   - AI Chat

2. **Todos Screen (Todoist-inspired)**:
   - List view with circular checkboxes
   - Time/deadline highlighted in color per task
   - Drawer-style expansion from bottom for task details
   - Task details include:
     - Editable title and description
     - Subtasks with add/remove capability
     - Attachments (files, links, comments)
   - Floating '+' button for creating new tasks
   - iOS native gestures and animations

3. **UI/UX Principles**:
   - iOS native look and feel (Cupertino widgets)
   - Touch-optimized controls
   - Scrolls only where needed
   - Smooth 60fps animations
   - Native haptic feedback
   - Safe area handling

### Technical Requirements

1. **Architecture**:
   - SOLID software engineering principles
   - Clean architecture with separation of concerns
   - Maximum 500 lines of code per file
   - Well-commented code
   - Reusable components

2. **Data Management**:
   - Local storage and caching (Hive/SharedPreferences)
   - Cloud sync with Firebase Firestore
   - Offline-first approach
   - Optimistic UI updates
   - Conflict resolution

3. **State Management**:
   - Riverpod for reactive state management
   - Provider pattern for dependency injection

4. **Backend Integration**:
   - Firebase Firestore for data persistence
   - Firebase Authentication
   - Shared data models with existing web app
   - Real-time sync capabilities

## Technology Stack
- **Framework**: Flutter 3.x
- **Language**: Dart
- **UI**: Cupertino widgets (iOS), Material widgets (Android)
- **State Management**: Riverpod
- **Local Storage**: Hive for structured data, SharedPreferences for settings
- **Cloud Backend**: Firebase (Firestore, Auth)
- **Navigation**: go_router
- **Animations**: Flutter built-in + custom animations

## Key Features (Phase 1 - Todos)
1. Task list with iOS-style UI
2. Circular checkbox with completion animation
3. Color-coded time/deadline badges
4. Bottom drawer for task details
5. Subtask management
6. Attachment support (files, links, comments)
7. Floating action button with hero animation
8. Pull-to-refresh
9. Swipe actions (complete, delete)
10. Local caching with cloud sync

## User Goals
- Access tasks on mobile with native iOS experience
- Quick task creation and completion
- Detailed task management with subtasks and attachments
- Seamless sync across web and mobile platforms
- Offline capability with automatic sync when online

## Success Criteria
- App feels native to iOS with smooth animations
- Works offline with local storage
- Syncs seamlessly with web app via Firebase
- All files under 500 lines of code
- Clean, maintainable, well-documented code
- SOLID principles applied throughout
- 60fps performance on target devices
- PWA installable on iPhone
- Accessible on desktop browsers

## Project Structure
```
flutter/
├── memory-bank/          # Project documentation
├── lib/
│   ├── main.dart        # App entry point
│   ├── models/          # Data models (Task, Event, etc.)
│   ├── services/        # Business logic
│   ├── repositories/    # Data access layer
│   ├── providers/       # Riverpod providers
│   ├── screens/         # Page-level widgets
│   ├── widgets/         # Reusable components
│   ├── utils/           # Helper functions
│   └── config/          # App configuration
└── pubspec.yaml         # Dependencies
```

## Family Context
- **Parents**: Eyal (primary user), Ella
- **Children**: Hilly (11), Yael (5.5), Alon (3)
- Multi-user task assignment supported
- Color coding per family member

## Development Phases

### Phase 1: Todos Screen (Current)
- Project setup and architecture
- Task data model
- Todos list UI
- Task details drawer
- Local storage + Firebase sync
- Floating action button

### Phase 2: Calendar Screen
- Calendar view (month/week/day)
- Event display and creation
- Integration with tasks
- Native date pickers

### Phase 3: AI Chat Screen
- Chat interface
- LLM integration (Gemini API)
- Message history
- Chat-based task creation

### Phase 4: Polish & Deployment
- PWA configuration
- Performance optimization
- Testing across platforms
- App store preparation (future)
