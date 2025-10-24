// Task Service - Enhanced AI task pipeline with Firestore cloud storage
//
// Key changes:
// - Cloud storage via Firestore (per-user collections)
// - Quick creation without waiting for AI (instant insertion)
// - Separate AI pipeline steps: categorize, prioritize, break down, estimate, enhance, SMART evaluate
// - Each step can run independently; can batch run full pipeline
// - Processing progress stored inside Task.processingSteps + processingPhase
// - Real-time sync with listeners
// - Backwards-compatible analyzeTask (legacy)
// - Weekly scheduling unchanged (will later leverage enhanced fields)

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { llmService, Message } from './llmService';
import {
  Task,
  SubTask,
  TaskAnalysisRequest,
  TaskAnalysisResponse,
  WeeklyScheduleSuggestion,
  TaskProcessingStep,
  TaskProcessingPhase,
  SmartEvaluation
} from '../types/task';
import { CalendarEvent, FamilyMember } from '../types/calendar';
import { StorageService } from './storageService';
import { MemoryData, TravelInfo, Place } from '../types/memory';
import { buildCategoryPromptList } from '../config/taskCategories';

// Pipeline definition (order)
const PIPELINE_PHASES: TaskProcessingPhase[] = [
  'context_loading',
  'categorizing',
  'prioritizing',
  'breaking_down',
  'estimating',
  'enhancing',
  'smart_evaluating'
];

class TaskService {
  private static STORAGE_KEY = 'calendar_ai_tasks';
  private static CACHE_KEY_PREFIX = 'calendar_ai_tasks_cache_';
  private userId: string | null = null;
  private familyId: string | null = null;
  private localCache: Task[] = [];
  private isSyncing: boolean = false;

  // Initialize with user context for Firestore
  initialize(userId: string, familyId: string): void {
    this.userId = userId;
    this.familyId = familyId;
    // Load from local cache immediately
    this.localCache = this.loadFromCache();
    // Migrate localStorage tasks to Firestore on first init
    this.migrateLocalStorageToFirestore().catch(err => 
      console.error('Migration error:', err)
    );
  }

  // Get Firestore collection path
  private getTasksCollection(): string {
    if (!this.userId || !this.familyId) {
      throw new Error('TaskService not initialized with user/family ID');
    }
    return `families/${this.familyId}/members/${this.userId}/tasks`;
  }

  // Get cache key for current user
  private getCacheKey(): string {
    if (!this.userId) return TaskService.STORAGE_KEY;
    return `${TaskService.CACHE_KEY_PREFIX}${this.userId}`;
  }

