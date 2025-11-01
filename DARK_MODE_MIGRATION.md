# Dark Mode Migration Guide

This document tracks the migration of all components to support the skin system and dark mode.

## ✅ Completed

- [x] Skin system infrastructure (`src/skins/`)
- [x] App.tsx - SkinProvider integration
- [x] MobileSettings.tsx - Theme selector UI

## 🔄 In Progress - Critical Mobile Components

### High Priority (Mobile Calendar)
- [ ] MobileCalendarView.tsx - Calendar grid and time slots
- [ ] MobileAppLayout.tsx - Main layout and navigation
- [ ] MobileIndex.tsx - Home page
- [ ] CalendarHeader.tsx - Date selector
- [ ] EventCreationDrawer.tsx - Event creation
- [ ] MobileEventDetails.tsx - Event details
- [ ] DraggableEventCard.tsx - Event cards
- [ ] AllDayEventsBar.tsx - All-day events

### Medium Priority (Mobile Pages)
- [ ] MobileTasks.tsx - Tasks page
- [ ] MobileMemory.tsx - Memory page
- [ ] MobilePlanningChat.tsx - Planning chat
- [ ] MobileDailySchedules.tsx - Daily schedules

### Low Priority (Desktop/Shared)
- [ ] CalendarGrid.tsx - Desktop calendar
- [ ] EventCard.tsx - Desktop event card
- [ ] Index.tsx - Desktop home
- [ ] AppLayout.tsx - Desktop layout

## 🎨 Dark Mode Color Mapping

### Background Colors
```tsx
// Light → Dark
bg-white → bg-white dark:bg-gray-900
bg-gray-50 → bg-gray-50 dark:bg-gray-800
bg-gray-100 → bg-gray-100 dark:bg-gray-700
bg-blue-50 → bg-blue-50 dark:bg-blue-900/20
bg-slate-50 → bg-slate-50 dark:bg-slate-900
```

### Text Colors
```tsx
text-gray-900 → text-gray-900 dark:text-gray-100
text-gray-700 → text-gray-700 dark:text-gray-300
text-gray-600 → text-gray-600 dark:text-gray-400
text-muted-foreground → text-muted-foreground dark:text-gray-400
```

### Border Colors
```tsx
border-gray-200 → border-gray-200 dark:border-gray-700
border-gray-300 → border-gray-300 dark:border-gray-600
```

### Special Cases
```tsx
// Time pane background
bg-white/95 backdrop-blur → bg-white/95 dark:bg-gray-900/95 backdrop-blur

// Night hours in calendar
bg-slate-50 → bg-slate-50 dark:bg-slate-800/50
bg-blue-50/30 → bg-blue-50/30 dark:bg-blue-900/20
```

## 📝 Update Pattern

For each component:

1. Add dark mode variants to all `className` strings
2. Update inline styles if using hardcoded colors
3. Test in both light and dark modes
4. Check component in isolation and in context

### Example Update:

```tsx
// Before
<div className="bg-white border-gray-200 text-gray-900">

// After
<div className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
```

## 🔧 Tailwind Dark Mode Configuration

Already configured in `tailwind.config.ts`:
```js
darkMode: ['class']
```

SkinProvider automatically adds/removes the `dark` class on `<html>` element.

## 🚀 Next Steps

1. Update MobileCalendarView.tsx (calendar grid + time pane)
2. Update MobileAppLayout.tsx (navigation bar)
3. Update remaining mobile components
4. Test full user flow in dark mode
5. Update desktop components

## 📊 Progress Tracker

- Components updated: 3/30
- Progress: 10%
- Estimated remaining work: 2-3 hours
