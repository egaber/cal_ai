# Event Cloud Storage Implementation

## Overview
Implementing cloud-based event storage with optimistic UI updates for Cal AI calendar application.

## Architecture

### 1. Event Service (`src/services/eventService.ts`) ✅
- Manages all event CRUD operations with Firestore
- Implements optimistic UI pattern:
  - Operations return immediately for instant UI updates
  - Firestore operations happen in background
  - Real-time sync ensures consistency

### 2. Security Rules (`firestore.rules`) ✅
- Family members can create, read, update, delete events
- Events stored in: `families/{familyId}/data/events/{eventId}`

### 3. Event Context (TODO)
- Provide EventService instance based on user's familyId
- Manage event state with real-time Firestore sync
- Handle optimistic updates and rollback on errors

### 4. Components Update (TODO)
All components that create/edit events need to use the new EventService:
- `AIAssistant.tsx` - AI-generated events
- `NewEventDialog.tsx` - Manual event creation
- `InlineEventCreator.tsx` - Quick event creation
- `EventDetailsDialog.tsx` - Event editing
- `CalendarGrid.tsx` - Drag & drop event moving
- `EventCard.tsx` - Event updates (duration, time)

## Implementation Strategy

### Phase 1: Core Infrastructure ✅
- [x] Create EventService with optimistic updates
- [x] Update Firestore security rules
- [ ] Create EventContext and useEvents hook

### Phase 2: Component Integration
- [ ] Update Index.tsx to use EventContext
- [ ] Update AIAssistant to use EventService
- [ ] Update NewEventDialog to use EventService
- [ ] Update EventDetailsDialog to use EventService
- [ ] Update drag & drop operations

### Phase 3: Testing & Deployment
- [ ] Test event creation from AI
- [ ] Test manual event creation
- [ ] Test event editing
- [ ] Test event moving/resizing
- [ ] Deploy to Firebase

## Optimistic Update Pattern

```typescript
// 1. Update UI immediately
const tempEvent = await eventService.createEvent(eventData);
setEvents([...events, tempEvent]);

// 2. Firestore save happens in background
// 3. Real-time listener syncs any changes
// 4. No loading states needed - instant feedback!
```

## Data Flow

```
User Action → EventService → Immediate Return → UI Update
                    ↓
              Background Save
                    ↓
              Firestore
                    ↓
            Real-time Sync
                    ↓
              All Devices
```

## Benefits

1. **Instant Feedback**: UI updates immediately, no waiting
2. **Shared Calendar**: All family members see the same events
3. **Real-time Sync**: Changes appear on all devices instantly
4. **Offline Resilience**: Can implement offline queue later
5. **Data Persistence**: Events survive page refreshes

## Migration Notes

Currently events are stored in memory (lost on refresh). After implementation:
- Events persist in Firestore
- Shared across all family members
- Survive page refreshes
- Accessible from any device
