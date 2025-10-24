// Todo Task Service - Manages simple mobile tasks with Firestore persistence
// These are the parsed tasks from MobileTasks component

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
import { ParsedTask } from '../../mobile-task-app/src/types/mobileTask';

export interface TodoTask extends ParsedTask {
  id: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  familyId?: string;
  // Scheduling fields
  scheduledEventId?: string;  // Link to calendar event
  scheduledAt?: string;       // When it was scheduled
  rescheduledCount?: number;  // Track how many times it was rescheduled
}

class TodoTaskService {
  private static CACHE_KEY_PREFIX = 'todo_tasks_cache_';
  private userId: string | null = null;
  private familyId: string | null = null;
  private localCache: TodoTask[] = [];
  private isSyncing: boolean = false;

  // Initialize with user context for Firestore
  initialize(userId: string, familyId: string): void {
    this.userId = userId;
    this.familyId = familyId;
    // Load from local cache immediately
    this.localCache = this.loadFromCache();
  }

  // Get Firestore collection path
  private getTodosCollection(): string {
    if (!this.userId || !this.familyId) {
      throw new Error('TodoTaskService not initialized with user/family ID');
    }
    // Store todos at: families/{familyId}/members/{userId}/todos
    return `families/${this.familyId}/members/${this.userId}/todos`;
  }

  // Get cache key for current user
  private getCacheKey(): string {
    if (!this.userId) return TodoTaskService.CACHE_KEY_PREFIX + 'default';
    return `${TodoTaskService.CACHE_KEY_PREFIX}${this.userId}`;
  }

