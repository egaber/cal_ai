# Active Context

## Current Work Focus
Just completed LLM integration for the AI Assistant component. The chat interface now connects to real LLM providers and allows users to interact with AI for scheduling assistance.

## Recent Changes (Latest Session)

### 1. Created LLM Service (`src/services/llmService.ts`)
- **Purpose**: Centralized service for managing connections to different LLM providers
- **Providers Supported**:
  - Google Gemini API (requires API key)
  - Local VS Code LM API (no key required)
- **Key Features**:
  - Model fetching from local API
  - Chat request handling with proper request/response formatting
  - Error handling for both providers
  - Singleton pattern for service instance

### 2. Enhanced AI Assistant Component (`src/components/AIAssistant.tsx`)
- **New Features**:
  - Model selection dropdown with all available models
  - Settings dialog for Gemini API key configuration
  - Chat history display with user/assistant message distinction
  - Loading indicators during API calls
  - Error notifications using toast
  - API key persistence in localStorage
- **UI Improvements**:
  - Responsive chat bubbles (user right, assistant left)
  - Color coding for message types
  - Disabled state during loading
  - Settings icon for easy access to configuration

### 3. API Integration Testing
- Successfully tested local VS Code LM API endpoint
- Verified response format: `{ success: true, response: "text", model: {...} }`
- Updated service to handle correct response structure

### 4. Documentation
- Created `LLM_INTEGRATION.md` with comprehensive setup and usage instructions
- Includes troubleshooting guide and technical details
- Documents both Gemini and local API setup procedures

## Next Steps
1. Test the integration in the running application
2. Verify model selection works correctly
3. Test Gemini API integration (if user has API key)
4. Consider adding conversation persistence across sessions
5. Implement calendar event creation from AI suggestions

## Active Decisions and Considerations

### LLM Provider Choice
- **Gemini**: Good for users with API keys, requires internet
- **Local API**: Best for development, access to 26+ models including GPT-5, Claude 4, etc.
- Default to first available model on component mount

### Error Handling Strategy
- Use toast notifications for user-facing errors
- Console logging for debugging
- Graceful degradation when API unavailable

### Message Format
- Simplified message format for local API (only content field)
- Full conversation context sent with each request
- Chat history maintained in component state (session-only)

## Important Patterns and Preferences

### State Management
- Using React hooks (useState, useEffect) for local state
- localStorage for API key persistence
- No global state needed for current scope

### API Communication
- Fetch API for all HTTP requests
- Async/await pattern for cleaner code
- Proper TypeScript typing for all interfaces

### UI/UX Patterns
- Settings in modal dialog (shadcn Dialog component)
- Dropdown for model selection (shadcn Select component)
- Toast notifications for feedback (shadcn Toast)
- Loading states with spinners

## Known Issues
None currently. Integration tested successfully with local API.

## Learnings and Project Insights

### Local API Response Format
The local VS Code LM API returns responses in this format:
```json
{
  "success": true,
  "response": "AI response text here",
  "model": { "id": "...", "name": "...", "vendor": "..." }
}
```
This differs from typical OpenAI-style format, so the service checks multiple possible response fields.

### Model Availability
- Local API provides 26 models including latest GPT-5, Claude 4.5, Gemini 2.5 Pro
- Gemini API only available if user configures API key
- Auto-select first available model on mount for better UX

### Component Architecture
- Keep LLM logic in separate service (separation of concerns)
- Component focuses on UI and user interaction
- Service handles all API communication and data transformation
