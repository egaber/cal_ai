# Gemini Integration Guide

This guide provides detailed information about integrating and using Google's Gemini AI models in the Calendar AI application.

## Overview

Calendar AI now supports multiple Gemini models from Google, offering various capabilities for different use cases:

- **Gemini 2.0 Flash (Experimental)** - Latest model with fast responses and experimental features
- **Gemini 1.5 Pro** - Advanced reasoning, long context window (up to 2M tokens)
- **Gemini 1.5 Flash** - Fast responses with excellent performance
- **Gemini Pro** - Original Gemini model, reliable and stable

## Getting Started

### 1. Obtain a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy your API key (keep it secure!)

**Note**: Gemini API offers a generous free tier with daily quota. Check [Google AI pricing](https://ai.google.dev/pricing) for current limits.

### 2. Configure in Calendar AI

1. Open the Calendar AI application
2. Navigate to the AI Assistant panel
3. Click the Settings icon (⚙️)
4. Paste your Gemini API key in the "Gemini API Key" field
5. Click "Save Settings"

Your API key is stored securely in your browser's local storage and is only sent to Google's Gemini API endpoints.

### 3. Select a Gemini Model

After saving your API key, all Gemini models will appear in the model dropdown:

- **For general chat and scheduling**: Use Gemini 2.0 Flash for fastest responses
- **For complex reasoning**: Use Gemini 1.5 Pro for advanced analysis
- **For balanced performance**: Use Gemini 1.5 Flash
- **For stability**: Use Gemini Pro (original model)

## Features Powered by Gemini

### 1. AI Chat Assistant
- Natural language scheduling assistance
- Task breakdown and planning
- Calendar optimization suggestions
- Multi-turn conversations with context

### 2. Smart Event Creation
- **Automatic Emoji Selection**: Gemini analyzes event titles and suggests appropriate emojis
- **Event Categorization**: Automatically categorizes events into 25+ categories
- **Context-Aware Tips**: Provides scheduling tips based on surrounding events

### 3. Event Intelligence
- Analyzes event timing and provides preparation suggestions
- Detects potential conflicts
- Suggests buffer time between events
- Optimizes daily schedule

## Gemini Models Comparison

| Model | Speed | Context Window | Best For |
|-------|-------|----------------|----------|
| **2.0 Flash (Exp)** | ⚡⚡⚡ Very Fast | Large | Quick responses, experimentation |
| **1.5 Pro** | ⚡⚡ Fast | 2M tokens | Complex analysis, long documents |
| **1.5 Flash** | ⚡⚡⚡ Very Fast | Large | Balanced performance |
| **Pro** | ⚡⚡ Fast | Standard | Reliable, proven performance |

## API Usage and Limits

### Free Tier (as of documentation)
- 60 requests per minute
- Daily quota varies by model
- Sufficient for personal calendar usage

### Rate Limiting
The application handles rate limits gracefully:
- Displays error messages if quota exceeded
- Suggests trying a different model
- Allows switching to local models as fallback

## Example Use Cases

### 1. Creating Events
```
User: "Schedule dentist appointment next Tuesday at 3 PM"
Gemini: Analyzes and creates event with:
- 🦷 Emoji (dental-related)
- Category: health
- Tip: "Consider arriving 15 minutes early for paperwork"
```

### 2. Planning Tasks
```
User: "Break down 'Organize family vacation' into tasks"
Gemini: Creates multiple events:
- 📅 Research destinations
- 🏨 Book accommodation
- ✈️ Book flights
- 🎒 Pack essentials
Each with appropriate emojis and categories
```

### 3. Schedule Optimization
```
User: "Analyze my schedule for tomorrow"
Gemini: Reviews all events and provides:
- Buffer time suggestions
- Energy level considerations
- Preparation reminders
- Conflict detection
```

## Advanced Features

### Multi-Language Support
Gemini automatically detects language in event titles:
- Hebrew events get Hebrew tips
- English events get English tips
- Mixed language schedules supported

### Context-Aware Suggestions
Gemini considers:
- Time of day (morning energy vs afternoon slump)
- Event duration and transitions
- Category-specific requirements
- Surrounding events in schedule

### Smart Categorization
25+ categories including:
- Health, Work, Personal, Family
- Education, Social, Finance
- Travel, Fitness, Food
- Sports, Hobbies, Entertainment
- And more...

## Technical Implementation

### API Endpoint
```
https://generativelanguage.googleapis.com/v1beta/models/{model-id}:generateContent
```

### Request Format
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{"text": "Your message"}]
    },
    {
      "role": "model",
      "parts": [{"text": "AI response"}]
    }
  ]
}
```

### Response Format
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {"text": "Generated response"}
        ]
      }
    }
  ]
}
```

## Troubleshooting

### Issue: "API Key Invalid"
**Solution**: 
- Verify you copied the complete API key
- Ensure no extra spaces in the key
- Generate a new key if needed

### Issue: "Quota Exceeded"
**Solution**:
- Wait for quota to reset (usually daily)
- Switch to a different Gemini model
- Use local models as alternative

### Issue: "No Response"
**Solution**:
- Check your internet connection
- Verify API key is still valid
- Try a different Gemini model
- Check browser console for detailed errors

### Issue: "Rate Limit Exceeded"
**Solution**:
- Slow down request frequency
- Wait 60 seconds before retrying
- Consider upgrading to paid tier if needed

## Best Practices

1. **Model Selection**
   - Use Gemini 2.0 Flash for quick interactions
   - Use 1.5 Pro for complex analysis
   - Switch models if one is slow or unavailable

2. **API Key Security**
   - Never share your API key
   - Don't commit keys to version control
   - Regenerate key if compromised

3. **Cost Management**
   - Monitor your usage in Google AI Studio
   - Use free tier efficiently
   - Consider local models for development

4. **Performance Optimization**
   - Cache frequently used responses
   - Batch similar requests
   - Use appropriate model for task complexity

## Privacy and Security

- **Local Storage**: API key stored only in your browser
- **Direct Connection**: Requests go directly to Google's API
- **No Intermediary**: No third-party servers involved
- **Data Privacy**: Your calendar data is not stored by Gemini
- **Request Only**: Only sends specific event data when generating tips/emojis

## Switching Models

You can switch between Gemini models at any time:

1. Open the model dropdown
2. Select a different Gemini model
3. Continue your conversation

Previous conversation context is maintained when switching models.

## Comparison with Local Models

| Feature | Gemini | Local Models |
|---------|--------|--------------|
| **Setup** | Requires API key | No setup needed |
| **Cost** | Free tier + paid | Free |
| **Internet** | Required | Not required |
| **Speed** | Very fast | Varies |
| **Privacy** | Google's servers | Local only |
| **Models** | 4 Gemini models | 26+ models |

## Support and Resources

- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [API Pricing](https://ai.google.dev/pricing)
- [Community Forum](https://discuss.ai.google.dev/)

## Future Enhancements

Planned features for Gemini integration:
- [ ] Streaming responses for real-time output
- [ ] Function calling for direct calendar manipulation
- [ ] Multi-modal input (images, voice)
- [ ] Advanced scheduling algorithms
- [ ] Team scheduling coordination
- [ ] Smart meeting optimization

## Conclusion

Gemini integration brings powerful AI capabilities to Calendar AI, making schedule management intelligent and effortless. With multiple models to choose from and various features powered by AI, you can optimize your calendar like never before.

For questions or issues, check the troubleshooting section or refer to Google's official documentation.
