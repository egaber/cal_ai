# System Patterns

## Architecture Overview

This Flutter app follows **Clean Architecture** principles with clear separation between layers:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Screens, Widgets, UI Components)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Application Layer                │
│  (Providers, State Management)          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Domain Layer                   │
│  (Models, Business Logic, Services)     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           Data Layer                    │
│  (Repositories, Data Sources)           │
└─────────────────────────────────────────┘
```

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- **One class, one job**
- `TaskRepository`: Only handles task data persistence
- `TaskService`: Only handles task business logic
- `TodoItem`: Only renders a single task in the list
- `TaskDrawer`: Only displays/edits task details

### Open/Closed Principle (OCP)
- **Open for extension, closed for modification**
- Use abstract classes for data sources
- Extend `DataSource` interface for different storage types
- Add new task categories without modifying core logic

### Liskov Substitution Principle (LSP)
- **Interfaces must be substitutable**
- Any `DataSource` implementation works in `Repository`
- `LocalDataSource` and `RemoteDataSource` interchangeable
- Mock implementations for testing

### Interface Segregation Principle (ISP)
- **Small, focused interfaces**
- Separate read and write interfaces
- `TaskReader` for queries
- `TaskWriter` for mutations
- Clients only depend on what they use

### Dependency Inversion Principle (DIP)
- **Depend on abstractions**
- Services depend on repository interfaces, not concrete classes
- Repositories depend on data source interfaces
- Use Riverpod for dependency injection

## Key Design Patterns

### 1. Repository Pattern
**Purpose:** Abstract data source details from business logic

```dart
// Domain layer defines interface
abstract class TaskRepository {
  Future<List<Task>> getTasks();
  Future<Task> getTask(String id);
  Future<void> saveTask(Task task);
  Future<void> deleteTask(String id);
}

// Data layer implements interface
class TaskRepositoryImpl implements TaskRepository {
  final LocalDataSource local;
  final RemoteDataSource remote;
  
  // Implementation uses both data sources
  // with offline-first strategy
}
```

### 2. Provider Pattern (Riverpod)
**Purpose:** Dependency injection and state management

```dart
// Providers are defined once
final taskRepositoryProvider = Provider<TaskRepository>((ref) {
  return TaskRepositoryImpl(
    local: ref.read(localDataSourceProvider),
    remote: ref.read(remoteDataSourceProvider),
  );
});

// Consumed anywhere in widget tree
class TodoScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(tasksProvider);
    // ...
  }
}
```

### 3. Observer Pattern
**Purpose:** React to data changes

```dart
// Stream-based updates
class TaskRepository {
  Stream<List<Task>> watchTasks() {
    // Combines local and remote changes
    return CombineLatestStream.list([
      _local.watchTasks(),
      _remote.watchTasks(),
    ]);
  }
}

// UI automatically rebuilds
final tasksProvider = StreamProvider<List<Task>>((ref) {
  return ref.read(taskRepositoryProvider).watchTasks();
});
```

### 4. Factory Pattern
**Purpose:** Create objects without specifying exact class

```dart
// Task creation with smart defaults
class TaskFactory {
  static Task create({
    required String title,
    String? description,
  }) {
    return Task(
      id: const Uuid().v4(),
      title: title,
      description: description ?? '',
      createdAt: DateTime.now(),
      status: TaskStatus.pending,
      // ... smart defaults
    );
  }
}
```

### 5. Strategy Pattern
**Purpose:** Swap algorithms at runtime

```dart
// Different sync strategies
abstract class SyncStrategy {
  Future<void> sync(List<Task> tasks);
}

class OptimisticSync implements SyncStrategy {
  Future<void> sync(List<Task> tasks) async {
    // Update UI immediately, sync in background
  }
}

class PessimisticSync implements SyncStrategy {
  Future<void> sync(List<Task> tasks) async {
    // Wait for server confirmation
  }
}
```

## Component Architecture

### Widget Hierarchy

```
TodosScreen
├── CupertinoNavigationBar
│   └── Title + Actions
├── RefreshIndicator
│   └── TaskList
│       ├── ListView.builder
│       │   └── TodoItem (multiple)
│       │       ├── CircularCheckbox
│       │       ├── TaskContent
│       │       │   ├── Title
│       │       │   └── TimeBadge
│       │       └── ChevronIcon
│       └── EmptyState (if no tasks)
└── FloatingActionButton
    └── AddTaskDialog
```

### State Management Flow

```
User Action
    ↓
Widget Event
    ↓
Provider Notifier
    ↓
Service Layer
    ↓
Repository
    ↓
Data Source (Local/Remote)
    ↓
State Update
    ↓
UI Rebuild
```

## Data Flow

### Offline-First Architecture

```
┌──────────────┐
│  UI Layer    │
└──────┬───────┘
       │
┌──────▼───────┐     Read: Always from cache
│ Repository   │────────────────────────────┐
└──────┬───────┘                            │
       │                                    │
   ┌───▼────┐                         ┌─────▼─────┐
   │ Local  │◄────Sync─────────────────│  Remote  │
   │ (Hive) │                          │(Firebase)│
   └────────┘                          └──────────┘
