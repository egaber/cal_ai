# Project Brief: Calendar AI - React Native iOS App

## Project Overview
Calendar AI React Native is a mobile iOS application that brings the family-focused calendar management experience to iPhone users. Built with modern iOS 26 design patterns, it features liquid glass bottom tabs and a premium native experience while maintaining feature parity with the web application.

## Core Requirements

### 1. Modern iOS 26 Design
- Native iOS 26 visual style with SF Symbols
- Liquid glass bottom tab bar with blur effects
- Smooth animations and transitions
- Haptic feedback throughout the app
- Dark mode support
- Native iOS gestures and interactions

### 2. Calendar Management
- Visual calendar interface optimized for mobile
- Day, week, and month views
- Swipe gestures for navigation
- Event creation with smart input
- Drag-and-drop event editing
- All-day event support

### 3. AI Assistant Integration
- Chat interface for intelligent scheduling
- Multiple LLM provider support (Gemini, Local API)
- Model selection capability
- Context-aware suggestions
- Voice input support (iOS native)

### 4. Family Member Management
- Support for multiple family members:
  - **Parents**: Eyal, Ella
  - **Children**: Hilly (11 years old), Yael (5.5 years old), Alon (3 years old)
- Individual color coding
- Capacity indicators
- Member-specific event filtering

### 5. Firebase Integration
- Cloud Firestore for data persistence
- Firebase Authentication
- Real-time synchronization
- Offline support
- Google Calendar sync

## Technology Stack

### Core Technologies
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: React Context + Custom Hooks
- **UI Components**: React Native + Custom iOS-styled components
- **Navigation**: React Navigation 6
- **Animations**: React Native Reanimated 3

### Key Dependencies
- **expo**: ~51.0.0 (Latest stable)
- **react-native-reanimated**: ^3.10.0 (Animations)
- **@react-navigation/native**: ^6.1.0 (Navigation)
- **@react-navigation/bottom-tabs**: ^6.5.0 (Tab navigation)
- **expo-blur**: ^13.0.0 (Liquid glass effect)
- **expo-haptics**: ^13.0.0 (Haptic feedback)
- **firebase**: ^10.7.0 (Backend services)
- **react-native-gesture-handler**: ^2.16.0 (Gestures)

### Design Patterns (SOLID Principles)
1. **Single Responsibility Principle**: Each service/class has one reason to change
2. **Open/Closed Principle**: Open for extension, closed for modification
3. **Liskov Substitution Principle**: Interface-based design
4. **Interface Segregation Principle**: Focused interfaces
5. **Dependency Inversion Principle**: Depend on abstractions

## Key Features

### Liquid Glass Bottom Tabs
- Blur effect background (iOS frosted glass)
- Smooth tab transitions with spring animations
- Dynamic active indicator with glow effect
- Haptic feedback on selection
- SF Symbol icons

### iOS 26 Style Components
- Native iOS typography (SF Pro)
- System color palette
- Contextual menus with blur backgrounds
- Pull-to-refresh with native feel
- Swipe actions on events
- Native date/time pickers

### Calendar Views
- **Today View**: Quick overview with upcoming events
- **Day View**: Scrollable timeline with hour markers
- **Week View**: Horizontal scroll with gesture support
- **Month View**: Grid layout with event dots
- **Mini Calendar**: Quick date selector

### Smart Features
- AI-powered event suggestions
- Natural language event creation
- Conflict detection
- Travel time calculation
- Recurring event support
- Event categories with emojis

## Architecture

### Folder Structure
```
react_native/
├── src/
│   ├── components/        # Reusable UI components (<500 lines each)
│   │   ├── calendar/      # Calendar-specific components
│   │   ├── tabs/          # Liquid glass tab components
│   │   ├── common/        # Shared components
│   │   └── ai/            # AI assistant components
│   ├── screens/           # Main app screens
│   ├── services/          # Business logic services
│   │   ├── CalendarService.ts
│   │   ├── EventService.ts
│   │   ├── AIService.ts
│   │   ├── AuthService.ts
│   │   └── FirebaseService.ts
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration files
│   ├── contexts/          # React contexts
│   └── constants/         # App constants
├── assets/                # Images, fonts, icons
├── memory-bank/          # Project documentation
└── app.json              # Expo configuration
```

### Component Guidelines
- Maximum 500 lines per component
- Each component has a single responsibility
- Well-documented with JSDoc comments
- Proper TypeScript typing
- Testable and maintainable

## User Goals
- Seamless mobile calendar experience
- Fast, responsive native feel
- Offline-first with sync
- Beautiful iOS-native design
- Easy family schedule coordination
- AI assistance on the go

## Success Criteria
- App launches in < 2 seconds
- Smooth 60 FPS animations
- All features work offline
- Passes iOS App Store guidelines
- Excellent accessibility support
- 4.5+ star rating target

## Development Phases

### Phase 1: Foundation (Current)
- Project setup with Expo
- Memory bank creation
- Type definitions
- Service layer architecture

### Phase 2: Core UI
- Liquid glass bottom tabs
- Navigation structure
- Basic screens layout
- iOS styling system

### Phase 3: Calendar Features
- Calendar views implementation
- Event management
- Date/time handling
- Gesture support

### Phase 4: Integration
- Firebase integration
- Authentication
- AI assistant
- Data synchronization

### Phase 5: Polish
- Animations refinement
- Performance optimization
- iOS-specific features
- Testing and debugging
