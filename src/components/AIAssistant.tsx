import { useState, useEffect } from "react";
import { Send, Sparkles, Settings, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { llmService, LLMModel, Message } from "@/services/llmService";
import { CalendarService, CALENDAR_TOOLS } from "@/services/calendarService";
import { CalendarEvent, FamilyMember } from "@/types/calendar";
import { MemoryExtractionService } from "@/services/memoryExtractionService";
import { StorageService } from "@/services/storageService";
import { useToast } from "@/hooks/use-toast";
import { EventCard } from "@/components/EventCard";
import { getGeminiApiKey } from "@/config/gemini";

interface AIAssistantProps {
  calendarService: CalendarService;
  currentDate: Date;
  todayEvents: CalendarEvent[];
  weekEvents: CalendarEvent[];
  familyMembers: FamilyMember[];
  onMemoryUpdate?: () => void;
  initialMessage?: string;
}

interface MessageWithEvent extends Message {
  event?: CalendarEvent;
  eventMember?: FamilyMember;
}

export const AIAssistant = ({
  calendarService,
  currentDate,
  todayEvents,
  weekEvents,
  familyMembers,
  onMemoryUpdate,
  initialMessage,
}: AIAssistantProps) => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<MessageWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();

  // Background memory extraction
  const extractMemoriesInBackground = async (userMessage: string) => {
    try {
      const result = await MemoryExtractionService.extractMemories(
        userMessage,
        chatHistory,
        familyMembers
      );

      if (result.hasMemory && result.memories.length > 0) {
        // Save the memories
        const saveResult = await MemoryExtractionService.saveExtractedMemories(
          result.memories,
          familyMembers
        );

        if (saveResult.saved > 0) {
          // Notify user about saved memories
          const memoryTypes = result.memories.map(m => {
            switch (m.type) {
              case 'user': return 'personal preference';
              case 'family': return 'family memory';
              case 'place': return 'location';
              case 'travel': return 'travel info';
            }
          }).join(', ');

          toast({
            title: "💡 Memory Saved",
            description: `I learned something new: ${memoryTypes}`,
          });

          // Notify parent component to refresh memory data
          if (onMemoryUpdate) {
            onMemoryUpdate();
          }
        }

        if (saveResult.errors.length > 0) {
          console.error('Memory save errors:', saveResult.errors);
        }
      }
    } catch (error) {
      // Silent fail - memory extraction is a background feature
      console.error('Background memory extraction failed:', error);
    }
  };

  // Load API key and fetch models on mount
  useEffect(() => {
    // Try to get API key from config first, then localStorage
    const configKey = getGeminiApiKey();
    if (configKey) {
      setGeminiApiKey(configKey);
      llmService.setGeminiKey(configKey);
    }
    loadModels();
  }, []);

  // Handle initial message when provided
  useEffect(() => {
    if (initialMessage && selectedModel) {
      setMessage(initialMessage);
      // Auto-send after a brief delay to ensure UI is ready
      const timer = setTimeout(() => {
        handleSendWithMessage(initialMessage);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialMessage, selectedModel]);

  const loadModels = async () => {
    const availableModels = await llmService.getAvailableModels();
    setModels(availableModels);
    
    if (availableModels.length > 0 && !selectedModel) {
      setSelectedModel(availableModels[0]);
    }
  };

  const handleSaveSettings = () => {
    if (geminiApiKey) {
      // Only save to localStorage if user manually enters a key
      // (config file key takes precedence)
      localStorage.setItem('gemini_api_key', geminiApiKey);
      llmService.setGeminiKey(geminiApiKey);
      toast({
        title: "Settings saved",
        description: "Gemini API key has been saved.",
      });
      loadModels(); // Reload models to include Gemini
    }
    setSettingsOpen(false);
  };

  const handleSendWithMessage = async (messageToSend: string) => {
    if (!messageToSend.trim()) return;

    if (!selectedModel) {
      toast({
        title: "No model selected",
        description: "Please select a model or configure your settings.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: messageToSend.trim()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      // Generate calendar context
      const calendarContext = calendarService.generateContextString({
        currentDate,
        todayEvents,
        weekEvents,
        familyMembers,
      });

      // Create system prompt with calendar tools information
      const systemPrompt = `You are an AI calendar assistant with intelligent scheduling capabilities. You help users manage their calendar by creating, moving, editing, and deleting meetings while providing smart suggestions.

IMPORTANT - When creating events, you MUST:
1. Always include an appropriate "emoji" parameter (not "type") - choose an emoji that represents the event
2. Always include an "aiTip" parameter with a helpful scheduling tip based on:
   - The event's timing and duration
   - Surrounding events in the schedule
   - Potential preparation needs
   - Time management considerations
   - If the event title is in Hebrew, write the tip in Hebrew; otherwise in English
3. Analyze the calendar context before suggesting tips
4. Keep tips brief (1-2 sentences) and actionable

Example good event creation:
{
  "tool": "create_meeting",
  "parameters": {
    "title": "Team Standup",
    "startTime": "2025-10-09T09:00:00.000Z",
    "endTime": "2025-10-09T09:30:00.000Z",
    "memberId": "1",
    "category": "work",
    "priority": "medium",
    "emoji": "💼",
    "aiTip": "Schedule at the start of the day for maximum team alignment. Consider having coffee ready to energize the discussion."
  }
}

CRITICAL: You MUST use exact parameter names as specified in the tool definitions below. Do NOT use snake_case or any other naming convention.

INTELLIGENT FEATURES:
1. **Auto-Categorization**: Analyze meeting content and automatically assign the correct category:
   - "work" for business meetings, team syncs, project discussions, client calls
   - "health" for doctor appointments, therapy, gym, medical tests, wellness activities
   - "personal" for errands, shopping, personal goals, hobbies
   - "family" for family time, kids activities, family events, meals together

2. **Emoticon Icons**: Choose an appropriate emoticon for the meeting type:
   - 💼 Business/work meetings, professional calls
   - 🏥 Medical/health appointments
   - 🏋️ Exercise, gym, fitness
   - 🍽️ Meals, lunch, dinner
   - 📚 Learning, courses, reading
   - 👨‍👩‍👧‍👦 Family events, quality time
   - 🎯 Personal goals, important tasks
   - 🛒 Shopping, errands
   - 🚗 Travel, trips
   - 🎉 Celebrations, parties
   - 🎮 Entertainment, leisure
   - 💪 Sports, physical activities

3. **Smart Scheduling Suggestions**: After analyzing the schedule, provide helpful suggestions like:
   - Identifying scheduling conflicts
   - Recommending optimal meeting times
   - Suggesting prep time before important meetings
   - Noticing overbooked days
   - Recommending breaks between back-to-back meetings
   - Finding time for recurring activities

Available Tools:

1. create_meeting - Create a new meeting/event
   Required parameters (use EXACTLY these names):
   - title (string): Meeting title
   - startTime (string): ISO 8601 datetime (e.g., "2025-10-08T18:00:00.000+03:00")
   - endTime (string): ISO 8601 datetime
   - memberId (string): Primary family member ID from the context
   - category (string): One of: health, work, personal, family, education, social, finance, home, travel, fitness, food, shopping, entertainment, sports, hobby, volunteer, appointment, maintenance, celebration, meeting, childcare, pet, errand, transport, project, deadline (intelligently determined)
   - priority (string): One of: low, medium, high (based on importance)
   - emoji (string): Appropriate emoticon icon for the meeting (not "type")
   - aiTip (string): Context-aware scheduling tip in Hebrew if title is Hebrew, otherwise in English
   Optional:
   - description (string): Meeting notes
   - memberIds (array of strings): For multi-person events, include all attending family member IDs (e.g., ["1", "2", "3"]). Use this for family events, group activities, or when multiple people are mentioned. memberId should be the first ID in this array.

2. move_meeting - Reschedule an existing meeting
   Required parameters:
   - eventId (string): The event ID from calendar context
   - newStartTime (string): New ISO 8601 datetime
   - newEndTime (string): New ISO 8601 datetime

3. edit_meeting - Edit meeting details
   Required parameters:
   - eventId (string): The event ID from calendar context
   Optional (at least one required):
   - title, description, category, priority

4. delete_meeting - Delete a meeting
   Required parameters:
   - eventId (string): The event ID from calendar context

When the user asks you to perform calendar operations, respond with a JSON code block:
\`\`\`json
{
  "tool": "create_meeting",
  "parameters": {
    "title": "Meeting with Gil",
    "startTime": "2025-10-08T18:00:00.000+03:00",
    "endTime": "2025-10-08T19:00:00.000+03:00",
    "memberId": "1",
    "category": "personal",
    "priority": "medium",
    "type": "💼"
  }
}
\`\`\`

After creating/modifying events, provide helpful suggestions based on the schedule such as:
- "I notice you have back-to-back meetings. Would you like me to add a 15-minute break?"
- "Your schedule looks busy tomorrow. Consider blocking focus time."
- "This meeting conflicts with an existing event. Should I reschedule one of them?"

Calendar Context:
${calendarContext}

Current timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
When calculating times, use the current date and timezone shown above. For "today at 6pm", use today's date (${currentDate.toLocaleDateString()}) with 18:00 in the local timezone format.`;

      const response = await llmService.chat({
        messages: [...chatHistory, userMessage],
        model: selectedModel,
        tools: CALENDAR_TOOLS,
        systemPrompt,
      });

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if there are tool calls to execute
      if (response.toolCalls && response.toolCalls.length > 0) {
        // Execute each tool call
        const toolResults: string[] = [];
        let createdEvent: CalendarEvent | undefined;
        let createdEventMember: FamilyMember | undefined;
        
        for (const toolCall of response.toolCalls) {
          // If this is a create_meeting call, extract AI tip from the response
          if (toolCall.tool === 'create_meeting' && response.content) {
            // Try to extract any tips/suggestions from the AI's response
            const tipMatch = response.content.match(/(?:I notice|Consider|Suggestion|Tip|Note|Would you like|You might want to|This meeting|Your schedule)[^.!?]*[.!?]/gi);
            if (tipMatch && tipMatch.length > 0) {
              // Add the first meaningful tip to the parameters
              const aiTip = tipMatch[0].trim();
              toolCall.parameters.aiTip = aiTip;
            }
          }
          
          const result = calendarService.executeToolCall(toolCall);
          
          if (result.success) {
            toolResults.push(`✓ ${result.message}`);
            
            // If this was a create_meeting call, store the created event for rendering
            if (toolCall.tool === 'create_meeting' && result.data) {
              createdEvent = result.data as CalendarEvent;
              createdEventMember = familyMembers.find(m => m.id === createdEvent?.memberId);
            }
            
            toast({
              title: "Action Completed",
              description: result.message,
            });
          } else {
            toolResults.push(`✗ Error: ${result.error}`);
            toast({
              title: "Action Failed",
              description: result.error,
              variant: "destructive",
            });
          }
        }

        // Add assistant message with event data for rendering
        const assistantMessage: MessageWithEvent = {
          role: 'assistant',
          content: response.content,
          event: createdEvent,
          eventMember: createdEventMember,
        };

        setChatHistory(prev => [...prev, assistantMessage]);
      } else {
        // No tool calls, just add the response
        const assistantMessage: MessageWithEvent = {
          role: 'assistant',
          content: response.content
        };

        setChatHistory(prev => [...prev, assistantMessage]);
      }

      // Run memory extraction in background (don't await)
      extractMemoriesInBackground(userMessage.content);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from LLM",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    await handleSendWithMessage(message);
  };

  return (
    <div className="flex h-full min-h-[480px] flex-col gap-3 rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <img src="/pandai.png" alt="AI" className="h-12 w-12 object-contain" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Assistant</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your scheduling companion</p>
          </div>
        </div>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>AI Settings</DialogTitle>
              <DialogDescription>
                Configure your AI model preferences
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-key">Gemini API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
              <Button onClick={handleSaveSettings} className="w-full">
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Model Selection */}
      <div>
        <Select
          value={selectedModel?.id}
          onValueChange={(value) => {
            const model = models.find(m => m.id === value);
            setSelectedModel(model || null);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.length === 0 ? (
              <SelectItem value="none" disabled>
                No models available - configure settings
              </SelectItem>
            ) : (
              models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name} ({model.vendor})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Conversation Area */}
      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        {chatHistory.length > 0 ? (
          <div className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-slate-50/80 p-4 dark:bg-slate-800/60" style={{ minHeight: '280px', maxHeight: '420px' }}>
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'ml-8 bg-sky-100/80 dark:bg-sky-900/30'
                    : 'mr-8 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </div>
                
                {/* Render EventCard if this message has an event */}
                {msg.event && (
                  <div className="mb-3">
                    <EventCard event={msg.event} member={msg.eventMember} />
                  </div>
                )}
                
                {/* Render the text content - filter out JSON code blocks when event is shown */}
                {(() => {
                  let displayContent = msg.content;
                  
                  // If we're showing an event widget, remove JSON code blocks from the text
                  if (msg.event) {
                    // Remove ```json...``` blocks
                    displayContent = displayContent.replace(/```json\s*\n[\s\S]*?\n```/g, '').trim();
                    // Remove any standalone JSON objects
                    displayContent = displayContent.replace(/\{[\s\S]*?"tool"[\s\S]*?\}/g, '').trim();
                  }
                  
                  return displayContent ? (
                    <p className="whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100">
                      {displayContent}
                    </p>
                  ) : null;
                })()}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50/80 p-4 dark:bg-slate-800/60">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Wrench className="h-3 w-3" />
              <span>Calendar Control Enabled</span>
            </div>
            <p className="text-sm text-slate-900 dark:text-slate-100">
              Hi! I'm your AI calendar assistant with full calendar control. I can:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              <li>• Create new meetings and events</li>
              <li>• Move or reschedule existing meetings</li>
              <li>• Edit meeting details (title, description, priority)</li>
              <li>• Delete or cancel meetings</li>
            </ul>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
              I can see your current schedule for today and this week. Just tell me what you need!
            </p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask me to schedule something..."
          className="flex-1 resize-none rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-sky-500 dark:focus:ring-sky-900/30"
          style={{ minHeight: '40px', maxHeight: '120px' }}
          rows={1}
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          size="icon"
          disabled={!message.trim() || isLoading}
          className="h-10 w-10 flex-shrink-0 rounded-lg bg-sky-600 transition hover:bg-sky-700"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
