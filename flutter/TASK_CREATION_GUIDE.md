# Task Creation & Management Guide

## Overview

This Calendar AI Flutter app features an intelligent task creation system with **Natural Language Processing (NLP)** that understands both **English and Hebrew** input. The system automatically extracts dates, times, locations, priorities, and other metadata from natural language text.

## Features

### 🎯 Intelligent Text Parsing

The task creation UI includes real-time NLP parsing that recognizes:

- **Dates**: "today", "tomorrow", "Monday", "next week", "25/12/2024"
- **Times**: "3pm", "15:30", "9:00 AM"
- **Priorities**: "P1", "P2", "P3" (High, Medium, Low)
- **Locations**: "@Store", "@Office", "@Home"
- **Tags**: "#work", "#personal", "#urgent"
- **Hebrew support**: "היום", "מחר", "עדיפות 1"

### 📝 Task Creation Examples

#### English Examples:
```
"Buy milk tomorrow 3pm P1 @Store"
→ Task: "Buy milk"
→ Date: Tomorrow
→ Time: 3:00 PM
→ Priority: P1 (High)
→ Location: Store

"Meeting with team next Monday 10am #work"
→ Task: "Meeting with team"
→ Date: Next Monday
→ Time: 10:00 AM
→ Tag: work

"Dentist appointment Friday 2:30pm P2"
→ Task: "Dentist appointment"
→ Date: Friday
→ Time: 2:30 PM
→ Priority: P2 (Medium)
```

#### Hebrew Examples:
```
"לקנות חלב מחר 15:00 עדיפות 1"
→ Task: "לקנות חלב"
→ Date: Tomorrow (מחר)
→ Time: 3:00 PM
→ Priority: P1

"פגישה ביום שלישי בבוקר"
→ Task: "פגישה"
→ Date: Next Tuesday (שלישי)
→ Time: Morning
```

## Using the Task Creation Sheet

### 1. Opening Task Creation

Tap the blue **+** floating action button at the bottom-right of the Todos screen.

### 2. Input Field

Type your task naturally in the main input field. The system will:
- Parse your input in real-time
- Extract metadata automatically
- Display recognized elements as colored chips below the input

### 3. Parsed Data Chips

Recognized elements appear as interactive chips:

- **📅 Date** (Blue) - Click to change date
- **🕐 Time** (Green) - Click to change time
- **📍 Location** (Orange) - Click to edit location
- **🚩 Priority** (Red/Orange/Yellow) - Click to change priority
- **#️⃣ Tags** (Purple) - Auto-detected from # symbols

Each chip can be:
- **Tapped** to edit the value
- **Deleted** by clicking the X icon

### 4. Quick Action Buttons

Four quick action buttons below the input:
- **Date** - Open date picker
- **Time** - Open time picker
- **Location** - Edit location
- **Priority** - Select P1/P2/P3

### 5. Description Field

Add optional detailed description for the task.

### 6. Advanced Options

Click "Advanced Options" to expand:

#### Recurrence
Set repeating tasks:
- Does not repeat
- Daily
- Weekdays (Mon-Fri)
- Weekly
- Biweekly
- Monthly
- Yearly
- Custom

#### Reminders
Add multiple reminders:
- Click **+** to add a reminder
- Set date and time for each reminder
- Delete reminders by clicking the trash icon

### 7. Save or Cancel

- **Cancel** - Discard changes
- **Save** - Create/update the task

## Task Editing

### Edit Existing Tasks

1. Tap any task in the list
2. The task creation sheet opens with existing data
3. Modify any fields
4. Save to update

### Complete Tasks

- Tap the circular checkbox next to any task
- Completed tasks show with strikethrough
- Tap again to mark as incomplete

## Task List Features

### Visual Indicators

Each task displays:
- **Circular checkbox** - Completion status
- **Priority flag** - P1 (Red), P2 (Orange), P3 (Yellow)
- **Date badge** - Color-coded by urgency:
  - Red: Overdue
  - Orange: Due today
  - Yellow: Due within 3 days
  - Blue: Future dates
