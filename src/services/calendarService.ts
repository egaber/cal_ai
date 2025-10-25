// Calendar Service - provides tools for AI to control the calendar

import { CalendarEvent, FamilyMember, RecurrenceRule } from '@/types/calendar';

export interface CalendarTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      items?: {
        type: string;
        properties?: Record<string, unknown>;
        required?: string[];
      };
    }>;
    required: string[];
  };
}

export interface ToolCallRequest {
  tool: string;
  parameters: Record<string, unknown>;
}

export interface CalendarContext {
  currentDate: Date;
  todayEvents: CalendarEvent[];
  weekEvents: CalendarEvent[];
  familyMembers: FamilyMember[];
}

export interface CalendarOperations {
  createEvent: (eventData: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (eventId: string) => void;
  moveEvent: (eventId: string, newStartTime: string, newEndTime: string) => void;
}

// Define available calendar tools
export const CALENDAR_TOOLS: CalendarTool[] = [
  {
    name: 'create_meeting',
    description: 'Create a new meeting/event in the calendar. Use this when the user asks to schedule, add, or create a meeting or event.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title/name of the meeting or event'
        },
        startTime: {
          type: 'string',
          description: 'ISO 8601 datetime string for when the meeting starts (e.g., "2025-10-08T14:00:00.000Z")'
        },
        endTime: {
          type: 'string',
          description: 'ISO 8601 datetime string for when the meeting ends'
        },
        memberId: {
          type: 'string',
          description: 'The ID of the primary family member this event is for'
        },
        memberIds: {
          type: 'array',
          description: 'Optional: Array of family member IDs if multiple people are attending (e.g., ["1", "2", "3"] for a family event). If provided, memberId should be the first member in this array.'
        },
        category: {
          type: 'string',
          description: 'The category of the event',
          enum: ['health', 'work', 'personal', 'family']
        },
        priority: {
          type: 'string',
          description: 'The priority level of the event',
          enum: ['low', 'medium', 'high']
        },
        description: {
          type: 'string',
          description: 'Optional description or notes about the meeting'
        },
        emoji: {
          type: 'string',
          description: 'Emoticon icon representing the meeting type (e.g., "💼" for work meetings, "🏥" for health/medical, "👨‍👩‍👧‍👦" for family events, "🎯" for personal goals, "🍽️" for meals, "🏋️" for exercise, "📚" for learning)'
        },
        aiTip: {
          type: 'string',
          description: 'AI-generated scheduling tip or suggestion for this event. Should provide context-aware advice about preparation, timing, or potential conflicts based on the surrounding schedule.'
        }
      },
      required: ['title', 'startTime', 'endTime', 'memberId', 'category', 'priority', 'type']
    }
  },
  {
    name: 'create_recurring_meeting',
    description: 'Create a recurring meeting/event that repeats on a schedule. Use this when the user asks to schedule recurring, repeating, or regular meetings.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title/name of the meeting or event'
        },
        startTime: {
          type: 'string',
          description: 'ISO 8601 datetime string for when the first meeting starts'
        },
        endTime: {
          type: 'string',
          description: 'ISO 8601 datetime string for when the first meeting ends'
        },
        memberId: {
          type: 'string',
          description: 'The ID of the family member this event is for'
        },
        category: {
          type: 'string',
          description: 'The category of the event',
          enum: ['health', 'work', 'personal', 'family']
        },
        priority: {
          type: 'string',
          description: 'The priority level of the event',
          enum: ['low', 'medium', 'high']
        },
        description: {
          type: 'string',
          description: 'Optional description or notes about the meeting'
        },
        type: {
          type: 'string',
          description: 'Emoticon icon representing the meeting type'
        },
        frequency: {
          type: 'string',
          description: 'How often the meeting repeats',
          enum: ['daily', 'weekly', 'monthly', 'yearly']
        },
        interval: {
          type: 'number',
          description: 'Repeat every N periods (e.g., every 2 weeks). Default is 1.'
        },
        daysOfWeek: {
          type: 'array',
          description: 'For weekly recurrence: days of week (0=Sunday, 1=Monday, etc.). Example: [1,3,5] for Mon, Wed, Fri'
        },
        dayOfMonth: {
          type: 'number',
          description: 'For monthly recurrence: day of month (1-31)'
        },
        endDate: {
          type: 'string',
          description: 'ISO 8601 date string for when to stop recurring. Use either endDate OR count, not both.'
        },
        count: {
          type: 'number',
          description: 'Number of occurrences. Use either count OR endDate, not both.'
        }
      },
      required: ['title', 'startTime', 'endTime', 'memberId', 'category', 'priority', 'type', 'frequency', 'interval']
    }
  },
  {
    name: 'move_meeting',
    description: 'Move an existing meeting to a different time. Use this when the user asks to reschedule or move a meeting.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'The ID of the event to move'
        },
        newStartTime: {
          type: 'string',
          description: 'New ISO 8601 datetime string for when the meeting should start'
        },
        newEndTime: {
          type: 'string',
          description: 'New ISO 8601 datetime string for when the meeting should end'
        }
      },
      required: ['eventId', 'newStartTime', 'newEndTime']
    }
  },
  {
    name: 'edit_meeting',
    description: 'Edit meeting details like title, description, category, or priority. Use this when the user wants to update meeting information.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'The ID of the event to edit'
        },
        title: {
          type: 'string',
          description: 'New title for the meeting (optional)'
        },
        description: {
          type: 'string',
          description: 'New description for the meeting (optional)'
        },
        category: {
          type: 'string',
          description: 'New category for the meeting (optional)',
          enum: ['health', 'work', 'personal', 'family']
        },
        priority: {
          type: 'string',
          description: 'New priority for the meeting (optional)',
          enum: ['low', 'medium', 'high']
        }
      },
      required: ['eventId']
    }
  },
  {
    name: 'delete_meeting',
    description: 'Delete/remove a meeting from the calendar. Use this when the user asks to cancel or delete a meeting.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'The ID of the event to delete'
        }
      },
      required: ['eventId']
    }
  },
  {
    name: 'schedule_task',
    description: 'Schedule a todo task by creating a calendar event from it. Use this when the user asks to schedule a task or when analyzing tasks that need scheduling. Links the task to the created event.',
    parameters: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The ID of the todo task to schedule'
        },
        suggestedStartTime: {
          type: 'string',
          description: 'ISO 8601 datetime string for when the task should be scheduled to start'
        },
        duration: {
          type: 'number',
          description: 'Duration in minutes for completing the task'
        },
        memberId: {
          type: 'string',
          description: 'The ID of the family member this task is assigned to'
        },
        category: {
          type: 'string',
          description: 'The category of the task',
          enum: ['health', 'work', 'personal', 'family']
        },
        priority: {
          type: 'string',
          description: 'The priority level based on task urgency',
          enum: ['low', 'medium', 'high']
        },
        emoji: {
          type: 'string',
          description: 'Emoji representing the task type'
        },
        reasoning: {
          type: 'string',
          description: 'AI explanation for why this time slot was chosen, considering conflicts, buffer time, and user preferences'
        }
      },
      required: ['taskId', 'suggestedStartTime', 'duration', 'memberId', 'category', 'priority', 'emoji', 'reasoning']
    }
  },
  {
    name: 'add_task',
    description: 'Add a new todo task to the task list. Use this when the user asks to create, add, or remember a new task.',
    parameters: {
      type: 'object',
      properties: {
        taskText: {
          type: 'string',
          description: 'The full text description of the task'
        },
        priority: {
          type: 'string',
          description: 'Priority level of the task',
          enum: ['P1', 'P2', 'P3']
        },
        timeBucket: {
          type: 'string',
          description: 'When this task should be done',
          enum: ['today', 'tomorrow', 'thisWeek', 'nextWeek', 'unlabeled']
        },
        owner: {
          type: 'string',
          description: 'Who is responsible for this task'
        },
        location: {
          type: 'string',
          description: 'Where this task should be done (optional)'
        },
        category: {
          type: 'string',
          description: 'Category of the task for organization',
          enum: ['work', 'family', 'health', 'shopping', 'education', 'home', 'transport', 'personal', 'other']
        }
      },
      required: ['taskText']
    }
  },
  {
    name: 'add_subtask',
    description: 'Break down a task into subtasks. Use this when a task is complex and needs to be divided into smaller, manageable steps.',
    parameters: {
      type: 'object',
      properties: {
        parentTaskId: {
          type: 'string',
          description: 'The ID of the parent task to add subtasks to'
        },
        subtasks: {
          type: 'array',
          description: 'Array of subtask descriptions',
          items: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'Description of the subtask'
              },
              estimatedDuration: {
                type: 'number',
                description: 'Estimated time in minutes to complete this subtask'
              },
              priority: {
                type: 'string',
                enum: ['P1', 'P2', 'P3']
              }
            },
            required: ['text']
          }
        },
        reasoning: {
          type: 'string',
          description: 'Explanation of why this breakdown makes sense and how it follows SMART principles'
        }
      },
      required: ['parentTaskId', 'subtasks', 'reasoning']
    }
  },
  {
    name: 'analyze_task_priority',
    description: 'Analyze and suggest priority ordering for tasks based on time management principles, urgency, importance, and dependencies.',
    parameters: {
      type: 'object',
      properties: {
        taskAnalysis: {
          type: 'array',
          description: 'Analysis of each task with priority recommendations',
          items: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'The task ID being analyzed'
              },
              urgency: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'How urgent this task is'
              },
              importance: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: 'How important this task is'
              },
              suggestedTimeframe: {
                type: 'string',
                enum: ['today', 'tomorrow', 'this_week', 'next_week'],
                description: 'When this task should be completed'
              },
              reasoning: {
                type: 'string',
                description: 'Detailed reasoning for the priority assessment, considering schedule conflicts, dependencies, and time management principles'
              },
              dependencies: {
                type: 'array',
                description: 'Other tasks that depend on this one or that this task depends on',
                items: {
                  type: 'string'
                }
              }
            },
            required: ['taskId', 'urgency', 'importance', 'suggestedTimeframe', 'reasoning']
          }
        },
        overallStrategy: {
          type: 'string',
          description: 'Overall time management strategy and approach for handling all tasks'
        }
      },
      required: ['taskAnalysis', 'overallStrategy']
    }
  },
  {
    name: 'create_weekly_plan',
    description: 'Create a comprehensive weekly plan that considers all tasks, calendar events, and optimal time allocation.',
    parameters: {
      type: 'object',
      properties: {
        weeklyStrategy: {
          type: 'string',
          description: 'Overall strategy for the week'
        },
        dailyPlans: {
          type: 'array',
          description: 'Plan for each day of the week',
          items: {
            type: 'object',
            properties: {
              day: {
                type: 'string',
                enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
              },
              focus: {
                type: 'string',
                description: 'Main focus or theme for this day'
              },
              priorityTasks: {
                type: 'array',
                description: 'High priority tasks for this day',
                items: {
                  type: 'string'
                }
              },
              timeBlocks: {
                type: 'array',
                description: 'Suggested time blocks for different types of work',
                items: {
                  type: 'object',
                  properties: {
                    time: {
                      type: 'string',
                      description: 'Time range (e.g., 9:00-11:00)'
                    },
                    activity: {
                      type: 'string',
                      description: 'Type of activity or specific task'
                    },
                    reasoning: {
                      type: 'string',
                      description: 'Why this time is optimal for this activity'
                    }
                  },
                  required: ['time', 'activity']
                }
              }
            },
            required: ['day', 'focus', 'priorityTasks']
          }
        },
        recommendations: {
          type: 'array',
          description: 'Key recommendations for successful week execution',
          items: {
            type: 'string'
          }
        }
      },
      required: ['weeklyStrategy', 'dailyPlans', 'recommendations']
    }
  }
];