```

### Write Operation Flow

1. **Optimistic Update**: Update local cache immediately
2. **UI Feedback**: Show change to user instantly
3. **Background Sync**: Queue sync operation
4. **Conflict Resolution**: Handle if remote changed
5. **Error Recovery**: Rollback if sync fails

### Read Operation Flow

1. **Check Cache**: Always read from local first
2. **Return Immediately**: Show cached data to user
3. **Background Refresh**: Fetch from remote if online
4. **Update Cache**: Merge remote changes
5. **Notify UI**: Rebuild if data changed

## File Organization

### Directory Structure
```
lib/
├── main.dart                    # App entry point
├── models/                      # Data models
│   ├── task.dart
│   ├── subtask.dart
│   └── task_category.dart
├── services/                    # Business logic
│   ├── task_service.dart
│   ├── sync_service.dart
│   └── notification_service.dart
├── repositories/                # Data access
│   ├── task_repository.dart
│   ├── interfaces/
│   │   ├── data_source.dart
│   │   └── task_repository.dart
│   └── impl/
│       └── task_repository_impl.dart
├── data_sources/               # Storage implementations
│   ├── local/
│   │   └── hive_data_source.dart
│   └── remote/
│       └── firebase_data_source.dart
├── providers/                  # Riverpod providers
│   ├── task_providers.dart
│   └── app_providers.dart
├── screens/                    # Full-screen views
│   ├── todos_screen.dart
│   ├── calendar_screen.dart
│   └── chat_screen.dart
├── widgets/                    # Reusable components
│   ├── todo_item.dart
│   ├── task_drawer.dart
│   ├── circular_checkbox.dart
│   ├── time_badge.dart
│   └── common/
│       ├── loading_indicator.dart
│       └── error_view.dart
├── utils/                      # Helper functions
│   ├── date_formatter.dart
│   ├── color_utils.dart
│   └── constants.dart
└── config/                     # Configuration
    ├── theme.dart
    ├── firebase_config.dart
    └── app_config.dart
```

## Critical Implementation Patterns

### 1. Immutable Models
```dart
@freezed
class Task with _$Task {
  const factory Task({
    required String id,
    required String title,
    String? description,
    required DateTime createdAt,
    // ... other fields
  }) = _Task;
  
  factory Task.fromJson(Map<String, dynamic> json) => _$TaskFromJson(json);
}
```

### 2. Error Handling
```dart
// Use Either type for operations that can fail
Future<Either<Failure, Task>> getTask(String id) async {
  try {
    final task = await _repository.getTask(id);
    return Right(task);
  } catch (e) {
    return Left(CacheFailure());
  }
}
```

### 3. Null Safety
- Use nullable types (`String?`) sparingly
- Provide sensible defaults
- Use `required` for mandatory fields
- Leverage Dart's null safety features

### 4. Const Constructors
```dart
// Use const for performance
const TodoItem({
  Key? key,
  required this.task,
  required this.onTap,
}) : super(key: key);
```

### 5. Widget Composition
```dart
// Break complex widgets into smaller pieces
class TaskDrawer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildHeader(),      // Separate method
        _buildContent(),     // Separate method
        _buildActions(),     // Separate method
      ],
    );
  }
}
```

## Performance Optimizations

### 1. ListView.builder
- Use for long lists (> 20 items)
- Only builds visible items
- Recycles widgets efficiently

### 2. Const Widgets
- Mark widgets as `const` when possible
- Flutter reuses const widgets
- Reduces rebuild overhead

### 3. Keys for Lists
- Use `ValueKey` for list items
- Helps Flutter identify widgets
- Prevents unnecessary rebuilds

### 4. Cached Data
- Keep frequently accessed data in memory
- Use Hive for persistent cache
- Implement cache expiration

### 5. Lazy Loading
- Load data on demand
- Paginate long lists
- Defer heavy operations

## Testing Strategy

### Unit Tests
- Test models, services, repositories
- Mock dependencies with mockito
- Test business logic in isolation

### Widget Tests
- Test individual widgets
- Verify UI behavior
- Test user interactions

### Integration Tests
- Test complete user flows
- Verify data persistence
- Test sync operations

## Security Considerations

### 1. Data Encryption
- Encrypt sensitive data in Hive
- Use Firebase security rules
- Validate all user input

### 2. Authentication
- Verify user identity
- Store tokens securely
- Handle session expiration

### 3. Authorization
- Check user permissions
- Filter data by user
- Prevent unauthorized access

## Scalability Patterns

### 1. Pagination
- Load tasks in batches
- Implement infinite scroll
- Cache loaded pages

### 2. Indexing
- Index frequently queried fields
- Use compound indexes for complex queries
- Optimize Firestore queries

### 3. Caching Strategy
- Cache list views
- Invalidate on updates
- Use TTL for freshness
