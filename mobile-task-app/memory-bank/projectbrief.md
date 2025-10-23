# Project Brief: Mobile Task App

## Project Overview
A mobile-first, single-page task management application designed specifically for iPhone that enables users to quickly capture tasks through voice or text input with real-time AI-powered parsing and context extraction.

## Core Requirements

### 1. Input Methods
- **Text Input**: Type naturally with real-time parsing as you write
- **Voice Input**: Record voice that converts to text with streaming recognition
- **Hybrid Mode**: Seamlessly switch between voice and text input

### 2. Real-time Parsing & Visual Feedback
As users type or speak, the app instantly:
- Highlights detected components with colored backgrounds
- Extracts and displays tags in oval bubbles
- Provides visual feedback for recognized patterns
- Allows direct editing of detected tags

### 3. Smart Context Detection

#### Time Detection
- **Time Buckets**: Today, Tomorrow, This Week, Next Week, Unlabeled
- **Specific Times**: 8:00, 14:30, "at 2 PM", "בשעה 3"
- **Relative Dates**: "tomorrow", "מחר", "יום רביעי" (Wednesday)

#### People Detection
- **Family Members**: Eyal, Ella, Hilly (11), Yael (5.5), Alon (3)
- **Ownership**: "אייל צריך" (Eyal needs to), "I need to"
- **Involved**: "עם הילי" (with Hilly), "together with Yael"

#### Location & Transportation
- **Known Places**: Home, Kindergarten, School, Work
- **Travel Time**: Automatic calculation from home to destination
- **Smart Inference**: If child + location → automatically add driving requirement
- **Example**: "Take Alon to kindergarten" → detects: Alon (child), kindergarten (location), adds 🚗 driving 15min

#### Other Context
- **Priority**: P1, P2, P3
- **Recurring**: "every day", "weekly", "כל יום"
- **Task Type**: Reminder vs actionable task

### 4. Task Organization
Tasks are automatically organized into buckets:
- **Today**: Tasks for today
- **Tomorrow**: Tasks for tomorrow
- **This Week**: Tasks within current week
- **Next Week**: Tasks for next week
- **Unlabeled**: Tasks without time specification

### 5. User Interface

#### Main View (List)
- Clean task list organized by time buckets
- Each task shows: title + colorful tag bubbles
- Collapsible buckets for easy navigation
- Large "+" button to add new task

#### Add/Edit View (Split Screen)
- Top: Cancel ← → Save ✓
- Large input area with real-time highlighting
- 🎤 Microphone button for voice input
- Visual feedback during voice recording
- Tag cloud showing detected elements
- Tap tags to edit/modify

## Technology Stack
- **Framework**: React + TypeScript
- **Voice**: Web Speech API (Safari iOS compatible)
- **Parsing**: Custom regex-based engine with inference rules
- **Storage**: Firebase Firestore (with offline support)
- **Styling**: Tailwind CSS
- **Date Handling**: date-fns

## Family Context
- **Parents**: Eyal (primary user), Ella
- **Children**: 
  - Hilly (11 years old) - independent, can do tasks alone
  - Yael (5.5 years old) - needs supervision/driving
  - Alon (3 years old) - needs supervision/driving

## Known Places & Travel Times
From home:
- **Alon's Kindergarten** (גן של אלון): 15 minutes drive
- **School** (בית ספר): 10 minutes drive  
- **Work** (עבודה): 20 minutes drive
- **Home** (בית): Starting point

## User Goals
1. **Frictionless Capture**: Add tasks as fast as thinking them
2. **Natural Language**: Speak or type naturally without structured forms
3. **Automatic Context**: App understands context without explicit tagging
4. **Quick Scanning**: See what needs to be done at a glance
5. **Family Coordination**: Understand who does what and when

## Success Criteria
- Voice recording works reliably on iPhone Safari
- Real-time parsing provides instant visual feedback (< 100ms delay)
- 90%+ accuracy in detecting times, people, and places
- Smart inference correctly identifies driving needs for children
- Task creation takes < 10 seconds from thought to saved
- Works offline with background sync
- Clean, mobile-first UI that feels native

## Out of Scope (Initial Release)
- Integration with main calendar app (future phase)
- Notifications and reminders
- Task sharing/collaboration
- Analytics and insights
- Multiple family profiles
- Custom place configuration UI