// Calendar Service Class
export class CalendarService {
  private operations: CalendarOperations;

  constructor(operations: CalendarOperations) {
    this.operations = operations;
  }

  // Generate context string for the AI
  generateContextString(context: CalendarContext): string {
    const { currentDate, todayEvents, weekEvents, familyMembers } = context;

    const dateStr = currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format today's events
    const todayStr = todayEvents.length > 0
      ? todayEvents.map(event => {
          const start = new Date(event.startTime);
          const end = new Date(event.endTime);
          const member = familyMembers.find(m => m.id === event.memberId);
          return `- [${event.id}] "${event.title}" (${member?.name || 'Unknown'}) from ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} to ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${event.category} - ${event.priority} priority${event.description ? ` - ${event.description}` : ''}`;
        }).join('\n')
      : '- No events scheduled';

    // Format week's events grouped by day
    const weekEventsByDay = new Map<string, CalendarEvent[]>();
    weekEvents.forEach(event => {
      const eventDate = new Date(event.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
      if (!weekEventsByDay.has(eventDate)) {
        weekEventsByDay.set(eventDate, []);
      }
      weekEventsByDay.get(eventDate)!.push(event);
    });

    const weekStr = Array.from(weekEventsByDay.entries())
      .map(([day, events]) => {
        const eventsList = events.map(event => {
          const start = new Date(event.startTime);
          const end = new Date(event.endTime);
          const member = familyMembers.find(m => m.id === event.memberId);
          return `  - [${event.id}] "${event.title}" (${member?.name || 'Unknown'}) from ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} to ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${event.category} - ${event.priority} priority`;
        }).join('\n');
        return `${day}:\n${eventsList}`;
      })
      .join('\n\n');

    // Format family members
    const membersStr = familyMembers.map(m => `- ${m.name} (${m.role}) [ID: ${m.id}]`).join('\n');

    return `Current Date: ${dateStr}

Family Members:
${membersStr}

Today's Schedule (${currentDate.toLocaleDateString()}):
${todayStr}

This Week's Schedule:
${weekStr || '- No events scheduled this week'}

Note: When creating or modifying events, use the event IDs shown in brackets [like this] to reference specific meetings.`;
  }

  // Execute a tool call
  executeToolCall(request: ToolCallRequest): { success: boolean; message: string; error?: string; data?: unknown } | Promise<{ success: boolean; message: string; error?: string; data?: unknown }> {
    try {
      switch (request.tool) {
        case 'create_meeting':
          return this.handleCreateMeeting(request.parameters);
        
        case 'create_recurring_meeting':
          return this.handleCreateRecurringMeeting(request.parameters);
        
        case 'move_meeting':
          return this.handleMoveMeeting(request.parameters);
        
        case 'edit_meeting':
          return this.handleEditMeeting(request.parameters);
        
        case 'delete_meeting':
          return this.handleDeleteMeeting(request.parameters);
        
        case 'schedule_task':
          return this.handleScheduleTask(request.parameters);
        
        case 'add_task':
          return this.handleAddTask(request.parameters);
        
        case 'add_subtask':
          return this.handleAddSubtask(request.parameters);
        
        case 'analyze_task_priority':
          return this.handleAnalyzeTaskPriority(request.parameters);
        
        case 'create_weekly_plan':
          return this.handleCreateWeeklyPlan(request.parameters);
        
        default:
          return {
            success: false,
            message: '',
            error: `Unknown tool: ${request.tool}`
          };
      }
    } catch (error) {
      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private handleCreateMeeting(params: Record<string, unknown>) {
    // Validate required parameters
    if (!params.title || !params.startTime || !params.endTime || !params.memberId) {
      return {
        success: false,
        message: '',
        error: 'Missing required parameters: title, startTime, endTime, memberId'
      };
    }

    const eventData: Omit<CalendarEvent, 'id'> = {
      title: params.title as string,
      startTime: params.startTime as string,
      endTime: params.endTime as string,
      memberId: params.memberId as string,
      memberIds: params.memberIds as string[] | undefined,
      category: (params.category as CalendarEvent['category']) || 'personal',
      priority: (params.priority as CalendarEvent['priority']) || 'medium',
      description: params.description as string | undefined,
      emoji: params.emoji as string | undefined,
      aiTip: params.aiTip as string | undefined
    };

    // Validate datetime strings
    const startDate = new Date(eventData.startTime);
    const endDate = new Date(eventData.endTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        success: false,
        message: '',
        error: 'Invalid datetime format. Use ISO 8601 format (e.g., "2025-10-08T14:00:00.000Z")'
      };
    }

    this.operations.createEvent(eventData);

    // Create a temporary event object with a generated ID for display
    const createdEvent: CalendarEvent = {
      ...eventData,
      id: `event_${Date.now()}` // Temporary ID for display
    };

    return {
      success: true,
      message: `Created meeting "${eventData.title}" from ${startDate.toLocaleString()} to ${endDate.toLocaleString()}`,
      data: createdEvent
    };
  }

  private handleMoveMeeting(params: Record<string, unknown>) {
    if (!params.eventId || !params.newStartTime || !params.newEndTime) {
      return {
        success: false,
        message: '',
        error: 'Missing required parameters: eventId, newStartTime, newEndTime'
      };
    }

    const eventId = params.eventId as string;
    const newStartTime = params.newStartTime as string;
    const newEndTime = params.newEndTime as string;

    // Validate datetime strings
    const startDate = new Date(newStartTime);
    const endDate = new Date(newEndTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        success: false,
        message: '',
        error: 'Invalid datetime format. Use ISO 8601 format'
      };
    }

    this.operations.moveEvent(eventId, newStartTime, newEndTime);

    return {
      success: true,
      message: `Moved meeting to ${startDate.toLocaleString()} - ${endDate.toLocaleString()}`
    };
  }

  private handleEditMeeting(params: Record<string, unknown>) {
    if (!params.eventId) {
      return {
        success: false,
        message: '',
        error: 'Missing required parameter: eventId'
      };
    }

    const eventId = params.eventId as string;
    const updates: Partial<CalendarEvent> = {};

    if (params.title) updates.title = params.title as string;
    if (params.description) updates.description = params.description as string;
    if (params.category) updates.category = params.category as CalendarEvent['category'];
    if (params.priority) updates.priority = params.priority as CalendarEvent['priority'];

    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        message: '',
        error: 'No updates provided'
      };
    }

