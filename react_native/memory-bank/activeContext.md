# Active Context

## Current Work Focus
Building the React Native iOS app for Calendar AI with modern iOS 26 design patterns, liquid glass bottom tabs, and SOLID architecture principles. Currently in Phase 1: Foundation - setting up the project structure and creating comprehensive memory bank documentation.

### Family Members Configuration
- **Parents**: 
  - Eyal (Primary user)
  - Ella
- **Children**: 
  - Hilly (11 years old)
  - Yael (5.5 years old)
  - Alon (3 years old)

## Current Session Progress

### 1. Memory Bank Creation ✅
Created comprehensive documentation following the memory bank structure:

- **projectbrief.md**: Complete project overview including:
  - iOS 26 design requirements with liquid glass tabs
  - Technology stack (React Native, Expo, Firebase)
  - SOLID design patterns emphasis
  - Architecture and folder structure
  - Development phases

- **productContext.md**: User experience documentation including:
  - Problems solved by mobile app
  - Core user flows (Quick Glance, Create Event, Calendar Navigation, AI Assistance)
  - Design philosophy (iOS First, Performance Over Features)
  - Success metrics and KPIs

- **systemPatterns.md**: Technical architecture documentation including:
  - Detailed SOLID principles implementation with examples
  - Design patterns (Repository, Observer, Strategy, Factory, Command)
  - Component organization with 500-line limit
  - Service structure templates with JSDoc comments
  - Error handling strategy
  - Testing patterns

- **techContext.md**: Technology documentation including:
  - Complete dependency list with versions
  - Development setup instructions
  - Configuration files (tsconfig, babel, eslint, prettier)
  - Firebase integration patterns
  - Performance monitoring approach
  - Deployment guidelines

## Next Steps

### Immediate (Phase 1 Continuation)
1. ✅ Complete memory bank setup (activeContext.md, progress.md)
2. Initialize React Native project with Expo
3. Set up folder structure following architecture guidelines
4. Create TypeScript type definitions
5. Implement base service layer architecture

### Phase 2: Core UI
1. Create iOS 26 style constants and theme system
2. Implement liquid glass bottom tab navigator
3. Build navigation structure
4. Create basic screen layouts
5. Develop reusable UI components

### Phase 3: Calendar Features
1. Implement calendar view components (Day, Week, Month)
2. Create event card components with gestures
3. Build event creation flow
4. Add date/time utilities
5. Implement event management logic

### Phase 4: Integration
1. Set up Firebase configuration
2. Implement authentication service
3. Create event storage service
4. Build AI service layer
5. Add real-time synchronization

### Phase 5: Polish
1. Refine animations and transitions
2. Add haptic feedback throughout
3. Optimize performance
4. Implement error boundaries
5. Complete testing

## Active Decisions and Considerations

### Architecture Decisions

**1. SOLID Principles Enforcement**
- Each service class has single responsibility
- Interfaces define contracts (not implementations)
- Maximum 500 lines per component
- Dependency injection throughout
- Clear separation of concerns

**2. Component Organization**
```
src/
├── components/        # UI components (<500 lines each)
│   ├── calendar/      # Calendar-specific
│   ├── tabs/          # Liquid glass tabs
│   ├── common/        # Shared components
│   └── ai/            # AI assistant
├── screens/           # Screen components
├── services/          # Business logic services
├── hooks/             # Custom React hooks
├── types/             # TypeScript definitions
├── utils/             # Helper functions
├── config/            # Configuration
├── contexts/          # React contexts
└── constants/         # App constants
```

**3. State Management**
- React Context for global state
- Custom hooks for business logic
- Local state for UI-specific needs
- No Redux (keep it simple)

**4. Liquid Glass Tabs Implementation**
- Using expo-blur for iOS frosted glass effect
- React Native Reanimated for smooth animations
- Expo Haptics for feedback
- Custom tab bar component with spring physics

### Technology Choices

**Why Expo?**
- Faster development with managed workflow
- Easy iOS build configuration
- Built-in modules (blur, haptics, etc.)
- Good developer experience
- Easy OTA updates

**Why React Native Reanimated?**
- Runs animations on UI thread (60 FPS)
- Better performance than Animated API
- More powerful gesture handling
- Spring physics for natural feel

**Why Firebase?**
- Real-time synchronization
- Offline support built-in
- Authentication handled
- Scalable backend
- Matches web app architecture

### Design Patterns in Use

**Repository Pattern**: All data access abstracted
```typescript
interface IEventRepository {
  findAll(): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  create(event: Event): Promise<Event>;
  update(event: Event): Promise<void>;
  delete(id: string): Promise<void>;
}
```

