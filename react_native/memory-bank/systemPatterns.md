# System Patterns

## Architecture Overview

The Calendar AI React Native app follows a **layered architecture** with clear separation of concerns, adhering to SOLID principles throughout.

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Screens, Components, Navigation)      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Business Logic Layer           │
│      (Hooks, Contexts, State)           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Service Layer                  │
│  (Services following SOLID principles)  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Data Layer                     │
│     (Firebase, Storage, Cache)          │
└─────────────────────────────────────────┘
```

## SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)

**Each class/service has ONE reason to change**

#### Example: Event Management

```typescript
// ❌ BAD - Multiple responsibilities
class EventManager {
  createEvent() { }
  saveToFirebase() { }
  validateEvent() { }
  sendNotification() { }
  calculateConflicts() { }
}

// ✅ GOOD - Single responsibilities
class EventService {
  createEvent(event: CalendarEvent): Promise<CalendarEvent>
}

class EventValidationService {
  validate(event: CalendarEvent): ValidationResult
}

class EventStorageService {
  save(event: CalendarEvent): Promise<void>
}

class NotificationService {
  sendEventNotification(event: CalendarEvent): Promise<void>
}

class ConflictDetectionService {
  detectConflicts(event: CalendarEvent): ConflictResult[]
}
```

### 2. Open/Closed Principle (OCP)

**Open for extension, closed for modification**

#### Example: LLM Provider System

```typescript
// Base interface - closed for modification
interface ILLMProvider {
  chat(messages: Message[]): Promise<string>;
  getModels(): Promise<Model[]>;
}

// Extensible - add new providers without changing existing code
class GeminiProvider implements ILLMProvider {
  // Implementation specific to Gemini
}

class LocalAPIProvider implements ILLMProvider {
  // Implementation specific to Local API
}

// Easy to add new providers
class ClaudeProvider implements ILLMProvider {
  // Future implementation
}
```

### 3. Liskov Substitution Principle (LSP)

**Derived classes must be substitutable for their base classes**

#### Example: Storage Services

```typescript
// Base interface with clear contract
interface IStorageService {
  save<T>(key: string, data: T): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
}

// All implementations honor the same contract
class AsyncStorageService implements IStorageService {
  // Uses React Native AsyncStorage
}

class SecureStorageService implements IStorageService {
  // Uses encrypted storage for sensitive data
}

// Can swap implementations without breaking code
const storage: IStorageService = 
  __DEV__ ? new AsyncStorageService() : new SecureStorageService();
```

### 4. Interface Segregation Principle (ISP)

**Clients shouldn't depend on interfaces they don't use**

#### Example: Calendar Operations

```typescript
// ❌ BAD - Fat interface
interface ICalendarService {
  getEvents(): Promise<Event[]>;
  createEvent(): Promise<void>;
  updateEvent(): Promise<void>;
  deleteEvent(): Promise<void>;
  syncWithGoogle(): Promise<void>;
  exportToICS(): Promise<void>;
  importFromICS(): Promise<void>;
  shareCalendar(): Promise<void>;
}

// ✅ GOOD - Segregated interfaces
interface IEventReader {
  getEvents(filter?: EventFilter): Promise<Event[]>;
  getEventById(id: string): Promise<Event | null>;
}

interface IEventWriter {
  createEvent(event: Event): Promise<Event>;
  updateEvent(event: Event): Promise<void>;
  deleteEvent(id: string): Promise<void>;
}

interface ICalendarSync {
  syncWithGoogle(): Promise<void>;
  getLastSyncTime(): Promise<Date | null>;
}

interface ICalendarExport {
  exportToICS(): Promise<string>;
  importFromICS(data: string): Promise<void>;
}
```

### 5. Dependency Inversion Principle (DIP)

**Depend on abstractions, not concretions**

#### Example: Service Dependencies

```typescript
// ❌ BAD - Depends on concrete implementation
class EventScreen {
  private firebaseService = new FirebaseService();
  
  loadEvents() {
    return this.firebaseService.getEvents();
  }
}

// ✅ GOOD - Depends on abstraction
interface IEventRepository {
  getEvents(): Promise<Event[]>;
  saveEvent(event: Event): Promise<void>;
}

class EventScreen {
  constructor(private eventRepo: IEventRepository) {}
  
  loadEvents() {
    return this.eventRepo.getEvents();
  }
}

// Implementation can be swapped
class FirebaseEventRepository implements IEventRepository { }
class LocalEventRepository implements IEventRepository { }
```

## Key Design Patterns

### 1. Repository Pattern

**Abstraction over data access**

```typescript
/**
 * Repository pattern for event data access
 * Abstracts the data source (Firebase, local cache, etc.)
 */