    this.operations.updateEvent(eventId, updates);

    const updatesList = Object.keys(updates).join(', ');
    return {
      success: true,
      message: `Updated meeting: ${updatesList}`
    };
  }

  private handleCreateRecurringMeeting(params: Record<string, unknown>) {
    // Validate required parameters
    if (!params.title || !params.startTime || !params.endTime || !params.memberId || !params.frequency || !params.interval) {
      return {
        success: false,
        message: '',
        error: 'Missing required parameters: title, startTime, endTime, memberId, frequency, interval'
      };
    }

    // Build recurrence rule
    const recurrenceRule: RecurrenceRule = {
      frequency: params.frequency as RecurrenceRule['frequency'],
      interval: params.interval as number,
      daysOfWeek: params.daysOfWeek as number[] | undefined,
      dayOfMonth: params.dayOfMonth as number | undefined,
      endDate: params.endDate as string | undefined,
      count: params.count as number | undefined
    };

    // Validate recurrence rule
    if (recurrenceRule.endDate && recurrenceRule.count) {
      return {
        success: false,
        message: '',
        error: 'Cannot specify both endDate and count'
      };
    }

    const eventData: Omit<CalendarEvent, 'id'> = {
      title: params.title as string,
      startTime: params.startTime as string,
      endTime: params.endTime as string,
      memberId: params.memberId as string,
      category: (params.category as CalendarEvent['category']) || 'personal',
      priority: (params.priority as CalendarEvent['priority']) || 'medium',
      description: params.description as string | undefined,
      type: params.type as string | undefined,
      recurrence: recurrenceRule
    };

    // Validate datetime strings
    const startDate = new Date(eventData.startTime);
    const endDate = new Date(eventData.endTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        success: false,
        message: '',
        error: 'Invalid datetime format. Use ISO 8601 format'
      };
    }

    this.operations.createEvent(eventData);

    // Create description of recurrence
    const freqDesc = recurrenceRule.interval === 1 
      ? recurrenceRule.frequency 
      : `every ${recurrenceRule.interval} ${recurrenceRule.frequency}`;
    
    let endDesc = '';
    if (recurrenceRule.endDate) {
      endDesc = ` until ${new Date(recurrenceRule.endDate).toLocaleDateString()}`;
    } else if (recurrenceRule.count) {
      endDesc = ` for ${recurrenceRule.count} occurrences`;
    }

    return {
      success: true,
      message: `Created recurring meeting "${eventData.title}" (${freqDesc}${endDesc})`
    };
  }

  private handleDeleteMeeting(params: Record<string, unknown>) {
    if (!params.eventId) {
      return {
        success: false,
        message: '',
        error: 'Missing required parameter: eventId'
      };
    }

    const eventId = params.eventId as string;

    this.operations.deleteEvent(eventId);

    return {
      success: true,
      message: `Deleted meeting`
    };
  }

  private handleScheduleTask(params: Record<string, unknown>) {
    // Validate required parameters
    if (!params.taskId || !params.suggestedStartTime || !params.duration || !params.memberId) {
      return {
        success: false,
        message: '',
        error: 'Missing required parameters: taskId, suggestedStartTime, duration, memberId'
      };
    }

    const taskId = params.taskId as string;
    const suggestedStartTime = params.suggestedStartTime as string;
    const duration = params.duration as number;
    const memberId = params.memberId as string;
    const category = (params.category as CalendarEvent['category']) || 'personal';
    const priority = (params.priority as CalendarEvent['priority']) || 'medium';
    const emoji = params.emoji as string | undefined;
    const reasoning = params.reasoning as string;

    // Calculate end time based on duration
    const startDate = new Date(suggestedStartTime);
    if (isNaN(startDate.getTime())) {
      return {
        success: false,
        message: '',
        error: 'Invalid datetime format for suggestedStartTime'
      };
    }

    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    // Generate a consistent event ID based on task ID
    const eventId = `task-event-${taskId}`;

    // Create event data with sourceTask link
    // taskId should now contain the actual task name/text, not just a number
    const taskTitle = taskId.toString().replace(/^\d+\.\s*/, ''); // Remove leading "7. " pattern if present
    const eventData: Omit<CalendarEvent, 'id'> & { sourceTask?: string } = {
      title: taskTitle, // Use the actual task name as title
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      memberId: memberId,
      category: category,
      priority: priority,
      emoji: emoji,
      description: `Scheduled from task.\n\n${reasoning}`,
      aiTip: reasoning,
      sourceTask: taskId.toString()  // Link back to the task
    };

    this.operations.createEvent(eventData);

    // Create event object with the consistent ID
    const createdEvent: CalendarEvent = {
      ...eventData,
      id: eventId
    };

    return {
      success: true,
      message: `✅ Scheduled task from ${startDate.toLocaleTimeString()} to ${endDate.toLocaleTimeString()}. ${reasoning}`,
      data: { event: createdEvent, taskId, eventId }
    };
  }

  private async handleAddTask(params: Record<string, unknown>): Promise<{ success: boolean; message: string; error?: string; data?: unknown }> {
    console.log('🔧 handleAddTask called with params:', params);
    
    if (!params.taskText) {
      console.error('❌ Missing taskText parameter');
      return {
        success: false,
        message: '',
        error: 'Missing required parameter: taskText'
      };
    }

    const taskText = params.taskText as string;
    console.log('📝 Task text to add:', taskText);

    try {
      // Import the todoTaskService dynamically to avoid circular dependencies
      console.log('📦 Importing todoTaskService...');
      const { todoTaskService } = await import('@/services/todoTaskService');
      
      // Parse the task text using the mobile task parser
      console.log('🔍 Parsing task text...');
      // Use absolute path from project root
      const { parseTask } = await import('../../mobile-task-app/src/services/taskParser');
      const parsedTask = parseTask(taskText);
      console.log('✅ Parsed task:', parsedTask);
      
      // Create the todo with parsed data and any AI-provided metadata
      console.log('🏗️ Creating todo...');
      const newTodo = todoTaskService.createTodo(parsedTask, false);
      console.log('✅ Created todo:', newTodo);
      
      // Apply AI-provided overrides if present (with proper type handling)
      if (params.priority && typeof params.priority === 'string') {
        newTodo.priority = params.priority as any;
        console.log('🔧 Applied priority override:', params.priority);
      }
      if (params.timeBucket && typeof params.timeBucket === 'string') {
        newTodo.timeBucket = params.timeBucket as any;
        console.log('🔧 Applied timeBucket override:', params.timeBucket);
      }
      if (params.owner && typeof params.owner === 'string') {
        newTodo.owner = params.owner as any;
        console.log('🔧 Applied owner override:', params.owner);
      }
      if (params.location && typeof params.location === 'string') {
        newTodo.location = params.location;
        console.log('🔧 Applied location override:', params.location);
      }
      
      // Save to Firestore
      console.log('💾 Saving to Firestore...');
      await todoTaskService.saveTodoToFirestore(newTodo);
      console.log('✅ Successfully saved to Firestore!');
      
      return {
        success: true,
        message: `✅ Added new task: "${taskText}"`,
        data: newTodo
      };
    } catch (error) {
      console.error('❌ Error adding task:', error);
      return {
        success: false,
        message: '',
        error: `Failed to add task: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private handleAddSubtask(params: Record<string, unknown>) {
    if (!params.parentTaskId || !params.subtasks) {
      return {
        success: false,
        message: '',
        error: 'Missing required parameters: parentTaskId, subtasks'
      };
    }

    const parentTaskId = params.parentTaskId as string;
    const subtasks = params.subtasks as Array<{ text: string; estimatedDuration?: number; priority?: string }>;
    const reasoning = params.reasoning as string;

    return {
      success: true,
      message: `Created ${subtasks.length} subtasks for task ${parentTaskId}`,
      data: { parentTaskId, subtasks, reasoning }
    };
  }

  private handleAnalyzeTaskPriority(params: Record<string, unknown>) {
    if (!params.taskAnalysis || !params.overallStrategy) {
      return {
        success: false,
        message: '',
        error: 'Missing required parameters: taskAnalysis, overallStrategy'
      };
    }

    const taskAnalysis = params.taskAnalysis as Array<{
      taskId: string;
      urgency: string;
      importance: string;
      suggestedTimeframe: string;
      reasoning: string;
      dependencies?: string[];
    }>;
    
    const overallStrategy = params.overallStrategy as string;

    return {
      success: true,
      message: `Analyzed ${taskAnalysis.length} tasks and provided priority recommendations`,
      data: { taskAnalysis, overallStrategy }
    };
  }

  private handleCreateWeeklyPlan(params: Record<string, unknown>) {
    if (!params.weeklyStrategy || !params.dailyPlans || !params.recommendations) {
      return {
        success: false,
        message: '',
        error: 'Missing required parameters: weeklyStrategy, dailyPlans, recommendations'
      };
    }

    const weeklyStrategy = params.weeklyStrategy as string;
    const dailyPlans = params.dailyPlans as Array<{
      day: string;
      focus: string;
      priorityTasks: string[];
      timeBlocks?: Array<{
        time: string;
        activity: string;
        reasoning?: string;
      }>;
    }>;
    const recommendations = params.recommendations as string[];

    return {
      success: true,
      message: `Created comprehensive weekly plan with ${dailyPlans.length} daily plans`,
      data: { weeklyStrategy, dailyPlans, recommendations }
    };
  }
}