  // Load tasks from local cache
  private loadFromCache(): TodoTask[] {
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
  private saveToCache(tasks: TodoTask[]): void {
    try {
      const cacheKey = this.getCacheKey();
      localStorage.setItem(cacheKey, JSON.stringify(tasks));
      this.localCache = tasks;
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  // Get cached tasks immediately (no async)
  getCachedTodos(): TodoTask[] {
    return this.localCache;
  }

  // Check if currently syncing
  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  // Convert TodoTask to Firestore format
  private toFirestore(task: TodoTask): DocumentData {
    const cleanTask: any = { ...task };
    
    // Ensure we have timestamps
    if (!cleanTask.createdAt) {
      cleanTask.createdAt = Timestamp.now().toDate().toISOString();
    }
    cleanTask.updatedAt = Timestamp.now().toDate().toISOString();
    
    // Remove undefined values (Firestore doesn't accept them)
    Object.keys(cleanTask).forEach(key => {
      if (cleanTask[key] === undefined) {
        delete cleanTask[key];
      }
    });
    
    return cleanTask;
  }

  // Convert Firestore document to TodoTask
  private fromFirestore(doc: DocumentData): TodoTask {
    return {
      ...doc,
      id: doc.id,
    } as TodoTask;
  }

  // Save task to Firestore
  async saveTodoToFirestore(task: TodoTask): Promise<void> {
    // Always save to cache first
    const cached = this.loadFromCache();
    const index = cached.findIndex(t => t.id === task.id);
    if (index >= 0) {
      cached[index] = task;
    } else {
      cached.push(task);
    }
    this.saveToCache(cached);

    if (!this.userId || !this.familyId) {
      console.warn('TodoTaskService not initialized - saved to cache only');
      return;
    }
    
    try {
      this.isSyncing = true;
      const taskRef = doc(collection(db, this.getTodosCollection()), task.id);
      await setDoc(taskRef, this.toFirestore(task));
    } catch (error) {
      console.error('Error saving todo to Firestore:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  // Update task in Firestore
  async updateTodoInFirestore(taskId: string, updates: Partial<TodoTask>): Promise<void> {
    // Update cache first
    const cached = this.loadFromCache();
    const index = cached.findIndex(t => t.id === taskId);
    if (index >= 0) {
      cached[index] = { ...cached[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveToCache(cached);
    }

    if (!this.userId || !this.familyId) {
      console.warn('TodoTaskService not initialized - updated cache only');
      return;
    }
    
    try {
      this.isSyncing = true;
      const taskRef = doc(db, this.getTodosCollection(), taskId);
      await updateDoc(taskRef, {
        ...updates,
        updatedAt: Timestamp.now().toDate().toISOString(),
      });
    } catch (error) {
      console.error('Error updating todo in Firestore:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  // Delete task from Firestore
  async deleteTodoFromFirestore(taskId: string): Promise<void> {
    // Delete from cache first
    const cached = this.loadFromCache();
    this.saveToCache(cached.filter(t => t.id !== taskId));

    if (!this.userId || !this.familyId) {
      console.warn('TodoTaskService not initialized - deleted from cache only');
      return;
    }
    
    try {
      this.isSyncing = true;
      const taskRef = doc(db, this.getTodosCollection(), taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting todo from Firestore:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  // Load todos from Firestore
  async loadTodosFromFirestore(): Promise<TodoTask[]> {
    if (!this.userId || !this.familyId) {
      console.warn('TodoTaskService not initialized - returning cached data');
      return this.loadFromCache();
    }
    
    try {
      const todosRef = collection(db, this.getTodosCollection());
      const q = query(todosRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const todos: TodoTask[] = [];
      
      querySnapshot.forEach((doc) => {
        todos.push(this.fromFirestore({ id: doc.id, ...doc.data() }));
      });
      
      // Update cache with fresh data
      this.saveToCache(todos);
      
      return todos;
    } catch (error) {
      console.error('Error loading todos from Firestore:', error);
      return this.loadFromCache();
    }
  }

  // Subscribe to real-time todo updates
  subscribeToTodos(callback: (todos: TodoTask[], syncing: boolean) => void): () => void {
    // Return cached tasks immediately
    const cachedTodos = this.loadFromCache();
    callback(cachedTodos, true);

    if (!this.userId || !this.familyId) {
      console.warn('Cannot subscribe: TodoTaskService not initialized - using cache only');
      callback(cachedTodos, false);
      return () => {};
    }
    
    try {
      const todosRef = collection(db, this.getTodosCollection());
      const q = query(todosRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot: QuerySnapshot) => {
          this.isSyncing = true;
          const todos: TodoTask[] = [];
          querySnapshot.forEach((doc) => {
            todos.push(this.fromFirestore({ id: doc.id, ...doc.data() }));
          });
          
          // Update cache with Firestore data
          this.saveToCache(todos);
          
          // Notify with synced data
          this.isSyncing = false;
          callback(todos, false);
        },
        (error) => {
          console.error('Error subscribing to todos:', error);
          this.isSyncing = false;
          // On error, return cached data
          callback(this.loadFromCache(), false);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up todo subscription:', error);
      this.isSyncing = false;
      callback(this.loadFromCache(), false);
      return () => {};
    }
  }

  // Helper: Create new todo from ParsedTask
  createTodo(parsedTask: ParsedTask, completed: boolean = false): TodoTask {
    const now = new Date().toISOString();
    return {
      ...parsedTask,
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      completed,
      createdAt: now,
      updatedAt: now,
      userId: this.userId || undefined,
      familyId: this.familyId || undefined,
    };
  }

  // Get all todos for AI assistant context
  async getTodosForAI(): Promise<string> {
    const todos = await this.loadTodosFromFirestore();
    
    if (todos.length === 0) {
      return 'אין משימות פתוחות כרגע.';
    }

    const todosList = todos
      .filter(t => !t.completed)
      .map((todo, index) => {
        const parts: string[] = [`${index + 1}. ${todo.rawText}`];
        
        // Add tags info
        if (todo.tags && todo.tags.length > 0) {
          const tagTexts = todo.tags.map(tag => `${tag.emoji} ${tag.displayText}`).join(', ');
          parts.push(`   תגים: ${tagTexts}`);
        }
        
        // Add time info
        if (todo.timeBucket && todo.timeBucket !== 'unlabeled') {
          parts.push(`   זמן: ${todo.timeBucket}`);
        }
        
        if (todo.specificTime) {
          const time = todo.specificTime as any;
          const hour = time.hour ?? time.hours ?? 0;
          const minute = time.minute ?? time.minutes ?? 0;
          parts.push(`   שעה: ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        }
        
        // Add people
        if (todo.owner) {
          parts.push(`   בעלים: ${todo.owner}`);
        }
        if (todo.involvedMembers && todo.involvedMembers.length > 0) {
          parts.push(`   מעורבים: ${todo.involvedMembers.join(', ')}`);
        }
        
        // Add location
        if (todo.location) {
          parts.push(`   מיקום: ${todo.location}`);
        }
        
        return parts.join('\n');
      })
      .join('\n\n');

    const completedCount = todos.filter(t => t.completed).length;
    const header = `יש ${todos.length - completedCount} משימות פתוחות (${completedCount} הושלמו):\n\n`;
    
    return header + todosList;
  }
}

export const todoTaskService = new TodoTaskService();
