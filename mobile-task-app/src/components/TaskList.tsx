/**
 * TaskList Component
 * 
 * Displays a list of tasks organized by time buckets with filtering support.
 * Mobile-first design with Hebrew RTL support.
 */

import React from 'react';
import { MobileTask, TimeBucket } from '../types/mobileTask';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: MobileTask[];
  onTaskClick: (task: MobileTask) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}

const TIME_BUCKET_LABELS: Record<TimeBucket, string> = {
  today: 'היום',
  tomorrow: 'מחר',
  thisWeek: 'השבוע',
  nextWeek: 'שבוע הבא',
  unlabeled: 'לא מתוזמן',
};

const TIME_BUCKET_ORDER: TimeBucket[] = ['today', 'tomorrow', 'thisWeek', 'nextWeek', 'unlabeled'];

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskClick,
  onTaskComplete,
  onTaskDelete,
}) => {
  // Group tasks by time bucket
  const tasksByBucket = React.useMemo(() => {
    const grouped: Record<TimeBucket, MobileTask[]> = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      unlabeled: [],
    };

    tasks.forEach(task => {
      if (!task.completed) {
        grouped[task.timeBucket].push(task);
      }
    });

    // Sort tasks within each bucket by priority and time
    Object.keys(grouped).forEach((bucket) => {
      grouped[bucket as TimeBucket].sort((a, b) => {
        // Priority first (P1 > P2 > P3)
        if (a.priority && b.priority) {
          if (a.priority !== b.priority) {
            return a.priority.localeCompare(b.priority);
          }
        } else if (a.priority) {
          return -1;
        } else if (b.priority) {
          return 1;
        }

        // Then by specific time
        if (a.specificTime && b.specificTime) {
          const timeA = a.specificTime.hours * 60 + a.specificTime.minutes;
          const timeB = b.specificTime.hours * 60 + b.specificTime.minutes;
          return timeA - timeB;
        } else if (a.specificTime) {
          return -1;
        } else if (b.specificTime) {
          return 1;
        }

        // Finally by creation time
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    });

    return grouped;
  }, [tasks]);

  // Get completed tasks
  const completedTasks = React.useMemo(() => {
    return tasks.filter(task => task.completed);
  }, [tasks]);

  const totalTasks = tasks.filter(t => !t.completed).length;

  if (totalTasks === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4" dir="rtl">
        <div className="text-6xl mb-4">✨</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">אין משימות</h3>
        <p className="text-gray-500 text-center">
          לחץ על כפתור + למטה כדי להוסיף משימה חדשה
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" dir="rtl">
      {/* Task count header */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {totalTasks} משימות פעילות
          </h2>
          {completedTasks.length > 0 && (
            <span className="text-sm text-gray-500">
              {completedTasks.length} הושלמו
            </span>
          )}
        </div>
      </div>

      {/* Scrollable task list */}
      <div className="flex-1 overflow-y-auto">
        {TIME_BUCKET_ORDER.map(bucket => {
          const bucketTasks = tasksByBucket[bucket];
          
          if (bucketTasks.length === 0) {
            return null;
          }

          return (
            <div key={bucket} className="mb-4">
              {/* Bucket header */}
              <div className="sticky top-0 z-10 bg-gray-50 px-4 py-2 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase">
                    {TIME_BUCKET_LABELS[bucket]}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {bucketTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks in bucket */}
              <div className="divide-y divide-gray-100">
                {bucketTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                    onComplete={() => onTaskComplete(task.id)}
                    onDelete={() => onTaskDelete(task.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Completed tasks section (collapsible) */}
        {completedTasks.length > 0 && (
          <details className="mb-4">
            <summary className="sticky top-0 z-10 bg-gray-50 px-4 py-2 border-y border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600 uppercase">
                  הושלמו
                </h3>
                <span className="text-xs text-gray-500">
                  {completedTasks.length}
                </span>
              </div>
            </summary>
            <div className="divide-y divide-gray-100 opacity-60">
              {completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                  onComplete={() => onTaskComplete(task.id)}
                  onDelete={() => onTaskDelete(task.id)}
                />
              ))}
            </div>
          </details>
        )}

        {/* Bottom padding for floating button */}
        <div className="h-20" />
      </div>
    </div>
  );
};