- **Time badge** (Green)
- **Location badge** (Indigo)
- **Recurrence badge** (Purple)
- **Reminder count** (Teal)

### Sorting

Tasks are automatically sorted by:
1. Priority (P1 > P2 > P3 > None)
2. Due date (earlier first)
3. Creation date (newest first)

## Supported Date Formats

### Relative Dates (English)
- `today` / `היום`
- `tomorrow` / `מחר`
- `next week` / `שבוע הבא`

### Day Names
- English: `Monday`, `Tuesday`, `Wednesday`, etc.
- Hebrew: `ראשון`, `שני`, `שלישי`, `רביעי`, `חמישי`, `שישי`, `שבת`

### Specific Dates
- `25/12/2024` (dd/mm/yyyy)
- `25-12-2024` (dd-mm-yyyy)
- `2024-12-25` (yyyy-mm-dd)

## Supported Time Formats

- `3pm` / `3 PM`
- `15:00` (24-hour)
- `3:30pm` / `3:30 PM`
- `9:00 AM` / `9am`

## Priority Levels

- **P1** - High Priority (Red flag)
- **P2** - Medium Priority (Orange flag)
- **P3** - Low Priority (Yellow flag)
- **None** - No priority set

## Tips for Best Results

### ✅ Do's
- Use natural language: "Buy groceries tomorrow at 5pm"
- Combine multiple metadata: "Team meeting Monday 10am P1 @Office #work"
- Use consistent date formats
- Add location with @ symbol
- Add tags with # symbol

### ❌ Don'ts
- Don't use ambiguous dates without context
- Avoid mixing languages in the same input
- Don't use non-standard time formats

## Keyboard Shortcuts

- **Enter** in title field - Move to description
- **Enter** in description - Create new line
- **Cmd/Ctrl + S** - Save task (future feature)
- **Esc** - Cancel and close (future feature)

## Technical Details

### NLP Parser

The `TaskParserService` uses regex patterns to identify:
- Date patterns in multiple formats
- Time patterns (12h and 24h)
- Priority markers (P1/P2/P3)
- Location markers (@)
- Tag markers (#)
- Hebrew date/time keywords

### State Management

- Uses **Riverpod** for reactive state management
- Tasks stored in memory (will sync to Firebase)
- Automatic sorting and filtering
- Optimistic UI updates

### Data Model

Tasks include:
- `id` - Unique identifier
- `title` - Task name
- `description` - Optional details
- `status` - pending/completed/cancelled
- `priority` - P1/P2/P3/none
- `createdAt` - Creation timestamp
- `dueDate` - Optional due date
- `dueTime` - Optional time
- `location` - Optional location
- `subtasks` - List of subtasks (future)
- `reminders` - List of reminders
- `recurrence` - Repeat pattern
- `tags` - List of tags

## Future Enhancements

- 🔄 Firebase sync for persistence
- 📱 Push notifications for reminders
- 🔊 Voice input for task creation
- 🤖 AI-powered task suggestions
- 📊 Analytics and insights
- 🌙 Dark mode support
- ⌨️ More keyboard shortcuts
- 🔍 Search and filter capabilities
- 📎 File attachments
- 👥 Task assignment to family members

## Troubleshooting

### Dates Not Recognized?
- Use supported date formats
- Check spelling of day names
- Ensure proper spacing

### Time Not Parsing?
- Use standard time formats
- Include AM/PM for 12-hour format
- Use colon separator for minutes (3:30pm)

### Hebrew Not Working?
- Ensure Hebrew keyboard is enabled
- Use Hebrew date keywords: היום, מחר
- Hebrew support is beta - some patterns may not work

## Support

For issues or feature requests:
- Check existing issues in the repository
- Create a new issue with detailed description
- Include example text that didn't parse correctly

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Platform**: iOS (Primary), Web (PWA)
