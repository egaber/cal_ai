// Visual styles for different tag types

import { TagType } from '../types/mobileTask';

export interface TagStyle {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  emoji: string;
  label: string;
  labelHe: string;
}

export const TAG_STYLES: Record<TagType, TagStyle> = {
  timeBucket: {
    backgroundColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    emoji: '📅',
    label: 'Time',
    labelHe: 'זמן',
  },
  time: {
    backgroundColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    emoji: '🕐',
    label: 'Time',
    labelHe: 'שעה',
  },
  date: {
    backgroundColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    emoji: '📆',
    label: 'Date',
    labelHe: 'תאריך',
  },
  owner: {
    backgroundColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
    emoji: '👤',
    label: 'Owner',
    labelHe: 'אחראי',
  },
  involved: {
    backgroundColor: 'bg-pink-100',
    textColor: 'text-pink-800',
    borderColor: 'border-pink-200',
    emoji: '👥',
    label: 'Involved',
    labelHe: 'מעורב',
  },
  location: {
    backgroundColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-200',
    emoji: '📍',
    label: 'Location',
    labelHe: 'מיקום',
  },
  transport: {
    backgroundColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-200',
    emoji: '🚗',
    label: 'Driving',
    labelHe: 'נהיגה',
  },
  priority: {
    backgroundColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    emoji: '🔥',
    label: 'Priority',
    labelHe: 'עדיפות',
  },
  recurring: {
    backgroundColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-200',
    emoji: '🔄',
    label: 'Recurring',
    labelHe: 'חוזר',
  },
  reminder: {
    backgroundColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    emoji: '⏰',
    label: 'Reminder',
    labelHe: 'תזכורת',
  },
};

/**
 * Get inline style for highlighting text segments
 */
export function getInlineStyle(type: TagType): string {
  const style = TAG_STYLES[type];
  return `${style.backgroundColor} ${style.textColor} rounded px-1 font-medium`;
}

/**
 * Get tag bubble style for extracted tags
 */
export function getTagBubbleStyle(type: TagType): string {
  const style = TAG_STYLES[type];
  return `${style.backgroundColor} ${style.textColor} ${style.borderColor} border rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1`;
}

/**
 * Get emoji for tag type
 */
export function getTagEmoji(type: TagType): string {
  return TAG_STYLES[type].emoji;
}

/**
 * Get label for tag type (supports language)
 */
export function getTagLabel(type: TagType, language: 'he' | 'en' = 'en'): string {
  return language === 'he' ? TAG_STYLES[type].labelHe : TAG_STYLES[type].label;
}

/**
 * Priority to visual indicator
 */
export function getPriorityIndicator(priority: 'P1' | 'P2' | 'P3'): {
  color: string;
  label: string;
  emoji: string;
} {
  switch (priority) {
    case 'P1':
      return { color: 'text-red-600', label: 'Urgent', emoji: '🔴' };
    case 'P2':
      return { color: 'text-orange-600', label: 'Important', emoji: '🟠' };
    case 'P3':
      return { color: 'text-yellow-600', label: 'Normal', emoji: '🟡' };
  }
}

/**
 * Time bucket to visual styling
 */
export function getTimeBucketStyle(bucket: string): {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  emoji: string;
} {
  switch (bucket) {
    case 'today':
      return {
        backgroundColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
        emoji: '🔴',
      };
    case 'tomorrow':
      return {
        backgroundColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200',
        emoji: '🟠',
      };
    case 'this-week':
      return {
        backgroundColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        emoji: '🔵',
      };
    case 'next-week':
      return {
        backgroundColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        emoji: '🟣',
      };
    default: // unlabeled
      return {
        backgroundColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-200',
        emoji: '⚪',
      };
  }
}

/**
 * Get bucket label
 */
export function getTimeBucketLabel(bucket: string, language: 'he' | 'en' = 'en'): string {
  const labels: Record<string, { en: string; he: string }> = {
    'today': { en: 'Today', he: 'היום' },
    'tomorrow': { en: 'Tomorrow', he: 'מחר' },
    'this-week': { en: 'This Week', he: 'השבוע' },
    'next-week': { en: 'Next Week', he: 'שבוע הבא' },
    'unlabeled': { en: 'Later', he: 'אחר כך' },
  };
  
  return labels[bucket]?.[language] || labels['unlabeled'][language];
}
