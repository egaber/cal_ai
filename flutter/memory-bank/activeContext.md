# Active Context

## Current Work Focus
Setting up the Flutter mobile app project structure with focus on creating a native iOS-feeling todo application. This is Phase 1 of the Calendar AI Flutter app development.

## Recent Changes (Current Session)

### Project Initialization
1. **Created Flutter Memory Bank**
   - `projectbrief.md`: Comprehensive project overview, requirements, and architecture
   - Defined SOLID principles and 500-line file limit
   - Established iOS-native UI/UX goals
   - Documented Todoist-inspired design requirements

## Next Steps

### Immediate Tasks
1. Create remaining memory bank files:
   - `productContext.md` - Why this app exists, user needs
   - `systemPatterns.md` - Architecture patterns and technical decisions
   - `techContext.md` - Technology setup and constraints

2. Initialize Flutter project:
   - Create `pubspec.yaml` with dependencies
   - Set up project structure (lib/, models/, services/, etc.)
   - Configure analysis options for linting

3. Create Task data model:
   - Port TypeScript Task interface to Dart
   - Ensure compatibility with existing Firebase schema
   - Add JSON serialization

4. Build core UI foundation:
   - Main app entry point with bottom navigation
   - Todos screen scaffold
   - Basic list view structure

5. Implement Todos UI components:
   - TodoItem widget with circular checkbox
   - Time/deadline badge with color coding
   - Bottom drawer for task details
   - Floating '+' button

## Active Decisions and Considerations

### Architecture Decisions
- **State Management**: Using Riverpod for reactive state with good testability
- **Data Layer**: Repository pattern separating data sources (local/cloud)
- **UI Pattern**: Cupertino widgets for iOS native feel, Material for Android
- **File Organization**: Feature-based with clear separation of concerns
- **Line Limit**: Maximum 500 lines per file enforced

### Design Decisions
- **Todoist-Inspired UI**: Circular checkboxes, drawer expansion, time badges
- **iOS Native Feel**: Cupertino components, native gestures, haptic feedback
- **Color Coding**: Time/deadline highlighting, family member colors
- **Animations**: Smooth 60fps with built-in Flutter animations

### Data Sync Strategy
- **Offline-First**: Local storage with Hive for immediate access
- **Optimistic Updates**: UI updates immediately, sync in background
- **Conflict Resolution**: Last-write-wins with timestamp-based merging
- **Firebase Integration**: Shared Firestore database with web app

## Important Patterns and Preferences

### Code Quality Standards
1. **SOLID Principles**:
   - Single Responsibility: Each class has one job
   - Open/Closed: Extend without modifying
   - Liskov Substitution: Interfaces are substitutable
   - Interface Segregation: Small, focused interfaces
   - Dependency Inversion: Depend on abstractions

2. **File Structure**:
   - Max 500 lines per file
   - One primary class per file
   - Comprehensive documentation comments
   - Clear imports organization

3. **Naming Conventions**:
   - Files: snake_case (todo_item.dart)
   - Classes: PascalCase (TodoItem)
   - Variables: camelCase (taskTitle)
   - Constants: lowerCamelCase with const (defaultPadding)

### UI/UX Patterns
- **iOS Guidelines**: Follow Human Interface Guidelines
- **Touch Targets**: Minimum 44x44 points
- **Safe Areas**: Respect notches and home indicators
- **Haptics**: Use for important actions (complete task, delete)
- **Animations**: 200-300ms duration for UI transitions

## Technology Context

### Flutter Dependencies (To Be Added)
- **State Management**: `flutter_riverpod`
- **Local Storage**: `hive`, `hive_flutter`
- **Firebase**: `cloud_firestore`, `firebase_auth`, `firebase_core`
- **Navigation**: `go_router`
- **UI Utilities**: `intl` (date formatting), `uuid` (ID generation)

### Development Environment
- **Flutter SDK**: Latest stable (3.x)
- **Dart SDK**: Bundled with Flutter
- **IDE**: Visual Studio Code with Flutter extension
- **Platform**: Windows development machine
- **Target**: iOS (primary), Android (future), Web (PWA)

## Known Issues
None yet - project just starting.

## Learnings and Project Insights

### Integration with Existing Web App
- Must maintain compatibility with existing Task TypeScript interface
- Firebase schema already defined in `firestore.rules`
- Reuse authentication system from web app
- Sync strategy must handle concurrent edits from web and mobile

### Flutter Best Practices
- Use `const` constructors for performance
- Avoid rebuilding entire widget tree
- Use `ListView.builder` for long lists
- Implement proper disposal of resources
- Test on real devices early

### iOS PWA Considerations
- Add web manifest for installability
- Configure icons for home screen
- Handle iOS-specific quirks (viewport, safe areas)
- Test standalone mode behavior