  // Load tasks from local cache
  private loadFromCache(): Task[] {
    try {
      const cacheKey = this.getCacheKey();
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
    return [];
  }

  // Save tasks to local cache
  private saveToCache(tasks: Task[]): void {
    try {
      const cacheKey = this.getCacheKey();
      localStorage.setItem(cacheKey, JSON.stringify(tasks));
      this.localCache = tasks;
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  // Get cached tasks immediately (no async)
  getCachedTasks(): Task[] {
    return this.localCache;
  }

  // Check if currently syncing
  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  // ---------- Firestore Operations ----------

  // Convert Task to Firestore format
  private toFirestore(task: Task): DocumentData {
    const cleanTask: any = {};
    Object.keys(task).forEach(key => {
      const value = (task as any)[key];
      if (value !== undefined) {
        cleanTask[key] = value;
      }
    });
    return {
      ...cleanTask,
      createdAt: task.createdAt || Timestamp.now().toDate().toISOString(),
      updatedAt: Timestamp.now().toDate().toISOString(),
    };
  }

  // Convert Firestore document to Task
  private fromFirestore(doc: DocumentData): Task {
    return {
      ...doc,
      id: doc.id,
    } as Task;
  }

  // Save task to Firestore
  async saveTaskToFirestore(task: Task): Promise<void> {
    if (!this.userId || !this.familyId) {
      // Save to local cache if not initialized
      const cached = this.loadFromCache();
      const index = cached.findIndex(t => t.id === task.id);
      if (index >= 0) {
        cached[index] = task;
      } else {
        cached.push(task);
      }
      this.saveToCache(cached);
      return;
    }
    try {
      this.isSyncing = true;
      // Update local cache immediately
      const cached = this.loadFromCache();
      const index = cached.findIndex(t => t.id === task.id);
      if (index >= 0) {
        cached[index] = task;
      } else {
        cached.push(task);
      }
      this.saveToCache(cached);

      // Then sync to Firestore
      const taskRef = doc(collection(db, this.getTasksCollection()), task.id);
      await setDoc(taskRef, this.toFirestore(task));
    } catch (error) {
      console.error('Error saving task to Firestore:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  // Update task in Firestore
  async updateTaskInFirestore(taskId: string, updates: Partial<Task>): Promise<void> {
    if (!this.userId || !this.familyId) {
      // Update local cache if not initialized
      const cached = this.loadFromCache();
      const index = cached.findIndex(t => t.id === taskId);
      if (index >= 0) {
        cached[index] = { ...cached[index], ...updates, updatedAt: new Date().toISOString() };
        this.saveToCache(cached);
      }
      return;
    }
    try {
      this.isSyncing = true;
      // Update local cache immediately
      const cached = this.loadFromCache();
      const index = cached.findIndex(t => t.id === taskId);
      if (index >= 0) {
        cached[index] = { ...cached[index], ...updates, updatedAt: new Date().toISOString() };
        this.saveToCache(cached);
      }

      // Then sync to Firestore
      const cleanUpdates: any = {};
      Object.keys(updates).forEach(key => {
        const value = (updates as any)[key];
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      });
      const taskRef = doc(db, this.getTasksCollection(), taskId);
      await updateDoc(taskRef, {
        ...cleanUpdates,
        updatedAt: Timestamp.now().toDate().toISOString(),
      });
    } catch (error) {
      console.error('Error updating task in Firestore:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  // Delete task from Firestore
  async deleteTaskFromFirestore(taskId: string): Promise<void> {
    if (!this.userId || !this.familyId) {
      // Delete from local cache if not initialized
      const cached = this.loadFromCache();
      this.saveToCache(cached.filter(t => t.id !== taskId));
      return;
    }
    try {
      this.isSyncing = true;
      // Update local cache immediately
      const cached = this.loadFromCache();
      this.saveToCache(cached.filter(t => t.id !== taskId));

      // Then sync to Firestore
      const taskRef = doc(db, this.getTasksCollection(), taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting task from Firestore:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  // Load tasks from Firestore
  async loadTasksFromFirestore(): Promise<Task[]> {
    if (!this.userId || !this.familyId) return [];
    try {
      const tasksRef = collection(db, this.getTasksCollection());
      const q = query(tasksRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push(this.fromFirestore({ id: doc.id, ...doc.data() }));
      });
      return tasks;
    } catch (error) {
      console.error('Error loading tasks from Firestore:', error);
      return [];
    }
  }

  // Subscribe to real-time task updates
  subscribeToTasks(callback: (tasks: Task[], syncing: boolean) => void): () => void {
    if (!this.userId || !this.familyId) {
      console.warn('Cannot subscribe: TaskService not initialized');
      // Return cached tasks immediately
      callback(this.loadFromCache(), false);
      return () => {};
    }
    
    // Return cached tasks immediately (non-blocking)
    const cachedTasks = this.loadFromCache();
    callback(cachedTasks, true);

    try {
      const tasksRef = collection(db, this.getTasksCollection());
      const q = query(tasksRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot: QuerySnapshot) => {
          this.isSyncing = true;
          const tasks: Task[] = [];
          querySnapshot.forEach((doc) => {
            tasks.push(this.fromFirestore({ id: doc.id, ...doc.data() }));
          });
          
          // Update cache with Firestore data
          this.saveToCache(tasks);
          
          // Notify with synced data
          this.isSyncing = false;
          callback(tasks, false);
        },
        (error) => {
          console.error('Error subscribing to tasks:', error);
          this.isSyncing = false;
          // On error, return cached data
          callback(this.loadFromCache(), false);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up task subscription:', error);
      this.isSyncing = false;
      // On error, return cached data
      callback(this.loadFromCache(), false);
      return () => {};
    }
  }

  // Migrate localStorage tasks to Firestore
  private async migrateLocalStorageToFirestore(): Promise<void> {
    if (!this.userId || !this.familyId) return;
    try {
      const localTasks = this.loadRaw();
      if (localTasks.length === 0) return;

      // Check if already migrated
      const firestoreTasks = await this.loadTasksFromFirestore();
      if (firestoreTasks.length > 0) {
        // Already have Firestore tasks, clear localStorage
        localStorage.removeItem(TaskService.STORAGE_KEY);
        return;
      }

      // Migrate each task
      console.log(`Migrating ${localTasks.length} tasks to Firestore...`);
      for (const task of localTasks) {
        await this.saveTaskToFirestore(task);
      }
      
      // Clear localStorage after successful migration
      localStorage.removeItem(TaskService.STORAGE_KEY);
      console.log('Migration complete!');
    } catch (error) {
      console.error('Error migrating tasks:', error);
    }
  }

  // ---------- Legacy localStorage Methods (for backward compatibility) ----------

  private loadRaw(): Task[] {
    try {
      const stored = localStorage.getItem(TaskService.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveTasks(tasks: Task[]): void {
    // Always save to cache immediately (non-blocking)
    this.saveToCache(tasks);
    
    // Save to Firestore if initialized (async, non-blocking)
    if (this.userId && this.familyId) {
      tasks.forEach(task => {
        this.saveTaskToFirestore(task).catch(err =>
          console.error(`Error saving task ${task.id}:`, err)
        );
      });
    }
  }

  loadTasks(): Task[] {
    // Return cached tasks immediately (synchronous)
    if (this.localCache.length > 0) {
      return this.localCache;
    }
    // Fallback to loading from cache
    return this.loadFromCache();
  }

  // ---------- Model Calculations ----------

  private calculatePriority(urgency: string, importance: string): number {
    const urgencyScores = { low: 10, medium: 30, high: 50, critical: 70 };
    const importanceScores = { low: 10, medium: 30, high: 50, critical: 70 };
    const u = urgencyScores[urgency as keyof typeof urgencyScores] ?? 10;
    const i = importanceScores[importance as keyof typeof importanceScores] ?? 10;
    return Math.round(i * 0.6 + u * 0.4);
  }

  private initialProcessingSteps(): TaskProcessingStep[] {
    return PIPELINE_PHASES.map(phase => ({
      id: `step-${phase}`,
      phase,
      label: this.getPhaseLabel(phase),
      status: 'pending'
    }));
  }

  private getPhaseLabel(phase: TaskProcessingPhase): string {
    switch (phase) {
      case 'context_loading': return 'טעינת הקשר';
      case 'categorizing': return 'קטגוריזציה';
      case 'prioritizing': return 'קביעת עדיפות';
      case 'breaking_down': return 'פירוק למשימות משנה';
      case 'estimating': return 'הערכת זמנים';
      case 'enhancing': return 'שיפור ואופטימיזציה';
      case 'smart_evaluating': return 'הערכת SMART / קס"ם';
      default: return phase;
    }
  }

  // ---------- Quick Creation (No AI Immediately) ----------

  quickCreateTask(title: string, description?: string): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: `task-${Date.now()}`,
      title,
      description,
      emoji: undefined,
      category: 'other',
      urgency: 'low',
      importance: 'low',
      priority: 10,
      estimatedDuration: 30,
      preferredTimeOfDay: 'flexible',
      assignedToMemberIds: [],
      requiresMultipleMembers: false,
      requiresDriving: false,
      subtasks: [],
      aiAnalysis: undefined,
      processingPhase: 'idle',
      processingSteps: this.initialProcessingSteps(),
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
    const tasks = this.loadTasks();
    tasks.push(task);
    this.saveTasks(tasks);
    return task;
  }

  // ---------- Legacy Combined Analysis (kept for backward compatibility) ----------

  async analyzeTask(
    request: TaskAnalysisRequest,
    familyMembers: FamilyMember[]
  ): Promise<TaskAnalysisResponse> {
    try {
      const categoriesList = buildCategoryPromptList();
      const systemPrompt = `אתה עוזר AI מומחה לניהול זמן ומשימות למשפחה ישראלית. תפקידך לנתח משימות ולספק המלצות מפורטות.

המשפחה:
${familyMembers.map(m => `- ${m.name} (${m.role})`).join('\n')}

קטגוריות זמינות (id אימוג'י - משמעות):
${categoriesList}

בחר קטגוריה אחת בלבד מתוך רשימת ה-id.

החזר JSON בלבד במבנה שניתן (ללא טקסט נוסף).`;

      let userMessage = `כותרת: ${request.title}`;
      if (request.description) userMessage += `\nתיאור: ${request.description}`;
      if (request.deadline) {
        const dl = new Date(request.deadline);
        const daysUntil = Math.ceil((dl.getTime() - Date.now()) / (86400000));
        userMessage += `\nמועד אחרון: ${dl.toLocaleDateString('he-IL')} (עוד ${daysUntil} ימים)`;
      }
      if (request.userContext && Object.keys(request.userContext).length > 0) {
        userMessage += '\nהקשר נוסף:';
        Object.entries(request.userContext).forEach(([q, a]) => {
          userMessage += `\n- ${q}: ${a}`;
        });
      }

      const response = await this.callLLM(systemPrompt, userMessage);
      const jsonMatch = response?.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON not found');
      const analysis = JSON.parse(jsonMatch[0]);

      if (!analysis.priority) {
        analysis.priority = this.calculatePriority(analysis.urgency, analysis.importance);
      }
      return analysis as TaskAnalysisResponse;
    } catch (error) {
      console.error('Error analyzing task:', error);
      return {
        emoji: '📋',
        category: 'personal',
        urgency: request.deadline ? 'medium' : 'low',
        importance: 'medium',
        priority: 40,
        estimatedDuration: 60,
        suggestedSubtasks: [
          { title: request.title, description: request.description, estimatedDuration: 60 }
        ],
        suggestedMembers: [],
        requiresDriving: false,
        reasoning: 'ניתוח בסיסיFallback',
        schedulingTips: ['תזמן בזמנים פנויים'],
        followUpQuestions: []
      };
    }
  }

  // Create task from legacy analysis (still used by old flow)
  createTask(
    title: string,
    description: string,
    analysis: TaskAnalysisResponse,
    userContext?: Record<string, string>
  ): Task {
    const now = new Date().toISOString();
    const subtasks: SubTask[] = analysis.suggestedSubtasks.map((st, i) => ({
      id: `subtask-${Date.now()}-${i}`,
      title: st.title,
      description: st.description,
      estimatedDuration: st.estimatedDuration,
      completed: false,
      order: i
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
      drivingFrom: analysis.drivingFrom,
      drivingTo: analysis.drivingTo,
      subtasks,
      aiAnalysis: {
        suggestedCategory: analysis.category,
        suggestedPriority: analysis.priority,
        suggestedDuration: analysis.estimatedDuration,
        suggestedMembers: analysis.suggestedMembers,
        reasoning: analysis.reasoning,
        schedulingTips: analysis.schedulingTips
      },
      processingPhase: 'complete', // legacy path completes immediately
      processingSteps: this.initialProcessingSteps().map(s =>
        ({ ...s, status: 'done', completedAt: now })
      ),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      userContext
    };

    const tasks = this.loadTasks();
    tasks.push(task);
    this.saveTasks(tasks);
    return task;
  }

  // ---------- Pipeline Execution ----------

  async runFullPipeline(
    taskId: string,
    familyMembers: FamilyMember[],
    existingEvents: CalendarEvent[] = []
  ): Promise<void> {
    for (const phase of PIPELINE_PHASES) {
      await this.runPhase(taskId, phase, familyMembers, existingEvents);
    }
    this.updateTask(taskId, { processingPhase: 'complete' });
  }

  async runPhase(
    taskId: string,
    phase: TaskProcessingPhase,
    familyMembers: FamilyMember[],
    existingEvents: CalendarEvent[] = []
  ): Promise<void> {
    const tasks = this.loadTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (phase === 'idle' || phase === 'complete' || phase === 'error') return;

    // Update step status to in-progress
    task.processingPhase = phase;
    const step = task.processingSteps.find(s => s.phase === phase);
    if (step && step.status === 'pending') {
      step.status = 'in-progress';
      step.startedAt = new Date().toISOString();
    }
    this.saveTasks(tasks);

    try {
      switch (phase) {
        case 'context_loading':
          await this.phaseContextLoad(task, familyMembers, existingEvents);
          break;
        case 'categorizing':
          await this.phaseCategorize(task, familyMembers);
          break;
        case 'prioritizing':
          await this.phasePrioritize(task);
          break;
        case 'breaking_down':
          await this.phaseBreakdown(task);
          break;
        case 'estimating':
          await this.phaseEstimate(task);
          break;
        case 'enhancing':
          await this.phaseEnhance(task);
          break;
        case 'smart_evaluating':
          await this.phaseSmartEvaluate(task);
          break;
      }

      // Mark done
      const stepDone = task.processingSteps.find(s => s.phase === phase);
      if (stepDone) {
        stepDone.status = 'done';
        stepDone.completedAt = new Date().toISOString();
      }
      task.updatedAt = new Date().toISOString();
      this.saveTasks(tasks);
    } catch (err: unknown) {
      console.error(`Phase ${phase} failed:`, err);
      const message = err instanceof Error ? err.message : 'שגיאה';
      const stepErr = task.processingSteps.find(s => s.phase === phase);
      if (stepErr) {
        stepErr.status = 'error';
        stepErr.reasoning = message;
      }
      task.lastProcessingError = message;
      task.processingPhase = 'error';
      task.updatedAt = new Date().toISOString();
      this.saveTasks(tasks);
    }
  }

  // ---------- Individual Phase Implementations ----------

  private async phaseContextLoad(
    task: Task,
    familyMembers: FamilyMember[],
    existingEvents: CalendarEvent[]
  ) {
    // Extended contextual load: existing tasks, family members, memory data summary, upcoming week events
    const allTasks = this.loadTasks();
    const pendingTasks = allTasks.filter(t => t.status === 'pending' && t.id !== task.id);
    const totalPendingDuration = pendingTasks.reduce((sum, t) => sum + (t.estimatedDuration || 0), 0);

    // Memory data (user/family/place/travel)
    const memoryData: MemoryData =
      (StorageService.loadMemoryData?.() as MemoryData) || {
        userMemories: [],
        familyMemories: [],
        places: [],
        travelInfo: []
      };

    // Basic derivations
    const memberNames = familyMembers.map(m => m.name).join(', ') || 'ללא';
    const placeCount = memoryData.places.length;
    const travelCount = memoryData.travelInfo.length;
    const userMemCount = memoryData.userMemories.length;
    const familyMemCount = memoryData.familyMemories.length;

    // Upcoming week events (now -> +7d)
    const now = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(now.getDate() + 7);
    const upcomingWeekEvents = existingEvents.filter(e => {
      const start = new Date(e.startTime);
      return start >= now && start < weekAhead;
    });
    const totalEventMinutes = upcomingWeekEvents.reduce((sum, ev) => {
      const s = new Date(ev.startTime).getTime();
      const e = new Date(ev.endTime).getTime();
      return sum + Math.max(0, Math.round((e - s) / 60000));
    }, 0);

    // Relevant travel durations if task requires driving or has location
    let relatedTravelInfo: string | undefined;
    if (task.location || task.requiresDriving) {
      // naive match by place name containment
      const matchedTravels = memoryData.travelInfo.filter((tInfo: TravelInfo) => {
        const fromPlace = memoryData.places.find((p: Place) => p.id === tInfo.fromPlaceId);
        const toPlace = memoryData.places.find((p: Place) => p.id === tInfo.toPlaceId);
        const loc = (task.location || '').toLowerCase();
        return (
          (fromPlace?.name?.toLowerCase().includes(loc) ||
            toPlace?.name?.toLowerCase().includes(loc)) &&
          typeof tInfo.durationMinutes === 'number'
        );
      });
      if (matchedTravels.length > 0) {
        relatedTravelInfo = matchedTravels
          .slice(0, 3)
          .map((tInfo: TravelInfo) => {
            const fromPlace = memoryData.places.find((p: Place) => p.id === tInfo.fromPlaceId);
            const toPlace = memoryData.places.find((p: Place) => p.id === tInfo.toPlaceId);
            return `${fromPlace?.name || 'מ'}→${toPlace?.name || 'אל'} ${tInfo.durationMinutes}ד (${tInfo.method})`;
          })
          .join('; ');
      }
    }

    const contextSummaryParts: string[] = [
      `משימות פתוחות נוספות: ${pendingTasks.length}`,
      `זמן מצטבר משימות: ${totalPendingDuration} דק`,
      `אירועים שבוע קרוב: ${upcomingWeekEvents.length}`,
      `זמן תפוס אירועים: ${totalEventMinutes} דק`,
      `משתתפים: ${memberNames}`,
      `זיכרונות משתמש: ${userMemCount}`,
      `זיכרונות משפחה: ${familyMemCount}`,
      `מקומות: ${placeCount}`,
      `נסיעות: ${travelCount}`
    ];
    if (relatedTravelInfo) {
      contextSummaryParts.push(`נסיעות רלוונטיות: ${relatedTravelInfo}`);
    }
    const contextSummary = contextSummaryParts.join(' | ');

    // Store summary in step
    const step = task.processingSteps.find(s => s.phase === 'context_loading');
    if (step) {
      step.outputSummary = contextSummary;
      step.reasoning =
        'טעינת הקשר: משימות פתוחות, עומס זמן, זיכרונות (משתמש/משפחה/מקומות/נסיעות) ונתוני נסיעה רלוונטיים.';
    }

    // Optionally enrich aiAnalysis
    if (!task.aiAnalysis) {
      task.aiAnalysis = {
        suggestedCategory: task.category,
        suggestedPriority: task.priority,
        suggestedDuration: task.estimatedDuration,
        suggestedMembers: task.assignedToMemberIds,
        reasoning: 'הקשר ראשוני נטען (משימות + זיכרונות).',
        schedulingTips: []
      };
    } else {
      task.aiAnalysis.reasoning += ' | הקשר מורחב (זיכרונות) נטען.';
    }
  }

  private async phaseCategorize(task: Task, familyMembers: FamilyMember[]) {
    const categoriesList = buildCategoryPromptList();
    const systemPrompt = `אתה AI למיון משימות. סווג משימה אחת לקטגוריה מתוך הרשימה הבאה (id אימוג'י - משמעות):
${categoriesList}

כללים:
- החזר רק id אחד שקיים ברשימה (לא מחרוזת חדשה)
- בחר אימוג'י מייצג (אפשר להשתמש בזה שמופיע ברשימה או להתאים קרוב)
- הצע חברי משפחה רלוונטיים אם נדרש

החזר JSON:
{
  "category": "string",
  "emoji": "string",
  "suggestedMembers": ["name1","name2"],
  "reasoning": "string"
}`;
    const userMessage = `משימה: "${task.title}"\nתיאור: ${task.description || '---'}\nמשתתפים אפשריים:\n${familyMembers.map(m => `- ${m.name} (${m.role})`).join('\n')}`;
    const response = await this.callLLM(systemPrompt, userMessage);
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON categorize');
    const data = JSON.parse(jsonMatch[0]);
    task.category = (data.category || 'other') as Task['category'];
    task.emoji = data.emoji || task.emoji;
    task.assignedToMemberIds = Array.isArray(data.suggestedMembers) ? data.suggestedMembers : [];
    task.requiresMultipleMembers = task.assignedToMemberIds.length > 1;
    // Update step summary
    const step = task.processingSteps.find(s => s.phase === 'categorizing');
    if (step) {
      step.outputSummary = `קטגוריה: ${task.category}, אימוג'י: ${task.emoji}`;
      step.reasoning = data.reasoning;
    }
  }

  private async phasePrioritize(task: Task) {
    const systemPrompt = `אתה AI להערכת חשיבות ודחיפות. החזר JSON:
{
  "urgency": "low|medium|high|critical",
  "importance": "low|medium|high|critical",
  "reasoning": "string"
}`;
    const userMessage = `משימה: "${task.title}"\nתיאור: ${task.description || '---'}\nמועד אחרון: ${task.deadline || 'ללא'}\nמשך משוער קיים: ${task.estimatedDuration} דקות`;
    const response = await this.callLLM(systemPrompt, userMessage);
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON prioritize');
    const data = JSON.parse(jsonMatch[0]);
    task.urgency = data.urgency || 'low';
    task.importance = data.importance || 'low';
    task.priority = this.calculatePriority(task.urgency, task.importance);
    const step = task.processingSteps.find(s => s.phase === 'prioritizing');
    if (step) {
      step.outputSummary = `עדיפות: ${task.priority} (חשיבות:${task.importance}, דחיפות:${task.urgency})`;
      step.reasoning = data.reasoning;
    }
  }

  private async phaseBreakdown(task: Task) {
    const systemPrompt = `פירוק משימה למשימות משנה. החזר JSON:
{
  "subtasks": [
    {"title":"string","estimatedDuration": number, "description":"string"}
  ],
  "reasoning":"string"
}`;
    const userMessage = `משימה: "${task.title}"\nתיאור: ${task.description || '---'}\nקטגוריה: ${task.category}`;
    const response = await this.callLLM(systemPrompt, userMessage);
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON breakdown');
    const data = JSON.parse(jsonMatch[0]);
    if (Array.isArray(data.subtasks)) {
      task.subtasks = data.subtasks.map(
        (st: { title?: string; estimatedDuration?: number; description?: string }, i: number): SubTask => ({
          id: `subtask-${Date.now()}-${i}`,
          title: st.title || `חלק ${i + 1}`,
          description: st.description,
          estimatedDuration: st.estimatedDuration ?? 15,
          completed: false,
          order: i
        })
      );
    }
    const step = task.processingSteps.find(s => s.phase === 'breaking_down');
    if (step) {
      step.outputSummary = `מספר משימות משנה: ${task.subtasks.length}`;
      step.reasoning = data.reasoning;
    }
  }

  private async phaseEstimate(task: Task) {
    // Aggregate subtask durations or refine
    const total = task.subtasks.reduce((sum, st) => sum + st.estimatedDuration, 0) || task.estimatedDuration || 30;
    // Optionally call AI to refine duration:
    const systemPrompt = `שפר הערכת זמן כוללת בדקות למשימה (בהינתן רשימת משימות משנה). החזר JSON:
{
  "totalDuration": number,
  "reasoning": "string"
}`;
    const userMessage = `משימה: "${task.title}"\nמשימות משנה:\n${task.subtasks.map(st => `- ${st.title} (${st.estimatedDuration}ד)`).join('\n') || 'אין'}\nסיכום נוכחי: ${total} דקות`;
    const response = await this.callLLM(systemPrompt, userMessage);
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      if (typeof data.totalDuration === 'number') {
        task.estimatedDuration = data.totalDuration;
        const step = task.processingSteps.find(s => s.phase === 'estimating');
        if (step) {
          step.outputSummary = `משך משוער: ${task.estimatedDuration} דקות`;
          step.reasoning = data.reasoning;
        }
        return;
      }
    }
    // Fallback
    task.estimatedDuration = total;
    const step = task.processingSteps.find(s => s.phase === 'estimating');
    if (step) {
      step.outputSummary = `משך משוער (חישוב): ${task.estimatedDuration} דקות`;
      step.reasoning = 'חישוב מצטבר (Fallback)';
    }
  }

  private async phaseEnhance(task: Task) {
    const systemPrompt = `שפר ניסוח ותן טיפים תמציתיים (עד 4) לתזמון / ביצוע. החזר JSON:
{
  "improvedDescription": "string",
  "tips": ["string","string"],
  "reasoning":"string"
}`;
    const userMessage = `משימה: "${task.title}"\nתיאור: ${task.description || '---'}\nקטגוריה: ${task.category}\nזמן: ${task.estimatedDuration} דקות`;
    const response = await this.callLLM(systemPrompt, userMessage);
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON enhance');
    const data = JSON.parse(jsonMatch[0]);
    if (data.improvedDescription) {
      task.description = data.improvedDescription;
    }
    if (!task.aiAnalysis) {
      task.aiAnalysis = {
        suggestedCategory: task.category,
        suggestedPriority: task.priority,
        suggestedDuration: task.estimatedDuration,
        suggestedMembers: task.assignedToMemberIds,
        reasoning: data.reasoning || 'שיפור משימה',
        schedulingTips: data.tips || []
      };
    } else {
      task.aiAnalysis.reasoning = data.reasoning || task.aiAnalysis.reasoning;
      task.aiAnalysis.schedulingTips = data.tips || task.aiAnalysis.schedulingTips;
    }
    const step = task.processingSteps.find(s => s.phase === 'enhancing');
    if (step) {
      step.outputSummary = `שופר תיאור + ${task.aiAnalysis.schedulingTips?.length || 0} טיפים`;
      step.reasoning = data.reasoning;
    }
  }

  private async phaseSmartEvaluate(task: Task) {
    const systemPrompt = `בצע הערכת SMART וגרסת קס"ם למשימה. החזר JSON:
{
  "specific":"string",
  "measurable":"string",
  "achievable":"string",
  "relevant":"string",
  "timeBound":"string",
  "kesemVariant":{
    "concrete":"string",
    "specific":"string",
    "measurable":"string",
    "timeOrAligned":"string"
  },
  "score": number,
  "reasoning":"string"
}`;
    const userMessage = `משימה: "${task.title}"\nתיאור: ${task.description || '---'}\nמשך: ${task.estimatedDuration} דקות\nקטגוריה: ${task.category}`;
    const response = await this.callLLM(systemPrompt, userMessage);
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON SMART');
    const data = JSON.parse(jsonMatch[0]);
    const smart: SmartEvaluation = {
      specific: data.specific,
      measurable: data.measurable,
      achievable: data.achievable,
      relevant: data.relevant,
      timeBound: data.timeBound,
      score: data.score,
      kesemVariant: data.kesemVariant
    };
    task.smart = smart;
    const step = task.processingSteps.find(s => s.phase === 'smart_evaluating');
    if (step) {
      step.outputSummary = `SMART ציון: ${smart.score ?? 'N/A'}`;
      step.reasoning = data.reasoning;
    }
  }

  // ---------- LLM Helper ----------

  private async callLLM(systemPrompt: string, userContent: string): Promise<string> {
    const messages: Message[] = [{ role: 'user', content: userContent }];
    const models = await llmService.getAvailableModels();
    if (models.length === 0) throw new Error('אין מודלים זמינים');

    // User-selected model (persisted by TaskPlanning UI)
    let preferredModel;
    try {
      const selectedId = localStorage.getItem('task_pipeline_model_id') || undefined;
      if (selectedId) {
        preferredModel = models.find(m => m.id === selectedId);
      }
    } catch {
      // ignore localStorage access errors (e.g. server-side)
    }

    if (!preferredModel) {
      preferredModel =
        models.find(m => m.id.toLowerCase().includes('claude') && m.id.toLowerCase().includes('sonnet') && (m.id.includes('4.5') || m.id.includes('4-5'))) ||
        models.find(m => m.id.toLowerCase().includes('claude') && m.id.toLowerCase().includes('sonnet')) ||
        models[0];
    }

    const response = await llmService.chat({
      messages,
      model: preferredModel,
      systemPrompt
    });
    if (response.error) throw new Error(response.error);
    return response.content;
  }

  // ---------- Weekly Scheduling (unchanged) ----------

  async generateWeeklySchedule(
    tasks: Task[],
    existingEvents: CalendarEvent[],
    weekStartDate: Date
  ): Promise<WeeklyScheduleSuggestion> {
    try {
      const systemPrompt = `אתה מומחה לתכנון שבועי למשפחה. החזר JSON מבנה מוגדר בלבד.`;
      const weekEnd = new Date(weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const taskList = tasks
        .filter(t => t.status === 'pending')
        .sort((a, b) => b.priority - a.priority)
        .map(t => {
          const dl = t.deadline ? new Date(t.deadline).toLocaleDateString('he-IL') : 'ללא מועד';
          return `- ${t.title} (${t.category}, עדיפות:${t.priority}, משך:${t.estimatedDuration}ד, מועד:${dl})`;
        })
        .join('\n');

      const weekEvents = existingEvents
        .filter(e => {
          const d = new Date(e.startTime);
          return d >= weekStartDate && d < weekEnd;
        })
        .map(e => {
          const s = new Date(e.startTime);
          const eTime = new Date(e.endTime);
          return `- ${e.title} (${s.toLocaleDateString('he-IL')} ${s.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}-${eTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })})`;
        })
        .join('\n');

      const userMessage = `תכנון שבוע מתחיל ב-${weekStartDate.toLocaleDateString('he-IL')}
משימות:
${taskList || 'אין'}
אירועים:
${weekEvents || 'אין'}
החזר JSON בלבד במבנה:
{
  "tasksToSchedule":[],
  "tasksToDefer":[],
  "overallCapacityAnalysis":{
    "totalAvailableHours":0,
    "totalRequestedHours":0,
    "utilizationPercentage":0,
    "bufferTimeRecommendation":0,
    "warnings":[]
  }
}`;

      const response = await this.callLLM(systemPrompt, userMessage);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Scheduling JSON missing');
      return JSON.parse(jsonMatch[0]) as WeeklyScheduleSuggestion;
    } catch (error) {
      console.error('Error generating weekly schedule:', error);
      return {
        tasksToSchedule: [],
        tasksToDefer: [],
        overallCapacityAnalysis: {
          totalAvailableHours: 40,
            totalRequestedHours: 0,
          utilizationPercentage: 0,
          bufferTimeRecommendation: 30,
          warnings: ['Fallback scheduling']
        }
      };
    }
  }

  // ---------- Mutations ----------

  updateTask(taskId: string, updates: Partial<Task>): void {
    const tasks = this.loadTasks();
    const i = tasks.findIndex(t => t.id === taskId);
    if (i !== -1) {
      tasks[i] = {
        ...tasks[i],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveTasks(tasks);
    }
  }

  deleteTask(taskId: string): void {
    const tasks = this.loadTasks();
    this.saveTasks(tasks.filter(t => t.id !== taskId));
  }

  toggleSubtask(taskId: string, subtaskId: string): void {
    const tasks = this.loadTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return;
    subtask.completed = !subtask.completed;
    task.updatedAt = new Date().toISOString();
    this.saveTasks(tasks);
  }
}

export const taskService = new TaskService();
