# Family System Migration Guide

## Overview
This document outlines the migration from individual user family lists to a shared family system where multiple users can belong to the same family and share events, memories, and family member data.

## Problem
- Each user gets their own separate family list when signing in
- Users can't see each other in the family
- Events and data are not shared between family members
- Hardcoded default family members (Eyal, Ella, Hilly, Yael, Alon)

## Solution
Implement a shared family system with:
- Central family documents in Firestore
- Multiple users linked to the same family
- Shared events, memories, and family member data
- Family invite codes for easy joining

## Data Structure

### Before (Per-User Model)
```
users/
  {userId}/
    - familyMembers: [hardcoded list]
    - data/
      - events
      - memories
```

### After (Shared Family Model)
```
families/
  {familyId}/
    - name: string
    - members: FamilyMember[]
    - adminUserIds: string[]
    - memberUserIds: string[]
    - inviteCode: string
    - data/
      - events
      - memories

users/
  {userId}/
    - familyId: string (reference to family)
    - personalPreferences
```

## Implementation Status

### ✅ Completed
1. Created `familyService.ts` with:
   - `createFamily()` - Create new family
   - `joinFamily()` - Join existing family via invite code
   - `getFamily()` - Retrieve family data
   - `addFamilyMember()` - Add children/non-users
   - `updateFamilyMember()` - Update member info
   - `getFamilyEvents()` - Get shared events
   - `getFamilyMemories()` - Get shared memories

2. Fixed TypeScript exports for `MemoryData`

### 🚧 In Progress
3. Update `authService.ts` to:
   - Check if user has `familyId` on sign-in
   - If no family, prompt to create or join one
   - Remove hardcoded default family members
   - Link user to family during registration

4. Create family setup flow:
   - Welcome dialog for new users
   - Option to create new family or join existing
   - Family name input
   - Display invite code for sharing

5. Update UI components:
   - Load family members from shared family
   - Display correct user avatars (Google photos)
   - Mark current user with "isYou" flag
   - Show all family users with their photos

### 📋 Todo
6. Update all data services to use family context:
   - `calendarService.ts` - Load/save events to family
   - `memoryExtractionService.ts` - Save memories to family
   - `storageService.ts` - Use family storage

7. Migration for existing users:
   - Create family for existing users
   - Migrate their events to family storage
   - Keep their existing data

8. Test and deploy

## User Flow

### New User Sign-In
1. User signs in with Google
2. System checks if user has `familyId`
3. If no family:
   - Show dialog: "Create Family" or "Join Family"
   - **Create**: Enter family name → Get invite code
   - **Join**: Enter invite code → Join family
4. User added as family member with their Google photo
5. Redirect to calendar with family data

### Existing Family Member Sign-In
1. User signs in with Google
2. System loads their `familyId`
3. Load family members from shared family
4. Mark current user with `isYou: true`
5. Display all family members with correct photos
6. Load shared events and memories

## Invite Code System
- 6-character alphanumeric code (e.g., "ABC123")
- Unique per family
- Used to join existing families
- Displayed to family creator
- Can be regenerated if needed

## Next Steps

1. **Immediate**: Update `authService.ts` to integrate family system
2. **UI**: Create family setup dialog component
3. **Integration**: Update all services to use family context
4. **Testing**: Test multi-user family scenario
5. **Deploy**: Deploy updated system to Firebase

## Notes
- Existing users will need to go through family setup on next sign-in
- Family invite codes should be shared securely (via Teams, SMS, etc.)
- Each family can have multiple admins for management
- Children/non-users don't need accounts but are listed as members
