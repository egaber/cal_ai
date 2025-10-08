# LLM Integration Guide

This document explains how to use the AI Assistant with different LLM providers in the Calendar AI application.

## Overview

The AI Assistant can connect to two types of LLM providers:
1. **Gemini API** - Google's Gemini Pro model (requires API key)
2. **Local VS Code LM API** - Access to various models through VS Code's Language Model API

## Setup Instructions

### Option 1: Using Gemini API

1. **Get a Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key

2. **Configure in the Application**
   - Click the Settings icon (⚙️) in the AI Assistant panel
   - Enter your Gemini API key in the "Gemini API Key" field
   - Click "Save Settings"
   - The key will be stored locally in your browser

3. **Select Gemini Model**
   - After saving the API key, "Gemini Pro (Google)" will appear in the model dropdown
   - Select it to use Gemini for your AI interactions

### Option 2: Using Local VS Code LM API

1. **Prerequisites**
   - Ensure VS Code Language Model API is running on `http://localhost:3000`
   - The API should be accessible from your browser

2. **Available Models**
   - The application automatically fetches available models from the local API
   - Models include: GPT-4.1, GPT-5, Claude Sonnet, Gemini 2.0 Flash, and more
   - Select any model from the dropdown to use it

3. **No Configuration Required**
   - Local models work out of the box if the API is running
   - No API keys needed for local models

## Using the AI Assistant

1. **Select a Model**
   - Use the dropdown menu to choose your preferred LLM model
   - You can switch models at any time during conversation

2. **Start Chatting**
   - Type your message in the input box
   - Press Enter or click the Send button
   - Wait for the AI response (a loading spinner will appear)

3. **Chat History**
   - All messages are displayed in the chat history
   - User messages appear on the right with a blue background
   - AI responses appear on the left with an accent background
   - Chat history is maintained during your session

4. **Example Prompts**
   - "Schedule a team meeting for tomorrow at 2 PM"
   - "Help me plan my week with 3 project tasks"
   - "Break down 'Build a website' into smaller tasks"
   - "Suggest a shopping list for a healthy dinner"

## Technical Details

### API Endpoints

**Local VS Code LM API:**
- Models: `GET http://localhost:3000/api/models`
- Chat: `POST http://localhost:3000/api/chat`

**Gemini API:**
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

### Request Format (Local API)

```json
{
  "messages": [
    {
      "content": "Your message here"
    }
  ],
  "model": {
    "id": "gpt-4.1"
  }
}
```

### Response Format (Local API)

```json
{
  "success": true,
  "response": "AI response text",
  "model": {
    "id": "gpt-4.1",
    "vendor": "copilot",
    "family": "gpt-4.1",
    "name": "GPT-4.1"
  }
}
```

## Troubleshooting

### No Models Available
- **Issue**: Dropdown shows "No models available - configure settings"
- **Solution**: 
  - Make sure the local API is running on `http://localhost:3000`
  - Or configure your Gemini API key in settings

### Error: "Gemini API key not set"
- **Issue**: Trying to use Gemini without API key
- **Solution**: Add your Gemini API key in the Settings dialog

### Connection Errors
- **Issue**: Cannot connect to local API
- **Solution**: 
  - Verify the API is running: `curl http://localhost:3000/api/models`
  - Check that port 3000 is not blocked
  - Ensure CORS is properly configured on the API

### No Response from AI
- **Issue**: Message sent but no response appears
- **Solution**:
  - Check browser console for errors
  - Verify the selected model is available
  - Try switching to a different model

## Features

✅ Multiple LLM provider support (Gemini + Local models)
✅ Model selection dropdown
✅ Chat history with message distinction
✅ Settings dialog for API key management
✅ Loading indicators during API calls
✅ Error handling and user notifications
✅ Local storage for API key persistence
✅ Responsive UI with accessible components

## Security Notes

- API keys are stored in browser's localStorage
- Keys are never sent to any server except the respective API provider
- Use environment variables for production deployments
- Consider implementing backend proxy for API calls in production

## Future Enhancements

- [ ] Streaming responses for real-time output
- [ ] Conversation history persistence across sessions
- [ ] Export/import chat history
- [ ] Custom system prompts
- [ ] Token usage tracking
- [ ] Multiple conversation threads
- [ ] Integration with calendar events
