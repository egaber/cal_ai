 // Task Service - AI-powered task analysis and management

import { llmService, Message } from './llmService';
import { Task, SubTask, TaskAnalysisRequest, TaskAnalysisResponse, WeeklyScheduleSuggestion } from '../types/task';
import { CalendarEvent, FamilyMember } from '../types/calendar';

class TaskService {
  private static STORAGE_KEY = 'calendar_ai_tasks';

  // Priority calculation based on urgency and importance
  private calculatePriority(urgency: string, importance: string): number {
    const urgencyScores = { low: 10, medium: 30, high: 50, critical: 70 };
    const importanceScores = { low: 10, medium: 30, high: 50, critical: 70 };
    
    const urgencyScore = urgencyScores[urgency as keyof typeof urgencyScores] || 10;
    const importanceScore = importanceScores[importance as keyof typeof importanceScores] || 10;
    
    // Weighted: 60% importance, 40% urgency
    return Math.round((importanceScore * 0.6) + (urgencyScore * 0.4));
  }

  async analyzeTask(
    request: TaskAnalysisRequest,
    familyMembers: FamilyMember[]
  ): Promise<TaskAnalysisResponse> {
    try {
      const systemPrompt = `אתה עוזר AI מומחה לניהול זמן ומשימות למשפחה ישראלית. תפקידך לנתח משימות ולספק המלצות מפורטות.

המשפחה כוללת:
${familyMembers.map(m => `- ${m.name} (${m.role})`).join('\n')}

עליך לנתח כל משימה ולספק:
1. אימוג'י מתאים המסמל את המשימה
2. קטגוריה מתאימה
3. דחיפות (urgency) - בהתבסס על מועדים
4. חשיבות (importance) - בהתבסס על ערך והשפעה
5. זמן משוער (במינוטים)
6. פירוק למשימות משנה (subtasks) - משימות קטנות יותר עם זמן משוער לכל אחת
7. חברי משפחה מתאימים
8. האם נדרשת נסיעה - אם כן, נסה לזהות:
   - מאיפה (drivingFrom) - מיקום מוצא
   - לאן (drivingTo) - מיקום יעד
   - זמן נסיעה משוער (drivingDuration) במינוטים
   אם אינך יכול להעריך - השאר null ושאל שאלות המשך
9. זמן מועדף ביום
10. טיפים לתזמון

שאלה קריטית לכל משימה: האם מה שקבעתי צריך להיכנס לשבוע הקרוב או שאפשר להעביר שבוע או לא לעשות בכלל או להעביר למישהו אחר?

החזר JSON בלבד בפורמט הבא:
{
  "emoji": "🎯",
  "category": "string",
  "urgency": "low|medium|high|critical",
  "importance": "low|medium|high|critical",
  "priority": number,
  "estimatedDuration": number,
  "suggestedSubtasks": [
    {"title": "string", "description": "string", "estimatedDuration": number}
  ],
  "suggestedMembers": ["member1", "member2"],
  "requiresDriving": boolean,
  "drivingDuration": number,
  "drivingFrom": "string or null",
  "drivingTo": "string or null",
  "preferredTimeOfDay": "morning|afternoon|evening|flexible",
  "reasoning": "string",
  "schedulingTips": ["tip1", "tip2"],
  "followUpQuestions": ["question1", "question2"]
}`;

      let userMessage = `נא לנתח את המשימה הבאה:

כותרת: ${request.title}`;

      if (request.description) {
        userMessage += `\nתיאור: ${request.description}`;
      }

      if (request.deadline) {
        const deadline = new Date(request.deadline);
        const now = new Date();
        const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        userMessage += `\nמועד אחרון: ${deadline.toLocaleDateString('he-IL')} (עוד ${daysUntil} ימים)`;
      }

      if (request.userContext && Object.keys(request.userContext).length > 0) {
        userMessage += '\n\nהקשר נוסף מהמשתמש:';
        Object.entries(request.userContext).forEach(([question, answer]) => {
          userMessage += `\n- ${question}: ${answer}`;
        });
      }

      const messages: Message[] = [
        { role: 'user', content: userMessage }
      ];

      const models = await llmService.getAvailableModels();
      if (models.length === 0) {
        throw new Error('אין מודלים זמינים');
      }

      // Prefer Claude Sonnet 4.5 if available, otherwise use first available model
      const preferredModel = models.find(m => 
        m.id.toLowerCase().includes('claude') && 
        m.id.toLowerCase().includes('sonnet') &&
        (m.id.includes('4.5') || m.id.includes('4-5'))
      ) || models.find(m => 
        m.id.toLowerCase().includes('claude') && 
        m.id.toLowerCase().includes('sonnet')
      ) || models[0];

      console.log('Using model for task analysis:', preferredModel.name);

      const response = await llmService.chat({
        messages,
        model: preferredModel,
        systemPrompt
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('תגובת AI לא בפורמט JSON תקין');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validate and calculate priority if not provided
      if (!analysis.priority) {
        analysis.priority = this.calculatePriority(analysis.urgency, analysis.importance);
      }

      return analysis as TaskAnalysisResponse;
    } catch (error) {
      console.error('Error analyzing task:', error);
      
      // Fallback to basic analysis
      return {
        emoji: '📋',
        category: 'personal',
        urgency: request.deadline ? 'medium' : 'low',
        importance: 'medium',
        priority: 40,
        estimatedDuration: 60,
        suggestedSubtasks: [
          {
            title: request.title,
            description: request.description,
            estimatedDuration: 60
          }
        ],
        suggestedMembers: [],
        requiresDriving: false,
        preferredTimeOfDay: 'flexible',
        reasoning: 'ניתוח אוטומטי בסיסי',
        schedulingTips: ['תזמן משימה זו בשעות הפנויות שלך'],
        followUpQuestions: []
      };
    }
  }

  async generateWeeklySchedule(
    tasks: Task[],
    existingEvents: CalendarEvent[],
    weekStartDate: Date
  ): Promise<WeeklyScheduleSuggestion> {
    try {
      const systemPrompt = `אתה מומחה לתכנון זמן שבועי למשפחות. תפקידך לנתח משימות ולהמליץ כיצד לתזמן אותן בשבוע הקרוב.

עקרונות חשובים:
1. תן עדיפות למשימות דחופות וחשובות
2. השאר זמן חיצץ בין פגישות (15-30 דקות)
3. קח בחשבון זמני נסיעה
4. אם יש יותר מדי משימות - המלץ מה לדחות
5. שאלה קריטית: האם צריך להיכנס לשבוע הקרוב או אפשר להעביר/לבטל/להאציל?

החזר JSON בלבד בפורמט:
{
  "tasksToSchedule": [
    {
      "taskId": "string",
      "suggestedSlots": [
        {
          "date": "ISO date",
          "startTime": "ISO datetime",
          "endTime": "ISO datetime",
          "confidence": 0-1,
          "reasoning": "string"
        }
      ]
    }
  ],
  "tasksToDefer": [
    {
      "taskId": "string",
      "reason": "string",
      "suggestedDeferralPeriod": "next-week|later|delegate|cancel"
    }
  ],
  "overallCapacityAnalysis": {
    "totalAvailableHours": number,
    "totalRequestedHours": number,
    "utilizationPercentage": number,
    "bufferTimeRecommendation": number,
    "warnings": ["warning1", "warning2"]
  }
}`;

      // Prepare task list
      const taskList = tasks
        .filter(t => t.status === 'pending')
        .sort((a, b) => b.priority - a.priority)
        .map(t => {
          const deadlineStr = t.deadline 
            ? new Date(t.deadline).toLocaleDateString('he-IL')
            : 'ללא מועד';
          return `- ${t.title} (${t.category}, עדיפות: ${t.priority}, ${t.estimatedDuration} דקות, מועד: ${deadlineStr})`;
        })
        .join('\n');

      // Prepare existing events for context
      const weekEnd = new Date(weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekEvents = existingEvents
        .filter(e => {
          const eventDate = new Date(e.startTime);
          return eventDate >= weekStartDate && eventDate < weekEnd;
        })
        .map(e => {
          const start = new Date(e.startTime);
          const end = new Date(e.endTime);
          return `- ${e.title} (${start.toLocaleDateString('he-IL')} ${start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })})`;
        })
        .join('\n');

      const userMessage = `תכנן את השבוע מ-${weekStartDate.toLocaleDateString('he-IL')}

משימות לתזמן:
${taskList || 'אין משימות'}

אירועים קיימים בשבוע:
${weekEvents || 'אין אירועים'}

נא לספק המלצות מפורטות לתזמון המשימות בשבוע הקרוב.`;

      const messages: Message[] = [
        { role: 'user', content: userMessage }
      ];

      const models = await llmService.getAvailableModels();
      if (models.length === 0) {
        throw new Error('אין מודלים זמינים');
      }

      // Prefer Claude Sonnet 4.5 if available, otherwise use first available model
      const preferredModel = models.find(m => 
        m.id.toLowerCase().includes('claude') && 
        m.id.toLowerCase().includes('sonnet') &&
        (m.id.includes('4.5') || m.id.includes('4-5'))
      ) || models.find(m => 
        m.id.toLowerCase().includes('claude') && 
        m.id.toLowerCase().includes('sonnet')
      ) || models[0];

      console.log('Using model for weekly schedule:', preferredModel.name);

      const response = await llmService.chat({
        messages,
        model: preferredModel,
        systemPrompt
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('תגובת AI לא בפורמט JSON תקין');
      }

      return JSON.parse(jsonMatch[0]) as WeeklyScheduleSuggestion;
    } catch (error) {
      console.error('Error generating weekly schedule:', error);
      
      // Fallback to simple suggestion
      return {
        tasksToSchedule: [],
        tasksToDefer: [],
        overallCapacityAnalysis: {
          totalAvailableHours: 40,
          totalRequestedHours: 0,
          utilizationPercentage: 0,
          bufferTimeRecommendation: 30,
          warnings: ['לא ניתן היה ליצור המלצות אוטומטיות']
        }
      };
    }
  }

  // Storage operations
  saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(TaskService.STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  loadTasks(): Task[] {
    try {
      const stored = localStorage.getItem(TaskService.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  createTask(
    title: string,
    description: string,
    analysis: TaskAnalysisResponse,
    userContext?: Record<string, string>
  ): Task {
    const now = new Date().toISOString();
    
    const subtasks: SubTask[] = analysis.suggestedSubtasks.map((st, index) => ({
      id: `subtask-${Date.now()}-${index}`,
      title: st.title,
      description: st.description,
      estimatedDuration: st.estimatedDuration,
      completed: false,
      order: index
    }));

    const totalDuration = subtasks.reduce((sum, st) => sum + st.estimatedDuration, 0);

    const task: Task = {
      id: `task-${Date.now()}`,
      title,
      description,
      emoji: analysis.emoji,
      category: analysis.category as Task['category'],
      urgency: analysis.urgency,
      importance: analysis.importance,
      priority: analysis.priority,
      estimatedDuration: totalDuration || analysis.estimatedDuration,
      preferredTimeOfDay: analysis.preferredTimeOfDay,
      assignedToMemberIds: analysis.suggestedMembers,
      requiresMultipleMembers: analysis.suggestedMembers.length > 1,
      requiresDriving: analysis.requiresDriving,
      drivingDuration: analysis.drivingDuration,
      subtasks,
      aiAnalysis: {
        suggestedCategory: analysis.category,
        suggestedPriority: analysis.priority,
        suggestedDuration: analysis.estimatedDuration,
        suggestedMembers: analysis.suggestedMembers,
        reasoning: analysis.reasoning,
        schedulingTips: analysis.schedulingTips
      },
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      userContext
    };

    return task;
  }

  updateTask(taskId: string, updates: Partial<Task>): void {
    const tasks = this.loadTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    
    if (index !== -1) {
      tasks[index] = {
        ...tasks[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveTasks(tasks);
    }
  }

  deleteTask(taskId: string): void {
    const tasks = this.loadTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    this.saveTasks(filtered);
  }

  toggleSubtask(taskId: string, subtaskId: string): void {
    const tasks = this.loadTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      const subtask = task.subtasks.find(st => st.id === subtaskId);
      if (subtask) {
        subtask.completed = !subtask.completed;
        task.updatedAt = new Date().toISOString();
        this.saveTasks(tasks);
      }
    }
  }
}

export const taskService = new TaskService();