interface IEventRepository {
  // Read operations
  findAll(filter?: EventFilter): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  findByDateRange(start: Date, end: Date): Promise<Event[]>;
  
  // Write operations
  create(event: Event): Promise<Event>;
  update(event: Event): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Batch operations
  batchCreate(events: Event[]): Promise<Event[]>;
}
```

### 2. Observer Pattern (via Contexts)

**Event-driven updates across components**

```typescript
/**
 * Event context provides observable state
 * Components subscribe and get notified of changes
 */
interface EventContextValue {
  events: Event[];
  loading: boolean;
  error: Error | null;
  
  // Actions that notify subscribers
  addEvent: (event: Event) => Promise<void>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}
```

### 3. Strategy Pattern

**Interchangeable algorithms**

```typescript
/**
 * Different conflict detection strategies
 */
interface IConflictDetectionStrategy {
  detectConflicts(event: Event, existingEvents: Event[]): Conflict[];
}

class TimeOverlapStrategy implements IConflictDetectionStrategy {
  // Checks for time overlaps
}

class LocationConflictStrategy implements IConflictDetectionStrategy {
  // Checks if same person in different locations
}

class CapacityStrategy implements IConflictDetectionStrategy {
  // Checks if person is overbooked
}
```

### 4. Factory Pattern

**Object creation abstraction**

```typescript
/**
 * Factory for creating calendar views
 */
interface ICalendarViewFactory {
  createView(type: CalendarViewType): ICalendarView;
}

class CalendarViewFactory implements ICalendarViewFactory {
  createView(type: CalendarViewType): ICalendarView {
    switch(type) {
      case 'day': return new DayView();
      case 'week': return new WeekView();
      case 'month': return new MonthView();
      default: throw new Error(`Unknown view type: ${type}`);
    }
  }
}
```

### 5. Command Pattern

**Encapsulate actions for undo/redo**

```typescript
/**
 * Command pattern for undoable actions
 */
interface ICommand {
  execute(): Promise<void>;
  undo(): Promise<void>;
}

class CreateEventCommand implements ICommand {
  constructor(
    private event: Event,
    private eventService: IEventService
  ) {}
  
  async execute() {
    await this.eventService.create(this.event);
  }
  
  async undo() {
    await this.eventService.delete(this.event.id);
  }
}

class CommandManager {
  private history: ICommand[] = [];
  private currentIndex = -1;
  
  async execute(command: ICommand) {
    await command.execute();
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(command);
    this.currentIndex++;
  }
  
  async undo() {
    if (this.currentIndex >= 0) {
      await this.history[this.currentIndex].undo();
      this.currentIndex--;
    }
  }
}
```

## Component Organization

### Component Size Limit

**Maximum 500 lines per component**

When a component approaches 500 lines:
1. Extract sub-components
2. Move business logic to custom hooks
3. Extract utilities to separate files
4. Consider splitting into smaller features

### Component Structure Template

```typescript
/**
 * ComponentName.tsx
 * 
 * @description Clear description of component purpose
 * @responsibility What this component is responsible for
 * @dependencies What this component depends on
 */

// 1. Imports (grouped logically)
import React from 'react';
import { View } from 'react-native';
import { useCustomHook } from '@/hooks';
import { ComponentA } from './ComponentA';

// 2. Types/Interfaces
interface ComponentNameProps {
  // Well-documented props
}

// 3. Component
export const ComponentName: React.FC<ComponentNameProps> = (props) => {
  // 3.1 Hooks (custom hooks first, then React hooks)
  const { data, loading } = useCustomHook();
  const [state, setState] = useState();
  
  // 3.2 Event handlers (clear naming with 'handle' prefix)
  const handlePress = () => { };
  
  // 3.3 Render helpers (if needed)
  const renderItem = () => { };
  
  // 3.4 Early returns (loading, error states)
  if (loading) return <LoadingView />;
  
  // 3.5 Main render
  return <View>{/* JSX */}</View>;
};

// 4. Styles (if using StyleSheet)
const styles = StyleSheet.create({ });
```

## Service Organization

### Service Structure Template

```typescript
/**
 * ServiceName.ts
 * 
 * @description Service responsibility and purpose
 * @pattern Design patterns used (Repository, Strategy, etc.)
 * @dependencies External dependencies
 * 
 * @example
 * const service = new EventService(firebaseRepo);
 * const events = await service.getUpcomingEvents();
 */

// 1. Imports
import { Injectable } from '@/types';

// 2. Interface (contract)
/**
 * Interface defining service contract
 * Following Interface Segregation Principle
 */
