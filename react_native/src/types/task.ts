export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
  memberId: string;
  dueDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  tags?: string[];
  subtasks?: SubTask[];
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export type TaskCategory =
  | 'work'
  | 'personal'
  | 'family'
  | 'health'
  | 'education'
  | 'social'
  | 'shopping'
  | 'home'
  | 'finance'
  | 'other';

export interface TaskTemplate {
  id: string;
  name: string;
  category: TaskCategory;
  defaultDuration?: number;
  defaultPriority: 'low' | 'medium' | 'high';
  subtasks?: string[];
}
