import React, { useState } from 'react';
import { Brain, ArrowUp, ArrowDown, Clock, Target, Lightbulb, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from './TaskCard';
import { TodoTask } from '@/services/todoTaskService';

interface TaskWithReasoning extends TodoTask {
  aiReasoning?: string;
  aiSuggestedPriority?: 'today' | 'tomorrow' | 'this_week' | 'next_week';
  aiRecommendedTime?: string;
  needsBreakdown?: boolean;
  subtasks?: TodoTask[];
  expanded?: boolean;
}

interface TaskListProps {
  tasks: TodoTask[];
  title?: string;
  aiAnalysis?: string;
  showWorkflowActions?: boolean;
  onTaskSchedule?: (task: TodoTask) => void;
  onTaskBreakdown?: (task: TodoTask) => void;
  onTaskComplete?: (task: TodoTask) => void;
  onTaskEdit?: (task: TodoTask) => void;
  onReorderTasks?: (reorderedTasks: TodoTask[]) => void;
  onWeeklyPlan?: () => void;
  onTaskAnalysis?: (task: TodoTask) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  title = "משימות",
  aiAnalysis,
  showWorkflowActions = true,
  onTaskSchedule,
  onTaskBreakdown,
  onTaskComplete,
  onTaskEdit,
  onReorderTasks,
  onWeeklyPlan,
  onTaskAnalysis
}) => {
  const [tasksWithReasoning, setTasksWithReasoning] = useState<TaskWithReasoning[]>(
    tasks.map(task => ({ ...task, expanded: false }))
  );
  const [workflowPhase, setWorkflowPhase] = useState<'initial' | 'analyzing' | 'prioritizing' | 'planning'>('initial');

  const moveTask = (index: number, direction: 'up' | 'down') => {
    const newTasks = [...tasksWithReasoning];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newTasks.length) {
      [newTasks[index], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[index]];
      setTasksWithReasoning(newTasks);
      onReorderTasks?.(newTasks);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    setTasksWithReasoning(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, expanded: !task.expanded } : task
      )
    );
  };

  const updateTaskReasoning = (taskId: string, reasoning: string, suggestedPriority?: string) => {
    setTasksWithReasoning(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              aiReasoning: reasoning,
              aiSuggestedPriority: suggestedPriority as TaskWithReasoning['aiSuggestedPriority']
            } 
          : task
      )
    );
  };

  const addSubtask = (parentTaskId: string, subtask: TodoTask) => {
    setTasksWithReasoning(prev => 
      prev.map(task => 
        task.id === parentTaskId 
          ? { 
              ...task, 
              subtasks: [...(task.subtasks || []), subtask],
              expanded: true
            } 
          : task
      )
    );
  };

  const getPriorityBadgeColor = (priority?: string) => {
    switch (priority) {
      case 'today': return 'bg-red-100 text-red-800 border-red-200';
      case 'tomorrow': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'this_week': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'next_week': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case 'today': return 'היום';
      case 'tomorrow': return 'מחר';
      case 'this_week': return 'השבוע';
      case 'next_week': return 'שבוע הבא';
      default: return 'לא מוגדר';
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            {title}
          </h3>
          
          {showWorkflowActions && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onWeeklyPlan}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <Calendar className="h-4 w-4 mr-1" />
                תכנון שבוע הבא
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWorkflowPhase('analyzing')}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Brain className="h-4 w-4 mr-1" />
                ניתוח AI
              </Button>
            </div>
          )}
        </div>

        {/* Workflow Phase Indicator */}
        {workflowPhase !== 'initial' && (
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-700 font-medium">
              {workflowPhase === 'analyzing' && 'מנתח משימות...'}
              {workflowPhase === 'prioritizing' && 'קובע עדיפויות לפי עקרונות ניהול זמן...'}
              {workflowPhase === 'planning' && 'יוצר תכנית שבועית...'}
            </span>
          </div>
        )}

        {/* AI Analysis */}
        {aiAnalysis && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">תובנות AI</span>
            </div>
            <p className="text-sm text-blue-800 leading-relaxed">
              {aiAnalysis}
            </p>
          </div>
        )}

        {/* Task Stats */}
        <div className="flex gap-4 mt-3 text-sm text-slate-600">
          <span>סה"כ: {tasksWithReasoning.length}</span>
          <span>פעיל: {tasksWithReasoning.filter(t => !t.completed).length}</span>
          <span>הושלם: {tasksWithReasoning.filter(t => t.completed).length}</span>
          <span>מתוזמן: {tasksWithReasoning.filter(t => t.scheduledEventId).length}</span>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-4 space-y-3">
        {tasksWithReasoning.map((task, index) => (
          <div key={task.id} className="relative">
            {/* Reorder Controls */}
            {showWorkflowActions && onReorderTasks && (
              <div className="absolute -left-2 top-4 flex flex-col gap-1">
                <button
                  onClick={() => moveTask(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="h-3 w-3 text-gray-500" />
                </button>
                <button
                  onClick={() => moveTask(index, 'down')}
                  disabled={index === tasksWithReasoning.length - 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowDown className="h-3 w-3 text-gray-500" />
                </button>
              </div>
            )}

            {/* AI Priority Suggestion */}
            {task.aiSuggestedPriority && (
              <div className="mb-2 ml-6">
                <Badge className={`text-xs ${getPriorityBadgeColor(task.aiSuggestedPriority)}`}>
                  <Clock className="h-3 w-3 mr-1" />
                  AI: {getPriorityText(task.aiSuggestedPriority)}
                </Badge>
              </div>
            )}

            <div className="ml-6">
              <TaskCard
                task={task}
                aiReasoning={task.aiReasoning}
                expanded={task.expanded}
                onToggleExpand={() => toggleTaskExpansion(task.id)}
                onSchedule={onTaskSchedule}
                onBreakdown={onTaskBreakdown}
                onEdit={onTaskEdit}
                onComplete={onTaskComplete}
                subtasks={task.subtasks || []}
              />
            </div>

            {/* Task Analysis Button */}
            {showWorkflowActions && onTaskAnalysis && !task.aiReasoning && (
              <div className="ml-6 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTaskAnalysis(task)}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                  <Brain className="h-4 w-4 mr-1" />
                  נתח משימה זו
                </Button>
              </div>
            )}
          </div>
        ))}

        {tasksWithReasoning.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>אין משימות להצגה</p>
          </div>
        )}
      </div>

      {/* Workflow Actions */}
      {showWorkflowActions && tasksWithReasoning.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWorkflowPhase('prioritizing')}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              🎯 סדר לפי עדיפות
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWorkflowPhase('planning')}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              📋 צור תכנית שבועית
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                tasksWithReasoning
                  .filter(t => !t.completed && !t.scheduledEventId)
                  .forEach(task => onTaskSchedule?.(task));
              }}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              ⏰ תזמן הכל
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};