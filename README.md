# Calendar AI

A family-focused calendar management application with integrated AI assistance capabilities.

## Project info

**URL**: https://lovable.dev/projects/294d8edb-bd39-4300-9552-3c2414fdc0d5

## Features

### 🗓️ Calendar Management
- Interactive calendar grid with drag-and-drop support
- Event creation, editing, and deletion
- Recurring events support
- All-day events
- Multi-day events
- Color-coded categories

### 🤖 AI Assistant
- **Multiple Gemini Models**: Support for Gemini 2.0 Flash, 1.5 Pro, 1.5 Flash, and Pro
- **Local LM API**: Access to 26+ models including GPT-5, Claude 4.5, and more
- Natural language scheduling
- Task breakdown and planning
- Intelligent event suggestions
- Chat history with conversation context

### 🎯 Smart Event Features
- **AI-Powered Emoji Selection**: Automatic emoji suggestions based on event content
- **Smart Categorization**: Automatically categorizes events into 25+ categories
- **Context-Aware Tips**: Provides scheduling tips based on surrounding events
- **Multi-Language Support**: Detects Hebrew and English, provides tips in appropriate language

### 👨‍👩‍👧‍👦 Family Management
- Support for multiple family members
- Individual schedules and capacity tracking
- Family member sidebar with visual indicators
- Age-appropriate activity suggestions

### 🔄 Google Calendar Integration
- Two-way sync with Google Calendar
- OAuth 2.0 authentication
- Automatic sync intervals
- Conflict resolution

### 📱 Responsive Design
- Desktop and mobile layouts
- Touch-friendly interface
- Adaptive UI components

## Documentation

- **[LLM Integration Guide](LLM_INTEGRATION.md)** - Complete guide for AI features
- **[Gemini Integration Guide](GEMINI_INTEGRATION.md)** - Detailed Gemini setup and usage
- **[Google Calendar Integration](GOOGLE_CALENDAR_INTEGRATION.md)** - Calendar sync setup

## Quick Start with AI

### Using Gemini (Recommended)

1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open the AI Assistant in the app
3. Click Settings ⚙️ and enter your API key
4. Select a Gemini model and start chatting!

**Available Gemini Models:**
- Gemini 2.0 Flash (Experimental) - Fastest responses
- Gemini 1.5 Pro - Advanced reasoning
- Gemini 1.5 Flash - Balanced performance
- Gemini Pro - Stable and reliable

### Using Local Models

If you have the VS Code LM API running locally:
1. Ensure the API is accessible at `http://localhost:3000`
2. Models will automatically appear in the dropdown
3. No API key needed!

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/294d8edb-bd39-4300-9552-3c2414fdc0d5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Technologies

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini API, Local LM API
- **Calendar Sync**: Google Calendar API
- **State Management**: React hooks
- **Storage**: LocalStorage for settings and data persistence

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/294d8edb-bd39-4300-9552-3c2414fdc0d5) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
