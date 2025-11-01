import { CalendarEvent } from '@/types/calendar';
import { FamilyMember } from '@/types/calendar';
import {
  DailyFramework,
  RoutineInsights,
  MemberDailySchedule,
  ScheduleBlock,
  Conflict,
  Suggestion,
  PickupDropoffSchedule,
  PreparationRoutine,
  RecurringEventProposal,
  CoordinationPoint
} from '@/types/routineInsights';
import { llmService } from './llmService';

class DeepRoutineAnalysisService {
  /**
   * Main entry point: Analyze calendar deeply to understand daily routines
   */
  async analyzeDeepRoutines(
    userId: string,
    familyId: string,
    events: CalendarEvent[],
    familyMembers: FamilyMember[]
  ): Promise<{ success: boolean; insights?: RoutineInsights; error?: string }> {
    try {
      console.log(`[DeepRoutine] Starting deep analysis for ${events.length} events`);

      // Step 1: Identify frameworks (work, school, kindergarten)
      const frameworks = await this.identifyDailyFrameworks(events, familyMembers);
      console.log(`[DeepRoutine] Identified ${frameworks.length} frameworks`);

      // Step 2: Build member schedules
      const memberSchedules = await this.buildMemberDailySchedules(
        frameworks,
        events,
        familyMembers
      );
      console.log(`[DeepRoutine] Built ${memberSchedules.length} member schedules`);

      // Step 3: Detect conflicts
      const conflicts = this.detectScheduleConflicts(memberSchedules);
      console.log(`[DeepRoutine] Found ${conflicts.length} conflicts`);

      // Step 4: Generate suggestions
      const suggestions = await this.generateSmartSuggestions(
        memberSchedules,
        conflicts,
        frameworks
      );
      console.log(`[DeepRoutine] Generated ${suggestions.length} suggestions`);

      // Step 5: Identify coordination points
      const coordinationPoints = this.identifyCoordinationPoints(memberSchedules);

      // Build final insights object
      const insights: RoutineInsights = {
        userId,
        familyId,
        analyzedAt: new Date().toISOString(),
        frameworks,
        pickupSchedules: [], // TODO: Implement
        preparations: [], // TODO: Implement
        memberSchedules,
        familyPatterns: {
          busyDays: this.identifyBusyDays(memberSchedules),
          rushHours: this.identifyRushHours(memberSchedules),
          coordinationPoints,
        },
        confidence: this.calculateOverallConfidence(frameworks, memberSchedules),
        eventsAnalyzed: events.length,
        timeRangeDays: this.calculateTimeRange(events),
        topSuggestions: suggestions.slice(0, 5),
        criticalConflicts: conflicts.filter(c => c.severity === 'critical' || c.severity === 'high'),
      };

      // Save insights
      await this.saveInsights(insights);

      return { success: true, insights };
    } catch (error) {
      console.error('[DeepRoutine] Analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Step 1: Identify daily frameworks from events
   */
  private async identifyDailyFrameworks(
    events: CalendarEvent[],
    familyMembers: FamilyMember[]
  ): Promise<DailyFramework[]> {
    // Prepare data for LLM
    const eventSummary = events.map(e => ({
      title: e.title,
      start: e.startTime,
      end: e.endTime,
      category: e.category,
      memberId: e.memberId,
      recurrence: e.recurrence,
    }));

    const prompt = `You are an expert at analyzing family calendars to identify daily frameworks (work, school, kindergarten).

FAMILY MEMBERS:
${familyMembers.map(m => `- ${m.name} (${m.role}, age ${m.age || 'unknown'})`).join('\n')}

EVENTS (last 60 days):
${JSON.stringify(eventSummary.slice(0, 100), null, 2)}

YOUR TASK:
Identify recurring daily frameworks for each family member. A framework is a regular commitment like:
- Work (for parents)
- School (for school-age children)
- Kindergarten/Daycare (for young children)
- University (for students)

For each framework, extract:
1. Which family member
2. Type (work/school/kindergarten/daycare/university)
3. Name of the place (if mentioned)
4. Address/location (if available)
5. Typical arrival time
6. Typical departure time  
7. Days of week (0=Sunday, 6=Saturday)
8. Transportation method (walk/car/public_transport/bicycle) - infer from context
9. Travel time (estimate if needed)
10. Requirements (needs lunch? needs snack?)

RESPOND WITH JSON ONLY:
{
  "frameworks": [
    {
      "memberId": "member-id",
      "memberName": "name",
      "type": "kindergarten",
      "name": "גן השקמה",
      "address": "רחוב הדס 10, תל אביב",
      "schedule": {
        "arrivalTime": "08:00",
        "departureTime": "16:00",
        "daysOfWeek": [0, 1, 2, 3, 4]
      },
      "transportation": {
        "method": "car",
        "travelTimeMinutes": 15
      },
      "requirements": {
        "needsLunch": true,
        "needsSnack": true
      },
      "confidence": 90,
      "reasoning": "appears 5 times/week consistently"
    }
  ]
}`;

    try {
      const response = await llmService.chat({ 
        model: 'gemini-1.5-flash',
        messages: [{ role: 'user', content: prompt }] 
      });
      const parsed = JSON.parse(response.content);

      // Add IDs and learned_from
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return parsed.frameworks.map((f: Record<string, any>, index: number) => ({
        id: `framework_${Date.now()}_${index}`,
        ...f,
        learnedFrom: [], // TODO: Track which events contributed
      }));
    } catch (error) {
      console.error('[DeepRoutine] Framework identification failed:', error);
      return [];
    }
  }

  /**
   * Step 2: Build daily schedules for each member
   */
  private async buildMemberDailySchedules(
    frameworks: DailyFramework[],
    events: CalendarEvent[],
    familyMembers: FamilyMember[]
  ): Promise<MemberDailySchedule[]> {
    const schedules: MemberDailySchedule[] = [];

    // Build schedule for each member for each day of week
    for (const member of familyMembers) {
      for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
        const dayName = this.getDayName(dayOfWeek);
        const timeline = this.buildDailyTimeline(member, dayOfWeek, frameworks, events);

        schedules.push({
          memberId: member.id,
          memberName: member.name,
          dayOfWeek,
          dayName,
          timeline,
          conflicts: [], // Will be filled later
          suggestions: [], // Will be filled later
          metrics: this.calculateScheduleMetrics(timeline),
        });
      }
    }

    return schedules;
  }

  /**
   * Build timeline for a specific member on a specific day
   */
  private buildDailyTimeline(
    member: FamilyMember,
    dayOfWeek: number,
    frameworks: DailyFramework[],
    events: CalendarEvent[]
  ): ScheduleBlock[] {
    const blocks: ScheduleBlock[] = [];

    // Add framework blocks (work/school/kindergarten)
    const memberFrameworks = frameworks.filter(
      f => f.memberId === member.id && f.schedule.daysOfWeek.includes(dayOfWeek)
    );

    for (const framework of memberFrameworks) {
      // Add travel to framework
      if (framework.transportation.travelTimeMinutes) {
        const travelStart = this.subtractMinutes(
          framework.schedule.arrivalTime,
          framework.transportation.travelTimeMinutes
        );

        blocks.push({
          id: `travel_to_${framework.id}`,
          startTime: travelStart,
          endTime: framework.schedule.arrivalTime,
          type: 'travel',
          title: `נסיעה ל-${framework.name}`,
          location: 'בדרך',
          flexibility: 'fixed',
          metadata: {
            linkedFrameworkId: framework.id,
            source: 'inferred',
          },
        });
      }

      // Add framework block
      blocks.push({
        id: `framework_${framework.id}`,
        startTime: framework.schedule.arrivalTime,
        endTime: framework.schedule.departureTime,
        type: 'framework',
        title: framework.name,
        location: framework.address,
        flexibility: 'fixed',
        category: framework.type,
        metadata: {
          recurring: true,
          source: 'inferred',
          linkedFrameworkId: framework.id,
        },
      });

      // Add travel back
      if (framework.transportation.travelTimeMinutes) {
        const travelEnd = this.addMinutes(
          framework.schedule.departureTime,
          framework.transportation.travelTimeMinutes
        );

        blocks.push({
          id: `travel_from_${framework.id}`,
          startTime: framework.schedule.departureTime,
          endTime: travelEnd,
          type: 'travel',
          title: `נסיעה מ-${framework.name}`,
          location: 'בדרך',
          flexibility: 'fixed',
          metadata: {
            linkedFrameworkId: framework.id,
            source: 'inferred',
          },
        });
      }
    }

    // Add events from calendar that match this day of week
    // TODO: Filter events by day of week and member

    // Sort by start time
    blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Add free time blocks between activities
    return this.addFreeTimeBlocks(blocks);
  }

  /**
   * Step 3: Detect conflicts in schedules
   */
  private detectScheduleConflicts(schedules: MemberDailySchedule[]): Conflict[] {
    const conflicts: Conflict[] = [];

    // Check for overlaps within same member
    for (const schedule of schedules) {
      const blocks = schedule.timeline.filter(b => b.type !== 'free_time');

      for (let i = 0; i < blocks.length - 1; i++) {
        const current = blocks[i];
        const next = blocks[i + 1];

        if (current.endTime > next.startTime) {
          conflicts.push({
            id: `conflict_${Date.now()}_${i}`,
            type: 'overlap',
            description: `${current.title} מתנגש עם ${next.title}`,
            involvedMembers: [schedule.memberId],
            involvedBlocks: [current.id, next.id],
            severity: 'high',
            timeWindow: {
              start: current.startTime,
              end: next.endTime,
            },
            suggestions: [],
            impact: `${schedule.memberName} לא יכול להיות בשני מקומות בו זמנית`,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Step 4: Generate smart suggestions
   */
  private async generateSmartSuggestions(
    schedules: MemberDailySchedule[],
    conflicts: Conflict[],
    frameworks: DailyFramework[]
  ): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    // Suggest recurring events for frameworks
    for (const framework of frameworks) {
      suggestions.push({
        id: `suggest_recurring_${framework.id}`,
        type: 'recurring_event',
        title: `צור אירוע חוזר: ${framework.name}`,
        description: `מומלץ להוסיף אירוע חוזר עבור ${framework.memberName} ל-${framework.name}`,
        confidence: framework.confidence,
        priority: 'high',
        applicableTo: [framework.memberId],
        timeWindow: {
          start: framework.schedule.arrivalTime,
          end: framework.schedule.departureTime,
          daysOfWeek: framework.schedule.daysOfWeek,
        },
        proposedAction: {
          type: 'recurring_template',
          details: {
            title: framework.name,
            startTime: framework.schedule.arrivalTime,
            endTime: framework.schedule.departureTime,
            location: framework.address,
            recurrence: {
              frequency: 'weekly',
              daysOfWeek: framework.schedule.daysOfWeek,
              endDate: '2025-06-30', // End of school year
            },
          },
        },
        benefits: [
          'תזכורות אוטומטיות',
          'תכנון מראש',
          'מניעת התנגשויות',
        ],
        considerations: [
          'לבדוק אם התאריכים נכונים',
          'לוודא שהשעות מדויקות',
        ],
      });
    }

    return suggestions;
  }

  /**
   * Helper: Identify coordination points
   */
  private identifyCoordinationPoints(schedules: MemberDailySchedule[]): CoordinationPoint[] {
    // TODO: Find times when multiple members need coordination
    return [];
  }

  /**
   * Helper: Identify busy days
   */
  private identifyBusyDays(schedules: MemberDailySchedule[]): number[] {
    const dayBusyness = new Map<number, number>();

    for (const schedule of schedules) {
      const busyTime = schedule.metrics.totalBusyTime;
      const current = dayBusyness.get(schedule.dayOfWeek) || 0;
      dayBusyness.set(schedule.dayOfWeek, current + busyTime);
    }

    // Return days sorted by busyness
    return Array.from(dayBusyness.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([day]) => day)
      .slice(0, 3);
  }

  /**
   * Helper: Identify rush hours
   */
  private identifyRushHours(schedules: MemberDailySchedule[]): { start: string; end: string }[] {
    // Typically morning (7-9) and afternoon (16-18)
    return [
      { start: '07:00', end: '09:00' },
      { start: '16:00', end: '18:00' },
    ];
  }

  /**
   * Helper: Calculate metrics for a schedule
   */
  private calculateScheduleMetrics(timeline: ScheduleBlock[]): {
    totalBusyTime: number;
    totalFreeTime: number;
    travelTime: number;
    stressLevel: 'low' | 'medium' | 'high';
  } {
    let totalBusyTime = 0;
    let totalFreeTime = 0;
    let travelTime = 0;

    for (const block of timeline) {
      const duration = this.calculateDuration(block.startTime, block.endTime);

      if (block.type === 'free_time') {
        totalFreeTime += duration;
      } else if (block.type === 'travel') {
        travelTime += duration;
        totalBusyTime += duration;
      } else {
        totalBusyTime += duration;
      }
    }

    // Calculate stress level
    const stressLevel =
      totalBusyTime > 600 ? 'high' : totalBusyTime > 400 ? 'medium' : 'low';

    return {
      totalBusyTime,
      totalFreeTime,
      travelTime,
      stressLevel,
    };
  }

  /**
   * Helper: Add free time blocks between activities
   */
  private addFreeTimeBlocks(blocks: ScheduleBlock[]): ScheduleBlock[] {
    const result: ScheduleBlock[] = [];

    for (let i = 0; i < blocks.length; i++) {
      result.push(blocks[i]);

      if (i < blocks.length - 1) {
        const current = blocks[i];
        const next = blocks[i + 1];

        if (current.endTime < next.startTime) {
          result.push({
            id: `free_time_${i}`,
            startTime: current.endTime,
            endTime: next.startTime,
            type: 'free_time',
            title: 'זמן פנוי',
            flexibility: 'flexible',
          });
        }
      }
    }

    return result;
  }

  /**
   * Helper: Calculate overall confidence
   */
  private calculateOverallConfidence(
    frameworks: DailyFramework[],
    schedules: MemberDailySchedule[]
  ): number {
    if (frameworks.length === 0) return 50;

    const avgFrameworkConfidence =
      frameworks.reduce((sum, f) => sum + f.confidence, 0) / frameworks.length;

    return Math.round(avgFrameworkConfidence);
  }

  /**
   * Helper: Calculate time range of events
   */
  private calculateTimeRange(events: CalendarEvent[]): number {
    if (events.length === 0) return 0;

    const dates = events.map(e => new Date(e.startTime).getTime());
    const min = Math.min(...dates);
    const max = Math.max(...dates);

    return Math.ceil((max - min) / (1000 * 60 * 60 * 24));
  }

  /**
   * Helper: Get day name in Hebrew
   */
  private getDayName(dayOfWeek: number): string {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return `יום ${days[dayOfWeek]}`;
  }

  /**
   * Helper: Time manipulation
   */
  private subtractMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins - minutes;
    const newHours = Math.floor(totalMins / 60);
    const newMins = totalMins % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60);
    const newMins = totalMins % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  private calculateDuration(start: string, end: string): number {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  }

  /**
   * Save insights to localStorage
   */
  private async saveInsights(insights: RoutineInsights): Promise<void> {
    try {
      localStorage.setItem(
        `routine_insights_${insights.userId}`,
        JSON.stringify(insights)
      );
    } catch (error) {
      console.error('[DeepRoutine] Failed to save insights:', error);
    }
  }

  /**
   * Load insights from localStorage
   */
  async loadInsights(userId: string): Promise<RoutineInsights | null> {
    try {
      const stored = localStorage.getItem(`routine_insights_${userId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('[DeepRoutine] Failed to load insights:', error);
      return null;
    }
  }
}

export const deepRoutineAnalysisService = new DeepRoutineAnalysisService();