export interface IEventService {
  /**
   * Get upcoming events for specified member
   * @param memberId - Family member ID
   * @param days - Number of days to look ahead (default: 7)
   * @returns Promise resolving to event array
   */
  getUpcomingEvents(memberId: string, days?: number): Promise<Event[]>;
}

// 3. Implementation
/**
 * Event service implementation
 * Handles event business logic
 * 
 * @implements {IEventService}
 */
export class EventService implements IEventService {
  /**
   * Creates new EventService instance
   * @param repository - Event data repository (DIP)
   * @param validator - Event validation service (SRP)
   */
  constructor(
    private readonly repository: IEventRepository,
    private readonly validator: IEventValidator
  ) {}
  
  /**
   * Implementation with clear documentation
   */
  async getUpcomingEvents(memberId: string, days = 7): Promise<Event[]> {
    // Implementation
  }
  
  // Private helper methods
  private calculateDateRange(days: number): DateRange {
    // Helper logic
  }
}

// 4. Factory or helper functions (if needed)
/**
 * Creates configured EventService instance
 * @returns Configured EventService
 */
export const createEventService = (): IEventService => {
  const repository = new FirebaseEventRepository();
  const validator = new EventValidator();
  return new EventService(repository, validator);
};
```

## State Management Strategy

### Context Organization

```
contexts/
├── AuthContext.tsx        # Authentication state
├── EventContext.tsx       # Event management state
├── FamilyContext.tsx      # Family member state
├── ThemeContext.tsx       # Theme/appearance state
└── SettingsContext.tsx    # App settings state
```

### Context Guidelines

1. **Single Responsibility**: Each context manages one domain
2. **Minimal State**: Only shared state belongs in context
3. **Performance**: Use `useMemo` and `useCallback` to prevent re-renders
4. **Type Safety**: Full TypeScript definitions

## Error Handling Strategy

### Error Classification

```typescript
/**
 * Base error class for app errors
 */
export abstract class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends AppError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', true);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR', true);
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', true);
  }
}
```

### Error Handling Pattern

```typescript
/**
 * Centralized error handler
 */
export class ErrorHandler {
  static handle(error: Error, context?: string): void {
    // Log error with context
    console.error(`Error in ${context}:`, error);
    
    // Show user-friendly message
    if (error instanceof NetworkError) {
      Alert.alert('Network Error', 'Please check your connection');
    } else if (error instanceof ValidationError) {
      Alert.alert('Invalid Input', error.message);
    } else {
      Alert.alert('Error', 'Something went wrong');
    }
    
    // Report to analytics (if enabled)
    Analytics.logError(error, context);
  }
}
```

## Testing Strategy

### Test Organization

```
__tests__/
├── components/          # Component tests
├── services/           # Service tests
├── hooks/              # Hook tests
├── utils/              # Utility tests
└── integration/        # Integration tests
```

### Testing Patterns

```typescript
/**
 * Service test example
 */
describe('EventService', () => {
  let service: IEventService;
  let mockRepo: jest.Mocked<IEventRepository>;
  
  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new EventService(mockRepo);
  });
  
  it('should get upcoming events', async () => {
    // Arrange
    const mockEvents = [createMockEvent()];
    mockRepo.findByDateRange.mockResolvedValue(mockEvents);
    
    // Act
    const result = await service.getUpcomingEvents('member-1');
    
    // Assert
    expect(result).toEqual(mockEvents);
    expect(mockRepo.findByDateRange).toHaveBeenCalled();
  });
});
```

## Performance Optimization Patterns

### 1. Memoization

```typescript
// Expensive calculations
const sortedEvents = useMemo(() => {
  return events.sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );
}, [events]);

// Callback stability
const handlePress = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

### 2. List Virtualization

```typescript
// Use FlatList for long lists
<FlatList
  data={events}
  renderItem={renderEvent}
  keyExtractor={(item) => item.id}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### 3. Image Optimization

```typescript
// Lazy load images
<Image
  source={{ uri: imageUrl }}
  resizeMode="cover"
  defaultSource={require('./placeholder.png')}
/>
```

## Code Documentation Standards

### JSDoc Comments

Every public function, class, and interface must have JSDoc:

```typescript
/**
 * Calculates time conflicts between events
 * 
 * @param newEvent - The event to check for conflicts
 * @param existingEvents - Array of existing events to check against
 * @returns Array of conflicting events with conflict details
 * 
 * @example
 * const conflicts = detectConflicts(newEvent, allEvents);
 * if (conflicts.length > 0) {
 *   showConflictWarning(conflicts);
 * }
 */
export function detectConflicts(
  newEvent: Event,
  existingEvents: Event[]
): ConflictResult[] {
  // Implementation
}
```

This architecture ensures maintainable, scalable, and testable code following industry best practices.
