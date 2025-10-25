import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Settings, Wrench, RotateCcw } from "lucide-react";
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
import { todoTaskService, TodoTask } from "@/services/todoTaskService";
import { useAuth } from "@/contexts/AuthContext";
import { TaskList } from "@/components/TaskList";
import { TaskCard } from "@/components/TaskCard";
import { modelConfigService } from "@/services/modelConfigService";

interface AIAssistantProps {
  calendarService: CalendarService;
  currentDate: Date;
  todayEvents: CalendarEvent[];
  weekEvents: CalendarEvent[];
  familyMembers: FamilyMember[];
  onMemoryUpdate?: () => void;
  initialMessage?: string;
  onNavigateToCalendar?: (eventId: string) => void;
}

interface MessageWithEvent extends Message {
  event?: CalendarEvent;
  eventMember?: FamilyMember;
  followupButtons?: string[];
  taskList?: TodoTask[];
  taskAnalysis?: {
    taskAnalysis: Array<{
      task: string;
      taskId?: string;
      urgency: string;
      importance: string;
      timeframe: string;
      suggestedTimeframe?: string;
      reasoning: string;
      dependencies?: string[];
    }>;
    overallStrategy: string;
  };
  weeklyPlan?: {
    weeklyStrategy: string;
    dailyPlans: Array<{
      day: string;
      focus: string;
      priorityTasks: string[];
      timeBlocks?: Array<{
        time: string;
        activity: string;
        reasoning?: string;
      }>;
    }>;
    recommendations: string[];
  };
  subtasks?: {
    parentTaskId: string;
    subtasks: Array<{ text: string; estimatedDuration?: number; priority?: string }>;
    reasoning: string;
  };
}

