import { Task } from '@/types/task';

// Centralized task category definitions (emoji + Tailwind color classes + display name + description for AI context)

export interface TaskCategoryDefinition {
  id: Task['category'];
  name: string;
  emoji: string;
  description: string; // Short semantic meaning used for AI prompts
  bg: string;
  fg: string;
  border: string;
}

export const TASK_CATEGORY_DEFINITIONS: TaskCategoryDefinition[] = [
  // Unified subtle palette: bg-[color]-50, text-[color]-700/800, border-[color]-200 for consistency & readability
  {
    id: 'work',
    name: 'עבודה',
    emoji: '💼',
    description: 'Business, professional tasks, meetings, focus work',
    bg: 'bg-blue-50',
    fg: 'text-blue-700',
    border: 'border-blue-200'
  },
  {
    id: 'personal',
    name: 'אישי',
    emoji: '👤',
    description: 'Personal errands, self improvement, solo tasks',
    bg: 'bg-pink-50',
    fg: 'text-pink-700',
    border: 'border-pink-200'
  },
  {
    id: 'family',
    name: 'משפחה',
    emoji: '👨‍👩‍👧‍👦',
    description: 'Family time, kids activities, shared household tasks',
    bg: 'bg-emerald-50',
    fg: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  {
    id: 'health',
    name: 'בריאות',
    emoji: '🏥',
    description: 'Medical, therapy, wellness, health tracking',
    bg: 'bg-rose-50',
    fg: 'text-rose-700',
    border: 'border-rose-200'
  },
  {
    id: 'education',
    name: 'למידה',
    emoji: '📚',
    description: 'Study, courses, reading, skill building',
    bg: 'bg-indigo-50',
    fg: 'text-indigo-700',
    border: 'border-indigo-200'
  },
  {
    id: 'social',
    name: 'חברתי',
    emoji: '🎉',
    description: 'Social gatherings, parties, meetups',
    bg: 'bg-purple-50',
    fg: 'text-purple-700',
    border: 'border-purple-200'
  },
  {
    id: 'finance',
    name: 'פיננסי',
    emoji: '💰',
    description: 'Bills, payments, budgeting, financial planning',
    bg: 'bg-amber-50',
    fg: 'text-amber-700',
    border: 'border-amber-200'
  },
  {
    id: 'home',
    name: 'בית',
    emoji: '🏠',
    description: 'Household chores, maintenance, improvements',
    bg: 'bg-teal-50',
    fg: 'text-teal-700',
    border: 'border-teal-200'
  },
  {
    id: 'travel',
    name: 'נסיעות',
    emoji: '🚗',
    description: 'Trips, flights, vacation planning, logistics',
    bg: 'bg-sky-50',
    fg: 'text-sky-700',
    border: 'border-sky-200'
  },
  {
    id: 'fitness',
    name: 'כושר',
    emoji: '💪',
    description: 'Exercise, gym, physical training',
    bg: 'bg-lime-50',
    fg: 'text-lime-700',
    border: 'border-lime-200'
  },
  {
    id: 'food',
    name: 'אוכל',
    emoji: '🍽️',
    description: 'Meals, cooking, nutrition planning',
    bg: 'bg-orange-50',
    fg: 'text-orange-700',
    border: 'border-orange-200'
  },
  {
    id: 'shopping',
    name: 'קניות',
    emoji: '🛍️',
    description: 'Purchases, errands, procurement',
    bg: 'bg-fuchsia-50',
    fg: 'text-fuchsia-700',
    border: 'border-fuchsia-200'
  },
  {
    id: 'entertainment',
    name: 'בילוי',
    emoji: '🎮',
    description: 'Leisure, games, movies, shows',
    bg: 'bg-violet-50',
    fg: 'text-violet-700',
    border: 'border-violet-200'
  },
  {
    id: 'sports',
    name: 'ספורט',
    emoji: '⚽',
    description: 'Playing or attending sports activities',
    bg: 'bg-green-50',
    fg: 'text-green-700',
    border: 'border-green-200'
  },
  {
    id: 'hobby',
    name: 'תחביב',
    emoji: '🎯',
    description: 'Hobbies, crafts, creative work',
    bg: 'bg-rose-50',
    fg: 'text-rose-700',
    border: 'border-rose-200'
  },
  {
    id: 'volunteer',
    name: 'התנדבות',
    emoji: '🤝',
    description: 'Community service, volunteering',
    bg: 'bg-cyan-50',
    fg: 'text-cyan-700',
    border: 'border-cyan-200'
  },
  {
    id: 'appointment',
    name: 'פגישה',
    emoji: '📅',
    description: 'General appointments, scheduled visits',
    bg: 'bg-slate-50',
    fg: 'text-slate-700',
    border: 'border-slate-200'
  },
  {
    id: 'maintenance',
    name: 'תחזוקה',
    emoji: '🛠️',
    description: 'Repairs, service tasks (car/home)',
    bg: 'bg-stone-50',
    fg: 'text-stone-700',
    border: 'border-stone-200'
  },
  {
    id: 'celebration',
    name: 'חגיגה',
    emoji: '🎂',
    description: 'Birthdays, anniversaries, special occasions',
    bg: 'bg-yellow-50',
    fg: 'text-yellow-700',
    border: 'border-yellow-200'
  },
  {
    id: 'meeting',
    name: 'ישיבה',
    emoji: '🗣️',
    description: 'Formal meetings, structured discussions',
    bg: 'bg-blue-100',
    fg: 'text-blue-800',
    border: 'border-blue-300'
  },
  {
    id: 'childcare',
    name: 'טיפול בילדים',
    emoji: '🧒',
    description: 'Child care, support, activities',
    bg: 'bg-emerald-100',
    fg: 'text-emerald-800',
    border: 'border-emerald-300'
  },
  {
    id: 'pet',
    name: 'חיות מחמד',
    emoji: '🐾',
    description: 'Pet care, vet visits, training',
    bg: 'bg-orange-50',
    fg: 'text-orange-700',
    border: 'border-orange-200'
  },
  {
    id: 'errand',
    name: 'סידור',
    emoji: '📝',
    description: 'Quick errands and small tasks',
    bg: 'bg-gray-50',
    fg: 'text-gray-700',
    border: 'border-gray-200'
  },
  {
    id: 'transport',
    name: 'תחבורה',
    emoji: '🚕',
    description: 'Commute, driving, transportation planning',
    bg: 'bg-cyan-50',
    fg: 'text-cyan-700',
    border: 'border-cyan-200'
  },
  {
    id: 'project',
    name: 'פרויקט',
    emoji: '📐',
    description: 'Multi-step project, structured output',
    bg: 'bg-purple-100',
    fg: 'text-purple-800',
    border: 'border-purple-300'
  },
  {
    id: 'deadline',
    name: 'דדליין',
    emoji: '⏰',
    description: 'Time sensitive deliverable or due item',
    bg: 'bg-red-50',
    fg: 'text-red-700',
    border: 'border-red-200'
  },
  {
    id: 'other',
    name: 'אחר',
    emoji: '',
    description: 'Miscellaneous / uncategorized tasks',
    bg: 'bg-neutral-50',
    fg: 'text-neutral-700',
    border: 'border-neutral-200'
  }
];

// Quick lookup maps
export const CATEGORY_MAP: Record<string, TaskCategoryDefinition> = TASK_CATEGORY_DEFINITIONS.reduce(
  (acc, def) => {
    acc[def.id] = def;
    return acc;
  },
  {} as Record<string, TaskCategoryDefinition>
);

// Helper: classes for badge rendering
export function categoryBadgeClasses(cat: string): string {
  const c = CATEGORY_MAP[cat] || CATEGORY_MAP.other;
  return `${c.bg} ${c.fg} border ${c.border}`;
}

// Helper: emoji
export function getCategoryEmoji(cat: string): string {
  return (CATEGORY_MAP[cat] || CATEGORY_MAP.other).emoji;
}

// Helper: full preview object for UI
export function getCategoryMeta(cat: string): TaskCategoryDefinition {
  return CATEGORY_MAP[cat] || CATEGORY_MAP.other;
}

// Helper: localized display name
export function getCategoryName(cat: string): string {
  return getCategoryMeta(cat).name;
}

// Helper: build AI prompt list (concise)
export function buildCategoryPromptList(): string {
  return TASK_CATEGORY_DEFINITIONS.map(c => `${c.id} ${c.emoji} - ${c.description}`).join('\\n');
}
