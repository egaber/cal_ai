import { useState, useEffect, useRef } from "react";
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
import { getGeminiApiKey, getAzureOpenAIApiKey } from "@/config/gemini";
import { buildCategoryPromptList } from "@/config/taskCategories";
import { todoTaskService } from "@/services/todoTaskService";

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
  const [azureOpenAIApiKey, setAzureOpenAIApiKey] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll to bottom when chat history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

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

  // Load API keys and fetch models on mount
  useEffect(() => {
    // Try to get Gemini API key from config first, then localStorage
    const geminiKey = getGeminiApiKey();
    if (geminiKey) {
      setGeminiApiKey(geminiKey);
      llmService.setGeminiKey(geminiKey);
    }

    // Try to get Azure OpenAI API key (used for all Azure models)
    const azureOpenAIKey = getAzureOpenAIApiKey();
    if (azureOpenAIKey) {
      setAzureOpenAIApiKey(azureOpenAIKey);
      llmService.setAzureOpenAIKey(azureOpenAIKey);
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
    let saved = false;

    if (geminiApiKey) {
      localStorage.setItem('gemini_api_key', geminiApiKey);
      llmService.setGeminiKey(geminiApiKey);
      saved = true;
    }

    if (azureOpenAIApiKey) {
      localStorage.setItem('azure_openai_api_key', azureOpenAIApiKey);
      llmService.setAzureOpenAIKey(azureOpenAIApiKey);
      saved = true;
    }

    if (saved) {
      toast({
        title: "Settings saved",
        description: "API keys have been saved.",
      });
      loadModels(); // Reload models to include new providers
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

      // Get todo tasks context
      const todosContext = await todoTaskService.getTodosForAI();

      // Create system prompt with calendar tools information + centralized category list
      const categoriesList = buildCategoryPromptList();
      const systemPrompt = `You are an AI calendar assistant with intelligent scheduling capabilities. You help users manage the calendar by creating, moving, editing, and deleting meetings while providing smart suggestions. You also help with task scheduling and management.

IMPORTANT - When creating events, you MUST:
1. Always include an appropriate "emoji" parameter (not "type") that matches the chosen category or specific activity
2. Always include an "aiTip" parameter: a brief (1-2 sentences) actionable scheduling tip that considers timing, surrounding events, prep/buffer needs. Tip language: Hebrew if the title is Hebrew, else English.
3. Analyze the calendar context before suggesting tips
4. Use ONLY allowed parameter names

CENTRAL CATEGORY LIST (id emoji - meaning):
${categoriesList}

Rules for category:
- Pick exactly one id from the list above (do not invent new ids)
- If multiple could apply, choose the most specific
- Keep category consistent with emoji

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
    "aiTip": "Start of day sync keeps everyone aligned; keep it brief."
  }
}

CRITICAL: Use exact parameter names as specified in the tool definitions below. Do NOT use snake_case.

INTELLIGENT FEATURES:
1. Auto-Categorization: Infer the single best category id from the centralized list.
2. Emoji Selection: Choose a representative emoji (prefer the one shown in list; may adapt if needed).
3. Smart Scheduling Suggestions: Provide helpful tips about conflicts, prep time, breaks, and optimization.

Available Tools:

1. create_meeting - Create a new meeting/event (for calendar events)
   Required:
   - title (string)
   - startTime (ISO 8601)
   - endTime (ISO 8601)
   - memberId (string)
   - category (string from list above)
   - priority (low|medium|high)
   - emoji (string)
   - aiTip (string)
   Optional:
   - description (string)
   - memberIds (array of strings) for multi-person events (memberId must appear first)

2. move_meeting
   Required: eventId, newStartTime, newEndTime

3. edit_meeting
   Required: eventId
   Optional (one or more): title, description, category, priority

4. delete_meeting
   Required: eventId

5. schedule_task - Schedule a todo task by creating a calendar event
   Required: taskId, suggestedStartTime, duration, memberId, category, priority, emoji, reasoning
   Use this when user asks to schedule a task from their todo list.

TASK SCHEDULING INTELLIGENCE:
When scheduling tasks, you must:
1. Analyze current calendar to find optimal time slots
2. Consider task priority and deadline
3. Avoid conflicts with existing events
4. Include buffer time between events (at least 15 min)
5. Respect user preferences (morning person vs. night person)
6. Group similar tasks together when possible
7. Provide clear reasoning for scheduling decisions

Return ONLY JSON tool calls when performing actions. Plain natural language otherwise.

Calendar Context:
${calendarContext}

Todo Tasks:
${todosContext}

Current timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}
Interpret relative times like "today at 6pm" using today's date (${currentDate.toLocaleDateString()}) and local time (18:00).

When user asks about tasks or to schedule their tasks, analyze the todo list above and create smart scheduling suggestions considering priorities, deadlines, and calendar availability.`;

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
            
            // If this was a schedule_task call, update the task with the event ID
            if (toolCall.tool === 'schedule_task' && result.data) {
              const data = result.data as { event: CalendarEvent; taskId: string; eventId: string };
              createdEvent = data.event;
              createdEventMember = familyMembers.find(m => m.id === createdEvent?.memberId);
              
              // Update the task in Firestore with the event ID
              try {
                await todoTaskService.updateTodoInFirestore(data.taskId, {
                  scheduledEventId: data.eventId,
                  scheduledAt: new Date().toISOString()
                });
              } catch (error) {
                console.error('Failed to update task with event ID:', error);
              }
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
    <div className={`flex flex-col ${isMobile ? 'h-full overflow-hidden' : 'h-full min-h-[480px] rounded-xl border border-slate-200/80 shadow-sm p-4'} bg-white dark:bg-slate-900 ${!isMobile ? 'gap-3' : ''}`}>
      {/* Header - Always visible at top */}
      <div className={`flex-none flex items-center justify-between gap-2 bg-white dark:bg-slate-900 ${isMobile ? 'px-4 py-3 border-b border-slate-200/80 dark:border-slate-700/60' : ''}`} style={isMobile ? { paddingTop: 'max(12px, env(safe-area-inset-top))' } : {}}>
        <div className="flex items-center gap-3">
          <img src="/pandai.png" alt="AI" className="h-10 w-10 object-contain" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Assistant v1.4</h3>
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
                <Label htmlFor="gemini-key">Gemini API Key (Optional)</Label>
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

              <div className="space-y-2">
                <Label htmlFor="azure-openai-key">Azure OpenAI API Key (Optional)</Label>
                <Input
                  id="azure-openai-key"
                  type="password"
                  placeholder="Enter your Azure OpenAI API key"
                  value={azureOpenAIApiKey}
                  onChange={(e) => setAzureOpenAIApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  For all Azure models: GPT-4.1, GPT-5 Mini, Grok 4, O3 Mini
                </p>
              </div>

              <Button onClick={handleSaveSettings} className="w-full">
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Model Selection - Fixed below header for mobile */}
      <div className={`flex-none bg-white dark:bg-slate-900 ${isMobile ? 'px-4 py-1.5 border-b border-slate-200/80 dark:border-slate-700/60' : ''}`}>
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

      {/* Conversation Area - Scrollable, takes all available space */}
      <div className={`flex-1 min-h-0 ${isMobile ? '' : 'gap-3'}`}>
        {chatHistory.length > 0 ? (
          <div 
            ref={chatContainerRef}
            className={`h-full overflow-y-auto flex flex-col justify-end ${isMobile ? 'px-4 py-3' : 'rounded-lg p-4 bg-slate-50/80 dark:bg-slate-800/60'}`} 
            style={isMobile ? { 
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            } : { minHeight: '280px', maxHeight: '420px' }}
          >
            <div className="space-y-3">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'ml-8 bg-sky-100/80 dark:bg-sky-900/30'
                      : 'mr-8 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50'
                  }`}
                >
                  <div className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {msg.role === 'user' ? '🙍‍♂️' : '🐼'}
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
          </div>
        ) : (
          <div className={`h-full flex items-center justify-center ${isMobile ? 'px-4 py-8' : 'rounded-lg bg-slate-50/80 dark:bg-slate-800/60 p-4'}`}>
            <div>
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
          </div>
        )}
      </div>

      {/* Input Area - Stays at bottom */}
      <div className={`flex gap-2 flex-none ${isMobile ? 'px-4 py-3 border-t border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900' : ''}`} style={isMobile ? { paddingBottom: 'max(12px, env(safe-area-inset-bottom))' } : {}}>
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
