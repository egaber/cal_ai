# Mobile Task App

A mobile-first, AI-powered task management app with voice and text input, real-time parsing, and intelligent context detection.

## Features

- **Voice & Text Input**: Seamlessly switch between typing and voice recording
- **Real-time Parsing**: Instant detection and highlighting of:
  - Time buckets (Today, Tomorrow, This Week, Next Week)
  - Times (8:00, 14:30, etc.)
  - Family members (Eyal, Ella, Hilly, Yael, Alon)
  - Locations (Home, Kindergarten, School, etc.)
  - Priorities (P1, P2, P3)
  - Recurring patterns
  - Transportation needs
- **Smart Inference**: Automatically detects driving needs when children + locations are mentioned
- **Bucketed Organization**: Tasks organized by time buckets for easy scanning
- **Tag-based System**: Visual tags that can be edited directly

## Architecture

```
User Input (Voice/Text)
    ↓
[Real-time Parser Engine]
    ↓
[Tag Extraction & Classification]
    ↓
[Visual Feedback + Tag Bubbles]
    ↓
[Task Storage (Firebase)]
```

## Project Structure

- `src/types/` - TypeScript type definitions
- `src/services/` - Core services (parser, voice, storage)
- `src/components/` - React components
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions and configurations
- `src/pages/` - Main app pages
- `memory-bank/` - Project documentation and context

## Technology Stack

- React + TypeScript
- Web Speech API (voice input)
- Firebase (storage & sync)
- Tailwind CSS (styling)
- date-fns (date manipulation)

## Getting Started

This app integrates with the main Calendar AI project and shares Firebase configuration.

```bash
# Install dependencies (from root)
npm install

# Run development server
npm run dev

# Navigate to /mobile-tasks
```

## Development Phases

1. ✅ Core Parser Engine
2. 🚧 Smart Input Component
3. ⏳ Task List & Buckets
4. ⏳ Storage & Integration
5. ⏳ Polish & PWA

## Family Members

- **Parents**: Eyal, Ella
- **Children**: Hilly (11), Yael (5.5), Alon (3)

## Known Places

- Home (בית)
- Alon's Kindergarten (גן של אלון) - 15 min drive
- School (בית ספר) - 10 min drive
- Work (עבודה) - 20 min drive