export const AIAssistant = ({
  calendarService,
  currentDate,
  todayEvents,
  weekEvents,
  familyMembers,
  onMemoryUpdate,
  initialMessage,
  onNavigateToCalendar,
}: AIAssistantProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<MessageWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize todo task service with user credentials
  useEffect(() => {
    if (user?.uid && user?.familyId) {
      console.log('🔧 AIAssistant: Initializing todoTaskService with user:', user.uid, 'family:', user.familyId);
      todoTaskService.initialize(user.uid, user.familyId);
    }
  }, [user]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('ai_chat_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setChatHistory(parsed);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('ai_chat_history', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

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
      llmService.setGeminiKey(geminiKey);
    }

    // Try to get Azure OpenAI API key (used for all Azure models)
    const azureOpenAIKey = getAzureOpenAIApiKey();
    if (azureOpenAIKey) {
      llmService.setAzureOpenAIKey(azureOpenAIKey);
    }

    loadModels();

    // Subscribe to model changes from settings
    const unsubscribe = modelConfigService.subscribe(() => {
      loadModels();
    });

    return unsubscribe;
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
    
    // Use centralized model config to get the selected model
    const model = modelConfigService.findModel(availableModels);
    setSelectedModel(model);
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

FOLLOWUP BUTTONS FEATURE:
After each response, you SHOULD provide 2-5 suggested followup questions or ACTIONABLE commands as buttons to help the user continue easily. Include these at the end of your response in this format:
"followup_buttons": ["Action 1", "Action 2", "Action 3"]

Examples of good actionable followup buttons:
- After creating an event: ["Schedule my next task", "Show today's events", "Move this event", "Add a reminder"]
- After showing schedule: ["Schedule priority tasks", "Find free time slot", "Create new meeting", "Show week summary"]
- After task scheduling: ["Schedule another task", "Show all tasks", "Update priorities", "Add new task"]
- After task analysis: ["תזמן משימות בעדיפות גבוהה", "פרק משימה מורכבת", "צור תכנית שבועית", "הוסף משימה חדשה"]
- General helpful actions: ["Review today", "Plan tomorrow", "Check conflicts", "Optimize schedule"]

Make buttons ACTIONABLE (commands/requests) rather than just questions. Keep them short, specific, and immediately useful. Mix Hebrew and English based on user's language preference.

TASK MANAGEMENT & AGENTIC WORKFLOWS:
You now have advanced task management capabilities with rich UI components. Use these for sophisticated task planning workflows:

1. TASK DISPLAY: When showing tasks, they will be rendered as rich TaskCard or TaskList components with:
   - Visual priority indicators, time buckets, and metadata
   - Purple AI reasoning overlays explaining your analysis
   - Action buttons for scheduling, breakdown, editing
   - Expandable subtasks

2. MULTI-PHASE WORKFLOWS: For complex requests like "תכנון שבוע הבא" or task prioritization:
   - Phase 1: Fetch and analyze all tasks using task context
   - Phase 2: Apply time management principles (Eisenhower Matrix, SMART goals)
   - Phase 3: Reorder by urgency/importance, suggest scheduling
   - Phase 4: Create structured weekly plan or breakdown complex tasks

3. TASK ANALYSIS PRINCIPLES:
   - Urgency vs Importance (Eisenhower Matrix)
   - Dependencies between tasks
   - Calendar conflicts and optimal timing
   - Cognitive load and energy management
   - SMART criteria for task breakdown

4. ACTIONABLE WORKFLOWS:
   - "סקור ותזמן משימות" → analyze_task_priority → schedule high-priority tasks
   - "תכנון שבוע הבא" → create_weekly_plan with structured daily focuses
   - "פרק משימה מורכבת" → add_subtask with SMART breakdown
   - "הוסף משימה" → add_task with proper categorization

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
   IMPORTANT: When scheduling tasks, use the full task name/text as the taskId parameter, NOT the numeric position. For example, if the task list shows "7. לקנות קפסולות קפה", use "לקנות קפסולות קפה" as the taskId, not "7".

6. add_task - Add a new todo task to the task list
   Required: taskText
   Optional: priority, timeBucket, owner, location, category
   Use when user asks to create, add, or remember a new task.

7. add_subtask - Break down complex tasks into manageable subtasks
   Required: parentTaskId, subtasks (array of objects with "text" field), reasoning
   Use when a task is complex and benefits from SMART breakdown. Only suggest if task is genuinely complex.
   
   IMPORTANT: Each subtask object MUST have a "text" field with the subtask description.
   Example format:
   {
     "parentTaskId": "task name",
     "subtasks": [
       {"text": "First subtask description", "estimatedDuration": 30, "priority": "P1"},
       {"text": "Second subtask description", "estimatedDuration": 45, "priority": "P2"}
     ],
     "reasoning": "Explanation of the breakdown"
   }

8. analyze_task_priority - Intelligent task prioritization using time management principles
   Required: taskAnalysis (array with urgency/importance/timeframe/reasoning), overallStrategy
   Use for requests like "prioritize my tasks", "what should I do first", or comprehensive task analysis.

9. create_weekly_plan - Comprehensive weekly planning with daily focuses and time blocks
   Required: weeklyStrategy, dailyPlans (array), recommendations
   Use for "תכנון שבוע הבא" or weekly planning requests.

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
        console.log('🔧 Executing tool calls:', response.toolCalls);
        
        // Execute each tool call
        const toolResults: string[] = [];
        let createdEvent: CalendarEvent | undefined;
        let createdEventMember: FamilyMember | undefined;
        let taskAnalysisData: MessageWithEvent['taskAnalysis'] | undefined;
        let weeklyPlanData: MessageWithEvent['weeklyPlan'] | undefined;
        let subtasksData: MessageWithEvent['subtasks'] | undefined;
        let taskListData: TodoTask[] | undefined;
        
        for (const toolCall of response.toolCalls) {
          console.log('🔧 Processing tool:', toolCall.tool, 'with params:', toolCall.parameters);
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
          console.log('🔧 Tool result:', result);
          
          // Log event details for debugging
          if (result.success && result.data) {
            console.log('📅 Event data:', JSON.stringify(result.data, null, 2));
          }
          
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
            
            // Handle task management tool results
            if (toolCall.tool === 'analyze_task_priority' && result.data) {
              taskAnalysisData = result.data as MessageWithEvent['taskAnalysis'];
            }
            
            if (toolCall.tool === 'create_weekly_plan' && result.data) {
              weeklyPlanData = result.data as MessageWithEvent['weeklyPlan'];
            }
            
            if (toolCall.tool === 'add_subtask' && result.data) {
              subtasksData = result.data as MessageWithEvent['subtasks'];
            }
            
            if (toolCall.tool === 'add_task' && result.data) {
              // Refresh tasks list after adding a task
              try {
                const updatedTasks = await todoTaskService.loadTodosFromFirestore();
                taskListData = updatedTasks;
              } catch (error) {
                console.error('Failed to refresh tasks:', error);
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

        // Try to extract subtasks from content if not already set by tool call
        if (!subtasksData && response.content) {
          // More flexible regex to capture the entire JSON structure
          const subtaskMatch = response.content.match(/\{[^]*?"parentTaskId"[^]*?"subtasks"\s*:\s*\[[^]*?\][^]*?"reasoning"[^]*?\}/);
          if (subtaskMatch) {
            try {
              const extracted = JSON.parse(subtaskMatch[0]);
              console.log('Extracted subtasks:', extracted);
              if (extracted.subtasks && extracted.reasoning) {
                subtasksData = {
                  parentTaskId: extracted.parentTaskId,
                  subtasks: extracted.subtasks,
                  reasoning: extracted.reasoning
                };
                console.log('Setting subtasksData:', subtasksData);
              }
            } catch (e) {
              console.error('Failed to parse subtasks from content:', e);
              console.log('Matched content:', subtaskMatch[0]);
            }
          } else {
            console.log('No subtask match found in content');
          }
        }

        // Add assistant message with all data for rendering
        const assistantMessage: MessageWithEvent = {
          role: 'assistant',
          content: response.content,
          event: createdEvent,
          eventMember: createdEventMember,
          taskAnalysis: taskAnalysisData,
          weeklyPlan: weeklyPlanData,
          subtasks: subtasksData,
          taskList: taskListData,
          followupButtons: response.followupButtons,
        };

        setChatHistory(prev => [...prev, assistantMessage]);
      } else {
        // No tool calls, just add the response
        const assistantMessage: MessageWithEvent = {
          role: 'assistant',
          content: response.content,
          followupButtons: response.followupButtons,
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

        <div className="flex items-center gap-1">
          {chatHistory.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setChatHistory([]);
                localStorage.removeItem('ai_chat_history');
                toast({
                  title: "New conversation",
                  description: "Chat history cleared",
                });
              }}
              title="New conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Model Display - Shows current model selection */}
      <div className={`flex-none bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 ${isMobile ? 'px-4 py-2 border-b border-purple-200/50 dark:border-purple-700/30' : 'rounded-lg p-2 mb-2'}`}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-900 dark:text-purple-100">
              {selectedModel ? `${selectedModel.name} (${selectedModel.vendor})` : 'No model selected'}
            </span>
          </div>
          <span className="text-purple-600 dark:text-purple-400 text-[10px]">
            Configure in Account Settings
          </span>
        </div>
      </div>

      {/* Conversation Area - Scrollable, takes all available space */}
      <div className={`flex-1 min-h-0 ${isMobile ? '' : 'gap-3'}`}>
        {chatHistory.length > 0 ? (
          <div
            ref={chatContainerRef}
            className={`h-full overflow-y-auto scroll-smooth ${isMobile ? 'px-4 py-3' : 'rounded-lg p-4 bg-slate-50/80 dark:bg-slate-800/60'}`}
            style={isMobile ? {
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            } : {
              minHeight: '280px',
              maxHeight: '500px',
              overflowY: 'auto',
              scrollBehavior: 'smooth'
            }}
          >
            <div className="space-y-3 flex flex-col">
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
                    <div 
                      className="mb-3 cursor-pointer hover:opacity-80 transition-opacity" 
                      onClick={() => onNavigateToCalendar?.(msg.event!.id)}
                      title="Click to view in calendar"
                    >
                      <EventCard event={msg.event} member={msg.eventMember} />
                    </div>
                  )}

                  {/* Render TaskList if this message has tasks */}
                  {msg.taskList && msg.taskList.length > 0 && (
                    <div className="mb-3">
                      <TaskList
                        tasks={msg.taskList}
                        title="משימות מעודכנות"
                        showWorkflowActions={true}
                        onTaskSchedule={(task) => handleSendWithMessage(`תזמן את המשימה: ${task.rawText}`)}
                        onTaskBreakdown={(task) => handleSendWithMessage(`פרק למשימות משנה: ${task.rawText}`)}
                        onTaskComplete={(task) => handleSendWithMessage(`סמן כהושלם: ${task.rawText}`)}
                        onWeeklyPlan={() => handleSendWithMessage('צור תכנית שבועית מפורטת')}
                        onTaskAnalysis={(task) => handleSendWithMessage(`נתח משימה: ${task.rawText}`)}
                      />
                    </div>
                  )}

                  {/* Render Task Analysis if this message has analysis */}
                  {msg.taskAnalysis && (
                    <div className="mb-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                      <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        🎯 ניתוח עדיפויות משימות
                      </h3>
                      
                      <div className="mb-4 p-3 bg-purple-100 rounded-md">
                        <h4 className="font-medium text-purple-800 mb-2">אסטרטגיה כללית:</h4>
                        <p className="text-sm text-purple-700">{msg.taskAnalysis.overallStrategy}</p>
                      </div>

                      <div className="space-y-2">
                        {msg.taskAnalysis.taskAnalysis.map((analysis, idx) => {
                          // Extract date from timeframe to show day name and make clickable
                          const dateMatch = (analysis.timeframe || analysis.suggestedTimeframe || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                          let dateInfo = null;
                          let eventDate = null;
                          if (dateMatch) {
                            const [_, day, month, year] = dateMatch;
                            eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
                            const dayName = hebrewDayNames[eventDate.getDay()];
                            dateInfo = { date: `${day}/${month}/${year}`, dayName, fullDate: eventDate };
                          }
                          
                          return (
                            <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all">
                              {/* Task item similar to todo list */}
                              <div className="flex items-start gap-3 mb-2">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                                  {idx + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    {/* Clickable task name to add to context */}
                                    <h5
                                      className="text-base font-medium text-slate-900 leading-snug cursor-pointer hover:text-purple-600 transition-colors"
                                      onClick={() => handleSendWithMessage(`לגבי המשימה: ${analysis.task || analysis.taskId}`)}
                                      title="לחץ להוספה להקשר השיחה"
                                    >
                                      {analysis.task || analysis.taskId}
                                    </h5>
                                    <div className="flex gap-1.5 flex-shrink-0">
                                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                                        analysis.urgency === 'high' ? 'bg-red-100 text-red-700' :
                                        analysis.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        analysis.urgency === 'done' ? 'bg-green-100 text-green-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {analysis.urgency === 'done' ? '✓' : analysis.urgency === 'high' ? '🔴' : analysis.urgency === 'medium' ? '🟡' : '🟢'}
                                      </span>
                                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                                        analysis.importance === 'high' ? 'bg-purple-100 text-purple-700' :
                                        analysis.importance === 'medium' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-700'
                                      }`}>
                                        {analysis.importance === 'high' ? '⭐' : analysis.importance === 'medium' ? '★' : '☆'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Purple AI insights text */}
                                  <div className="mt-2 text-sm text-purple-600 bg-purple-50/50 rounded px-2 py-1.5 border-l-2 border-purple-400">
                                    <div className="flex items-start gap-1.5">
                                      <span className="text-purple-500 flex-shrink-0">✨</span>
                                      <div className="flex-1">
                                        <p className="leading-relaxed">{analysis.reasoning}</p>
                                        {(analysis.timeframe || analysis.suggestedTimeframe) && (
                                          <div className="mt-1 text-xs text-purple-500">
                                            {dateInfo ? (
                                              <button
                                                onClick={() => onNavigateToCalendar?.(dateInfo.fullDate.toISOString())}
                                                className="inline-flex items-center gap-1 hover:text-purple-700 hover:underline transition-colors"
                                                title="לחץ לעבור ליומן"
                                              >
                                                ⏰ יום {dateInfo.dayName}, {dateInfo.date}
                                              </button>
                                            ) : (
                                              <span>⏰ {analysis.timeframe || analysis.suggestedTimeframe}</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Action buttons */}
                                  <div className="mt-2 flex gap-2">
                                    <button
                                      onClick={() => handleSendWithMessage(`פרק למשימות משנה: ${analysis.task || analysis.taskId}`)}
                                      className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors flex items-center gap-1"
                                      title="פירוק המשימה למשימות משנה"
                                    >
                                      <span>🧩</span>
                                      <span>פרק למשימות</span>
                                    </button>
                                    {analysis.urgency !== 'done' && (
                                      <button
                                        onClick={() => handleSendWithMessage(`תזמן את המשימה: ${analysis.task || analysis.taskId}`)}
                                        className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors flex items-center gap-1"
                                        title="תזמון המשימה ביומן"
                                      >
                                        <span>📅</span>
                                        <span>תזמן</span>
                                      </button>
                                    )}
                                  </div>
                                  
                                  {analysis.dependencies && analysis.dependencies.length > 0 && (
                                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                                      <span>🔗</span>
                                      <span>תלויות: {analysis.dependencies.join(', ')}</span>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Render Weekly Plan if this message has a plan */}
                  {msg.weeklyPlan && (
                    <div className="mb-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                        📅 תכנית שבועית
                      </h3>
                      
                      <div className="mb-4 p-3 bg-green-100 rounded-md">
                        <h4 className="font-medium text-green-800 mb-2">אסטרטגיה שבועית:</h4>
                        <p className="text-sm text-green-700">{msg.weeklyPlan.weeklyStrategy}</p>
                      </div>

                      <div className="grid gap-3 mb-4">
                        {msg.weeklyPlan.dailyPlans.map((day, idx) => (
                          <div key={idx} className="p-3 bg-white border border-green-200 rounded-md">
                            <h5 className="font-medium text-slate-900 mb-2 capitalize">{day.day}</h5>
                            <p className="text-sm text-slate-700 mb-2"><strong>מיקוד:</strong> {day.focus}</p>
                            
                            {day.priorityTasks.length > 0 && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-slate-600">משימות עיקריות:</span>
                                <ul className="text-sm text-slate-700 mt-1">
                                  {day.priorityTasks.map((task, taskIdx) => (
                                    <li key={taskIdx} className="flex items-center gap-1">
                                      <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                                      {task}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {day.timeBlocks && day.timeBlocks.length > 0 && (
                              <div>
                                <span className="text-sm font-medium text-slate-600">לוח זמנים:</span>
                                <div className="mt-1 space-y-1">
                                  {day.timeBlocks.map((block, blockIdx) => (
                                    <div key={blockIdx} className="text-sm">
                                      <span className="font-medium text-slate-700">{block.time}:</span>
                                      <span className="text-slate-600 ml-1">{block.activity}</span>
                                      {block.reasoning && (
                                        <span className="text-slate-500 text-xs block ml-4">
                                          {block.reasoning}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="p-3 bg-green-100 rounded-md">
                        <h4 className="font-medium text-green-800 mb-2">המלצות מפתח:</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          {msg.weeklyPlan.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-500 mt-1">✓</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Render Subtasks if this message has subtask breakdown */}
                  {msg.subtasks && (
                    <div className="mb-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                      <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
                        🔨 פירוק משימה למשימות משנה
                      </h3>
                      
                      <div className="mb-3 p-3 bg-amber-100 rounded-md">
                        <p className="text-sm text-amber-800">{msg.subtasks.reasoning}</p>
                      </div>

                      <div className="space-y-2">
                        {msg.subtasks.subtasks.map((subtask, idx) => {
                          console.log('Rendering subtask #' + idx + ':', subtask);
                          console.log('subtask keys:', Object.keys(subtask));
                          console.log('subtask.text:', subtask.text);
                          
                          // Try to find ANY string property in the subtask
                          const subtaskText = subtask.text ||
                                             (subtask as any).title ||
                                             (subtask as any).description ||
                                             (subtask as any).task ||
                                             (subtask as any).name ||
                                             JSON.stringify(subtask);
                          
                          return (
                            <div key={idx} className="p-3 bg-white border border-amber-200 rounded-md flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-slate-900">{subtaskText}</h5>
                              {subtask.estimatedDuration && (
                                <span className="text-xs text-slate-500">זמן משוער: {subtask.estimatedDuration} דקות</span>
                              )}
                            </div>
                            {subtask.priority && (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                subtask.priority === 'P1' ? 'bg-red-100 text-red-800' :
                                subtask.priority === 'P2' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {subtask.priority}
                              </span>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Render the text content - filter out JSON code blocks and followup buttons */}
                  {(() => {
                    let displayContent = msg.content;
                    
                    // Always remove followup_buttons from displayed content
                    displayContent = displayContent.replace(/"followup_buttons"\s*:\s*\[[^\]]*\]/g, '').trim();
                    displayContent = displayContent.replace(/followup_buttons\s*:\s*\[[^\]]*\]/g, '').trim();
                    
                    // Remove ALL JSON code blocks (not just when event is shown)
                    displayContent = displayContent.replace(/```json\s*\n[\s\S]*?\n```/g, '').trim();
                    
                    // Remove tool call JSON objects (look for ones with "tool" and "parameters")
                    displayContent = displayContent.replace(/\{\s*"tool"[\s\S]*?"parameters"[\s\S]*?\}/g, '').trim();
                    
                    // Remove taskAnalysis JSON structures
                    displayContent = displayContent.replace(/\{\s*"taskAnalysis"[\s\S]*?"overallStrategy"[\s\S]*?\}/g, '').trim();
                    
                    // Remove subtasks JSON structures
                    displayContent = displayContent.replace(/\{\s*"parentTaskId"[\s\S]*?"subtasks"[\s\S]*?"reasoning"[\s\S]*?\}/g, '').trim();
                    
                    // Remove any JSON objects that contain arrays with task/urgency/importance fields
                    displayContent = displayContent.replace(/\{\s*"[^"]*":\s*\[[^\]]*"task"[^\]]*\][^}]*\}/g, '').trim();
                    
                    // Remove JSON arrays that contain subtask objects
                    displayContent = displayContent.replace(/\[\s*\{\s*"text"[\s\S]*?"estimatedDuration"[\s\S]*?\}\s*\]/g, '').trim();
                    
                    // Remove JSON arrays that contain task objects
                    displayContent = displayContent.replace(/\[\s*\{\s*"task"[\s\S]*?\}\s*\]/g, '').trim();
                    
                    // Remove any remaining brackets or braces that are alone on a line
                    displayContent = displayContent.replace(/^\s*[[\]{}]\s*$/gm, '').trim();
                    
                    // Remove JSON-like structures that start with { and have tool/parameters
                    displayContent = displayContent.replace(/\{[^}]*"tool"[^}]*\}/g, '').trim();
                    
                    // Remove large JSON blocks that span multiple lines (catch any missed JSON)
                    displayContent = displayContent.replace(/\{\s*\n[\s\S]*?("task"|"urgency"|"importance"|"timeframe")[\s\S]*?\n\s*\}/g, '').trim();
                    
                    // Clean up multiple blank lines
                    displayContent = displayContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
                    
                    // Clean up any trailing commas or orphaned JSON syntax
                    displayContent = displayContent.replace(/,\s*$/, '').trim();
                    displayContent = displayContent.replace(/^\s*,/, '').trim();
                    
                    // Remove any lines that look like followup_buttons
                    displayContent = displayContent.replace(/^.*followup_buttons.*$/gm, '').trim();
                    
                    // Clean up again after removals
                    displayContent = displayContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
                    
                    // If we have rich UI components (taskAnalysis, taskList, event, weeklyPlan, subtasks), hide text content
                    const hasRichUI = msg.taskAnalysis || msg.taskList || msg.event || msg.weeklyPlan || msg.subtasks;
                    
                    // Only show text content if we don't have rich UI components and there's actual content
                    return (!hasRichUI && displayContent) ? (
                      <p className="whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100">
                        {displayContent}
                      </p>
                    ) : null;
                  })()}

                  {/* Render followup buttons if this is the last message and has buttons */}
                  {idx === chatHistory.length - 1 && msg.followupButtons && msg.followupButtons.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.followupButtons.map((buttonText, buttonIdx) => (
                        <button
                          key={buttonIdx}
                          onClick={() => handleSendWithMessage(buttonText)}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-full border border-sky-200 transition-colors hover:border-sky-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {buttonText}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`h-full flex flex-col ${isMobile ? 'px-4 py-6' : 'rounded-lg bg-slate-50/80 dark:bg-slate-800/60 p-6'}`}>
            <div className="flex-none text-center mb-6">
              <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Wrench className="h-4 w-4" />
                <span>Calendar Control Enabled</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                👋 Welcome to Your AI Assistant
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                I can manage your calendar, schedule tasks, and help you stay organized
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  Quick Actions
                </h3>
                <div className="grid gap-2">
                  <button
                    onClick={() => handleSendWithMessage("סקור את המשימות שלי, תעדף ותזמן אותן ביומן")}
                    className="text-left px-4 py-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/30 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📋</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                          סקור ותזמן משימות
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Review tasks, prioritize & schedule
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSendWithMessage("איזה אירועים יש לי היום?")}
                    className="text-left px-4 py-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/30 hover:border-purple-300 dark:hover:border-purple-600 transition-all hover:shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📅</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                          מה יש לי היום?
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          What's on my schedule today?
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSendWithMessage("תן לי סיכום של השבוע הקרוב")}
                    className="text-left px-4 py-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/30 hover:border-green-300 dark:hover:border-green-600 transition-all hover:shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📊</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-green-700 dark:group-hover:text-green-300">
                          סיכום השבוע
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Weekly summary & overview
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSendWithMessage("מתי הזמן הטוב הבא שיש לי פנוי?")}
                    className="text-left px-4 py-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-700/30 hover:border-amber-300 dark:hover:border-amber-600 transition-all hover:shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🕐</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                          מתי יש לי זמן פנוי?
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          When's my next free slot?
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSendWithMessage("תכנון שבוע הבא - צור לי תכנית מפורטת עם התמקדות יומית")}
                    className="text-left px-4 py-3 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200/50 dark:border-purple-700/30 hover:border-purple-300 dark:hover:border-purple-600 transition-all hover:shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📋</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                          תכנון שבוע הבא
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          AI-powered weekly planning with daily focus
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSendWithMessage("נתח את עדיפויות המשימות שלי לפי מטריצת אייזנהאואר וזמני יומן")}
                    className="text-left px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200/50 dark:border-indigo-700/30 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all hover:shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🎯</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                          ניתוח עדיפויות חכם
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Smart prioritization with Eisenhower Matrix
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSendWithMessage("הוסף משימה חדשה: הכן מצגת לפגישת צוות בשבוע הבא")}
                    className="text-left px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/50 dark:border-emerald-700/30 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all hover:shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">➕</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                          הוסף משימה חדשה
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Add task with smart categorization
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  I Can Help You
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Create and schedule events with smart suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Move, edit, or cancel existing meetings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Schedule your todo tasks intelligently</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Find optimal time slots and avoid conflicts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Create comprehensive weekly plans with daily focuses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Analyze task priorities using time management principles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Break down complex tasks into SMART subtasks</span>
                  </li>
                </ul>
              </div>
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
