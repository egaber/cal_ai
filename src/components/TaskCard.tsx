import React from 'react';
import { Clock, User, MapPin, Calendar, Star, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TodoTask } from '@/services/todoTaskService';

interface TaskCardProps {
  task: TodoTask;
  aiReasoning?: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onSchedule?: (task: TodoTask) => void;
  onBreakdown?: (task: TodoTask) => void;
  onEdit?: (task: TodoTask) => void;
  onComplete?: (task: TodoTask) => void;
  showActions?: boolean;
  subtasks?: TodoTask[];
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  aiReasoning,
  expanded = false,
  onToggleExpand,
  onSchedule,
  onBreakdown,
  onEdit,
  onComplete,
  showActions = true,
  subtasks = []
}) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeBucketColor = (timeBucket?: string) => {
    switch (timeBucket) {
      case 'morning': return 'bg-orange-100 text-orange-800';
      case 'afternoon': return 'bg-blue-100 text-blue-800';
      case 'evening': return 'bg-purple-100 text-purple-800';
      case 'today': return 'bg-red-100 text-red-800';
      case 'tomorrow': return 'bg-yellow-100 text-yellow-800';
      case 'this_week': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {subtasks.length > 0 && onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            )}
            <h3 className="font-medium text-slate-900 leading-tight">
              {task.rawText}
            </h3>
            {task.completed && (
              <Badge variant="secondary" className="ml-2">
                ✓ הושלם
              </Badge>
            )}
          </div>

          {/* Tags and metadata */}
          <div className="flex flex-wrap gap-2 mb-2">
            {task.tags?.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag.emoji} {tag.displayText}
              </Badge>
            ))}
            
            {task.priority && (
              <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                <Star className="h-3 w-3 mr-1" />
                {task.priority}
              </Badge>
            )}

            {task.timeBucket && task.timeBucket !== 'unlabeled' && (
              <Badge className={`text-xs ${getTimeBucketColor(task.timeBucket)}`}>
                <Clock className="h-3 w-3 mr-1" />
                {task.timeBucket}
              </Badge>
            )}
          </div>

          {/* Additional details */}
          <div className="space-y-1 text-xs text-slate-600">
            {task.specificTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {task.specificTime.displayText ||
                   `${String(task.specificTime.hours || 0).padStart(2, '0')}:${String(task.specificTime.minutes || 0).padStart(2, '0')}`}
                </span>
              </div>
            )}

            {task.owner && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{task.owner}</span>
              </div>
            )}

            {task.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{task.location}</span>
              </div>
            )}

            {task.involvedMembers && task.involvedMembers.length > 0 && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>מעורבים: {task.involvedMembers.join(', ')}</span>
              </div>
            )}

            {task.scheduledEventId && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="text-green-600">מתוזמן ביומן</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Reasoning */}
      {aiReasoning && (
        <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-xs font-medium text-purple-700">AI Analysis</span>
          </div>
          <p className="text-sm text-purple-800 leading-relaxed">
            {aiReasoning}
          </p>
        </div>
      )}

      {/* Subtasks */}
      {expanded && subtasks.length > 0 && (
        <div className="mb-3 ml-4 space-y-2">
          <h4 className="text-sm font-medium text-slate-700">משימות משנה:</h4>
          {subtasks.map((subtask) => (
            <TaskCard
              key={subtask.id}
              task={subtask}
              showActions={false}
              subtasks={[]}
            />
          ))}
        </div>
      )}

      {/* Action buttons */}
      {showActions && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
          {!task.completed && onComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onComplete(task)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              ✓ סמן כהושלם
            </Button>
          )}

          {!task.scheduledEventId && onSchedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSchedule(task)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              📅 תזמן
            </Button>
          )}

          {onBreakdown && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBreakdown(task)}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              🔨 פרק למשימות משנה
            </Button>
          )}

          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(task)}
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            >
              ✏️ ערוך
            </Button>
          )}
        </div>
      )}
    </div>
  );
};