**Strategy Pattern**: Interchangeable algorithms (e.g., conflict detection)

**Observer Pattern**: Context-based state updates

**Command Pattern**: Undo/redo functionality

**Factory Pattern**: Component creation (calendar views)

### Code Quality Standards

**1. TypeScript Strict Mode**
- All code fully typed
- No `any` types (use `unknown` if needed)
- Explicit return types on functions
- Interfaces for all data structures

**2. JSDoc Comments**
- Every public function documented
- Include @param, @returns, @example
- Explain the "why" not just the "what"

**3. Component Structure**
```typescript
/**
 * Component documentation
 */
// 1. Imports
// 2. Types/Interfaces  
// 3. Component
//    3.1 Hooks
//    3.2 Event handlers
//    3.3 Render helpers
//    3.4 Early returns
//    3.5 Main render
// 4. Styles
```

**4. Service Structure**
```typescript
/**
 * Service documentation with examples
 */
// 1. Imports
// 2. Interface (contract)
// 3. Implementation
// 4. Factory functions
```

### Performance Considerations

**1. Component Optimization**
- Use React.memo for expensive components
- useMemo for expensive calculations
- useCallback for stable callbacks
- FlatList for long lists

**2. Animation Performance**
- All animations on UI thread
- Avoid setState during animations
- Use shared values from Reanimated
- Spring animations for natural feel

**3. Bundle Size**
- Code splitting where possible
- Tree shaking enabled
- Remove unused dependencies
- Optimize images and assets

## Important Patterns and Preferences

### File Naming
- Components: PascalCase (EventCard.tsx)
- Services: PascalCase (EventService.ts)
- Utilities: camelCase (dateUtils.ts)
- Types: PascalCase (calendar.types.ts)
- Hooks: camelCase with 'use' prefix (useEvents.ts)

### Import Organization
```typescript
// 1. React imports
import React, { useState, useEffect } from 'react';

// 2. React Native imports
import { View, Text, StyleSheet } from 'react-native';

// 3. Third-party imports
import { BlurView } from 'expo-blur';

// 4. Local imports (using path aliases)
import { useEvents } from '@hooks/useEvents';
import { EventCard } from '@components/calendar/EventCard';
import type { CalendarEvent } from '@types/calendar';
```

### Error Handling
- Custom error classes for different types
- Centralized error handler
- User-friendly error messages
- Proper error logging
- Graceful degradation

### Testing Approach
- Unit tests for services and utilities
- Component tests for UI components
- Integration tests for critical flows
- Mock external dependencies
- Test behavior, not implementation

## Known Issues
None yet - project just starting.

## Learnings and Project Insights

### iOS 26 Design Principles
- Liquid glass (blur) effects are key to modern iOS feel
- Haptic feedback on all interactions
- Spring animations feel more natural than linear
- System fonts (SF Pro) for consistency
- Respect safe areas and notches
- Dark mode support from day one

### React Native Best Practices
- Keep business logic out of components
- Use custom hooks to share logic
- Context for global state only
- Avoid deep prop drilling
- Memoize expensive operations
- Virtualize long lists

### SOLID in Practice
- Single Responsibility makes debugging easier
- Interface segregation prevents bloat
- Dependency injection enables testing
- Each service does ONE thing well
- Easy to add features without breaking existing code

### Project Structure Benefits
- Clear separation of concerns
- Easy to find files
- Scales well as project grows
- New developers onboard quickly
- Testable architecture

## Development Workflow

### Daily Workflow
1. Review memory bank before starting
2. Create/update task checklist
3. Implement one feature at a time
4. Test as you go
5. Update documentation
6. Commit with clear messages

### Before Committing
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes
- [ ] Prettier formatted
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No console.log statements

### Code Review Checklist
- [ ] Follows SOLID principles
- [ ] Components under 500 lines
- [ ] Proper TypeScript types
- [ ] JSDoc comments on public APIs
- [ ] Error handling in place
- [ ] Performance considered
- [ ] Accessible (VoiceOver friendly)

## References to Web App

The React Native app should maintain feature parity with the web app while optimizing for mobile:

**Web App Features to Port:**
- Calendar views (day, week, month)
- Event creation and editing
- AI assistant with model selection
- Family member management
- Firebase authentication
- Google Calendar sync
- Event categories and emojis
- Recurring events
- Conflict detection

**Mobile-Specific Enhancements:**
- Swipe gestures for navigation
- Pull-to-refresh
- Native date/time pickers
- Haptic feedback
- Offline-first architecture
- Native share sheet
- Widgets (future)
- Shortcuts integration (future)
