/**
 * TaskItem Component
 * 
 * Displays a single task with all its tags and metadata.
 * Supports swipe actions and click to edit.
 */

import React from 'react';
import { MobileTask, RecurringValue } from '../types/mobileTask';
import { TAG_STYLES } from '../utils/tagStyles';

interface TaskItemProps {
  task: MobileTask;
  onClick: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onClick,
  onComplete,
  onDelete,
}) => {
  const [showActions, setShowActions] = React.useState(false);

  // Format recurring value for display
  const formatRecurring = (value: RecurringValue): string => {
    if (Array.isArray(value)) {
      const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      return value.map(d => dayNames[d]).join(', ');
    }
    
    const patterns: Record<string, string> = {
      'daily': 'יומי',
      'weekly': 'שבועי',
      'monthly': 'חודשי',
      'weekday-0': 'ראשון',
      'weekday-1': 'שני',
      'weekday-2': 'שלישי',
      'weekday-3': 'רביעי',
      'weekday-4': 'חמישי',
      'weekday-5': 'שישי',
      'weekday-6': 'שבת',
      'morning': 'בוקר',
      'evening': 'ערב',
      'afternoon': 'צהריים',
      'night': 'לילה',
    };
    
    return patterns[value] || value;
  };

  return (
    <div
      className="relative bg-white hover:bg-gray-50 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3 px-4 py-3" onClick={onClick}>
        {/* Checkbox */}
        <button
          className="flex-shrink-0 mt-1"
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
        >
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              task.completed
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {task.completed && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          {/* Task text */}
          <p
            className={`text-base mb-2 ${
              task.completed ? 'line-through text-gray-400' : 'text-gray-800'
            }`}
          >
            {task.cleanText || task.text}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {/* Priority tag */}
            {task.priority && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  TAG_STYLES.priority.backgroundColor
                } ${TAG_STYLES.priority.textColor}`}
              >
                {task.priority}
              </span>
            )}

            {/* Time tag */}
            {task.specificTime && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  TAG_STYLES.time.backgroundColor
                } ${TAG_STYLES.time.textColor}`}
              >
                ⏰ {task.specificTime.displayText}
              </span>
            )}

            {/* Owner tag */}
            {task.owner && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  TAG_STYLES.owner.backgroundColor
                } ${TAG_STYLES.owner.textColor}`}
              >
                👤 {task.owner}
              </span>
            )}

            {/* Involved people tags */}
            {task.involvedPeople.map((person, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  TAG_STYLES.involved.backgroundColor
                } ${TAG_STYLES.involved.textColor}`}
              >
                👥 {person}
              </span>
            ))}

            {/* Location tag */}
            {task.location && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  TAG_STYLES.location.backgroundColor
                } ${TAG_STYLES.location.textColor}`}
              >
                📍 {task.location}
              </span>
            )}

            {/* Driving tag */}
            {task.needsDriving && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700`}
              >
                🚗 נסיעה
              </span>
            )}

            {/* Recurring tag */}
            {task.recurring && task.recurring !== 'none' && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  TAG_STYLES.recurring.backgroundColor
                } ${TAG_STYLES.recurring.textColor}`}
              >
                🔄 {formatRecurring(task.recurring)}
              </span>
            )}

            {/* Category tag (if AI enhanced) */}
            {task.category && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700"
              >
                ✨ {task.category}
              </span>
            )}
          </div>
        </div>

        {/* Quick actions (desktop hover) */}
        {showActions && !task.completed && (
          <div className="flex-shrink-0 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
              title="מחק"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* AI suggestions indicator */}
      {task.aiSuggestions && task.aiSuggestions.suggestedTags && task.aiSuggestions.suggestedTags.length > 0 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-purple-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
            <span>יש הצעות AI</span>
          </div>
        </div>
      )}
    </div>
  );
};
