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
  executeToolCall(request: ToolCallRequest): { success: boolean; message: string; error?: string } {
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

    return {
      success: true,
      message: `Created meeting "${eventData.title}" from ${startDate.toLocaleString()} to ${endDate.toLocaleString()}`
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
}
