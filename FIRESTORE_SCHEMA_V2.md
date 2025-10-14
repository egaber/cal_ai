# Firestore Schema V2 - Improved Organization

## Overview
Reorganizing Firestore to better support multiple calendar sources and memory management.

## New Schema Structure

```
families/
  └── {familyId}/
      ├── (family metadata: name, inviteCode, createdAt, etc.)
      │
      ├── memories/              # Family-shared memories
      │   ├── places/
      │   ├── events/
      │   └── preferences/
      │
      └── members/
          └── {userId}/
              ├── (member metadata: name, role, etc.)
              │
              ├── calendars/
              │   ├── cal_ai/
              │   │   └── events/
              │   │       ├── {eventId1}
              │   │       └── {eventId2}
              │   │
              │   ├── google/
              │   │   ├── metadata/
              │   │   │   └── sync_info
              │   │   └── events/
              │   │       ├── {googleEventId1}
              │   │       └── {googleEventId2}
              │   │
              │   └── outlook/
              │       ├── metadata/
              │       │   └── sync_info
              │       └── events/
              │           ├── {outlookEventId1}
              │           └── {outlookEventId2}
              │
              └── memories/        # User-personal memories
                  ├── preferences/
                  ├── habits/
                  └── notes/
```

## Benefits

### 1. **Multi-Calendar Support**
- Each calendar source (cal_ai, google, outlook) has its own subcollection
- Easy to distinguish which calendar an event belongs to
- Can have source-specific metadata (sync status, tokens, etc.)

### 2. **User-Owned Events**
- Events belong to specific family members
- Clear ownership and permissions
- Better privacy control

### 3. **Scalable Memory System**
- Family-level: Shared memories (places visited together, family preferences)
- User-level: Personal memories (individual habits, preferences, notes)

### 4. **Better Queries**
- Query all events for a user across all calendars
- Query specific calendar events
- Easy to filter by calendar source

### 5. **Clear Data Separation**
- Calendar events separate from memories
- Different calendar sources separate from each other
- Family data separate from personal data

## Migration Path

### Current Schema (V1):
```
families/
  └── {familyId}/
      └── events/
          ├── {eventId1}
          └── {eventId2}
```

### New Schema (V2):
```
families/
  └── {familyId}/
      └── members/
          └── {userId}/
              └── calendars/
                  └── cal_ai/
                      └── events/
                          ├── {eventId1}
                          └── {eventId2}
```

## Implementation Steps

1. **Update EventService**
   - Change collection path from `families/{familyId}/events` 
   - To: `families/{familyId}/members/{userId}/calendars/cal_ai/events`

2. **Update EventContext**
   - Pass both familyId and userId to EventService
   - Handle cases where userId might not be available

3. **Update Security Rules**
   - Allow users to read/write their own calendar events
   - Allow family members to read each other's events (for family view)
   - Protect user-specific memories

4. **Data Migration** (optional)
   - Script to move existing events from old to new structure
   - Or start fresh (since it's early stage)

## Security Rules (New)

```javascript
// User's own calendar events
match /families/{familyId}/members/{userId}/calendars/{calendarSource}/events/{eventId} {
  // User can manage their own events
  allow read, write: if request.auth.uid == userId;
  
  // Family members can read events (for family calendar view)
  allow read: if request.auth.uid in get(/databases/$(database)/documents/families/$(familyId)).data.memberUserIds;
}

// Family-level memories
match /families/{familyId}/memories/{document=**} {
  allow read, write: if request.auth.uid in get(/databases/$(database)/documents/families/$(familyId)).data.memberUserIds;
}

// User-personal memories
match /families/{familyId}/members/{userId}/memories/{document=**} {
  allow read, write: if request.auth.uid == userId;
}
```

## Calendar Sources

### cal_ai
- Native calendar events created in Cal AI
- Managed by user directly in the app

### google
- Synced from Google Calendar
- Contains sourceCalendarId, sourceCalendarEmail
- Metadata includes: lastSyncTime, syncEnabled

### outlook
- Synced from Outlook/Microsoft Calendar
- Contains sourceCalendarId
- Metadata includes: lastSyncTime, syncEnabled

## Query Examples

### Get all events for a user across all calendars:
```typescript
const calAiEvents = await getDocs(collection(db, `families/${familyId}/members/${userId}/calendars/cal_ai/events`));
const googleEvents = await getDocs(collection(db, `families/${familyId}/members/${userId}/calendars/google/events`));
const outlookEvents = await getDocs(collection(db, `families/${familyId}/members/${userId}/calendars/outlook/events`));
```

### Get all family members' cal_ai events (for family view):
```typescript
const membersSnapshot = await getDocs(collection(db, `families/${familyId}/members`));
for (const memberDoc of membersSnapshot.docs) {
  const events = await getDocs(collection(db, `families/${familyId}/members/${memberDoc.id}/calendars/cal_ai/events`));
}
```

## Next Steps

1. Implement new EventService with updated paths
2. Update EventContext to handle userId
3. Update security rules
4. Test thoroughly
5. Consider data migration for existing events
