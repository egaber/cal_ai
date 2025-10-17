# Product Context

## Why This App Exists

### The Problem
The existing Calendar AI web application is excellent for desktop use, but mobile users face challenges:
- Web interfaces don't feel native on mobile devices
- Touch interactions aren't optimized for mobile gestures
- PWA experiences can be clunky on iOS
- Users want quick, native-feeling access to their tasks on the go
- Mobile task management needs to be fast and frictionless

### The Solution
A Flutter-based mobile app that:
- Provides true native iOS feel with Cupertino widgets
- Offers optimized touch controls and gestures
- Works offline with local storage
- Syncs seamlessly with the web app via Firebase
- Delivers fast, smooth 60fps performance
- Can be installed as PWA or compiled as native app

## User Needs

### Primary User: Eyal (Family Manager)
**Needs:**
- Quick access to family tasks on iPhone
- Native mobile experience that feels like iOS apps
- Ability to manage tasks while away from computer
- Offline access when internet is unavailable
- Fast task creation and completion

**Pain Points with Web App:**
- Web UI doesn't feel native on mobile
- Typing and navigation awkward on touch screen
- No offline capability
- Slower performance on mobile browser

### Secondary Users: Family Members
**Needs:**
- View their assigned tasks
- Check calendar on the go
- Simple, intuitive interface
- Quick task completion

## How It Should Work

### Core User Flows

#### 1. Quick Task Creation
```
User opens app → Taps floating '+' button → 
Types task title → Optionally adds details →
Taps save → Task appears in list immediately →
Syncs to cloud in background
```

#### 2. Task Completion
```
User sees task in list → Taps circular checkbox →
Checkbox animates (filling in) → Task marked complete →
Optionally removes from view or shows strikethrough →
Syncs completion status to cloud
```

#### 3. View Task Details
```
User taps task item → Drawer slides up from bottom →
Shows full details (description, subtasks, attachments) →
User can edit any field → Swipe down to close →
Changes save automatically
```

#### 4. Manage Subtasks
```
In task drawer → Taps "Add Subtask" →
Types subtask title → Presses enter →
Subtask appears in list → Can reorder, check off, delete →
All changes sync automatically
```

#### 5. Offline Usage
```
User opens app without internet →
All previously synced tasks available →
User can create, edit, complete tasks →
Changes stored locally →
When online, syncs automatically
```

## User Experience Goals

### Speed
- App launches in under 2 seconds
- Task list appears instantly (from cache)
- UI responds to touch within 16ms (60fps)
- No loading spinners for cached data

### Simplicity
- Bottom navigation with 3 clear tabs
- Minimal taps to complete common actions
- Smart defaults reduce decision making
- Clear visual hierarchy

### Delight
- Smooth animations for all transitions
- Haptic feedback for important actions
- Color-coded time badges draw attention
- Satisfying checkbox completion animation
- Empty states with helpful illustrations

### Reliability
- Works offline without degradation
- Automatic sync when connection restored
- No data loss
- Conflict resolution handles concurrent edits

### Native Feel
- iOS visual design language
- Native gestures (swipe, pull-to-refresh)
- System fonts and colors
- Respects iOS safe areas
- Integrates with iOS features (haptics, keyboard)

## Feature Priority

### Phase 1: Must Have (Todos MVP)
- Task list with iOS-style UI
- Circular checkbox with animation
- Task creation via floating button
- Task details drawer
- Local storage
- Firebase sync
- Time/deadline badges
- Subtask management

### Phase 2: Should Have
- Calendar view
- Event display
- Task-calendar integration
- Pull-to-refresh
- Swipe actions (delete, complete)

### Phase 3: Nice to Have
- AI Chat interface
- Voice input for tasks
- Widgets (iOS home screen)
- Apple Watch companion
- Siri shortcuts
- Share extension

### Future Considerations
- Android native app
- Tablet optimization
- Desktop web version improvements
- Family collaboration features
- Smart notifications

## Success Metrics

### User Satisfaction
- App Store rating > 4.5 stars
- Daily active users growth
- Session length appropriate for mobile
- Low uninstall rate

### Performance
- 60fps maintained during scrolling
- App launch < 2 seconds
- UI response < 100ms
- Sync latency < 1 second

### Engagement
- Tasks created per user per day
- Completion rate
- Return rate (daily/weekly)
- Feature adoption rate

## Design Principles

### 1. Mobile-First
Design for thumb-friendly interaction, not mouse clicks

### 2. Offline-First
App works without internet, syncs when available

### 3. Fast by Default
Optimistic updates, cache everything reasonable

### 4. Native Feel
Match platform conventions, don't fight them

### 5. Progressive Disclosure
Show basics first, details on demand

### 6. Consistent with Web App
Maintain same data models and business logic

## Target Platforms

### Priority 1: iPhone (iOS 14+)
- Progressive Web App for immediate access
- Future: Compiled native app for App Store

### Priority 2: Desktop Web Browsers
- Same Flutter codebase, responsive layout
- Mouse and keyboard optimized

### Priority 3: Android (Future)
- Material design variant
- Google Play Store distribution

### Priority 4: iPad (Future)
- Optimized layouts for larger screen
- Split view support
- Multitasking

## Competitive Analysis

### Todoist
**What We Like:**
- Clean, simple task list
- Excellent checkbox interaction
- Quick task creation
- Keyboard shortcuts

**What We'll Do Better:**
- Native iOS feel (Todoist uses custom UI)
- Deeper calendar integration
- AI assistance built-in
- Family-focused features

### Things 3
**What We Like:**
- Beautiful iOS-native design
- Smooth animations
- Cupertino widgets throughout
- Attention to detail

**What We'll Do Better:**
- Cloud sync (Things uses iCloud only)
- AI task breakdown
- Calendar integration
- Cross-platform (web access)

### Microsoft To Do
**What We Like:**
- My Day focus
- Simple, accessible
- Good sync

**What We'll Do Better:**
- iOS native feel
- Offline performance
- AI features
- Better mobile UX

## Accessibility Considerations

- Support Dynamic Type (iOS text sizing)
- VoiceOver compatibility
- Sufficient color contrast (WCAG AA)
- Touch targets ≥ 44x44 points
- Keyboard navigation where applicable
- Reduce motion option respect
