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
  {
    id: 'work',
    name: 'עבודה',
    emoji: '💼',
    description: 'Business, professional tasks, meetings, focus work',
    bg: 'bg-blue-600',
    fg: 'text-white',
    border: 'border-blue-600'
  },
  {
    id: 'personal',
    name: 'אישי',
    emoji: '👤',
    description: 'Personal errands, self improvement, solo tasks',
    bg: 'bg-pink-600',
    fg: 'text-white',
    border: 'border-pink-600'
  },
  {
    id: 'family',
    name: 'משפחה',
    emoji: '👨‍👩‍👧‍👦',
    description: 'Family time, kids activities, shared household tasks',
    bg: 'bg-emerald-600',
    fg: 'text-white',
    border: 'border-emerald-600'
  },
  {
    id: 'health',
    name: 'בריאות',
    emoji: '🏥',
    description: 'Medical, therapy, wellness, health tracking',
    bg: 'bg-red-600',
    fg: 'text-white',
    border: 'border-red-600'
  },
  {
    id: 'education',
    name: 'למידה',
    emoji: '📚',
    description: 'Study, courses, reading, skill building',
    bg: 'bg-indigo-600',
    fg: 'text-white',
    border: 'border-indigo-600'
  },
  {
    id: 'social',
    name: 'חברתי',
    emoji: '🎉',
    description: 'Social gatherings, parties, meetups',
    bg: 'bg-purple-600',
    fg: 'text-white',
    border: 'border-purple-600'
  },
  {
    id: 'finance',
    name: 'פיננסי',
    emoji: '💰',
    description: 'Bills, payments, budgeting, financial planning',
    bg: 'bg-amber-600',
    fg: 'text-white',
    border: 'border-amber-600'
  },
  {
    id: 'home',
    name: 'בית',
    emoji: '🏠',
    description: 'Household chores, maintenance, improvements',
    bg: 'bg-teal-600',
    fg: 'text-white',
    border: 'border-teal-600'
  },
  {
    id: 'travel',
    name: 'נסיעות',
    emoji: '🚗',
    description: 'Trips, flights, vacation planning, logistics',
    bg: 'bg-cyan-600',
    fg: 'text-white',
    border: 'border-cyan-600'
  },
  {
    id: 'fitness',
    name: 'כושר',
    emoji: '💪',
    description: 'Exercise, gym, physical training',
    bg: 'bg-lime-600',
    fg: 'text-white',
    border: 'border-lime-600'
  },
  {
    id: 'food',
    name: 'אוכל',
    emoji: '🍽️',
    description: 'Meals, cooking, nutrition planning',
    bg: 'bg-orange-600',
    fg: 'text-white',
    border: 'border-orange-600'
  },
  {
    id: 'shopping',
    name: 'קניות',
    emoji: '🛍️',
    description: 'Purchases, errands, procurement',
    bg: 'bg-fuchsia-600',
    fg: 'text-white',
    border: 'border-fuchsia-600'
  },
  {
    id: 'entertainment',
    name: 'בילוי',
    emoji: '🎮',
    description: 'Leisure, games, movies, shows',
    bg: 'bg-violet-600',
    fg: 'text-white',
    border: 'border-violet-600'
  },
  {
    id: 'sports',
    name: 'ספורט',
    emoji: '⚽',
    description: 'Playing or attending sports activities',
    bg: 'bg-green-700',
    fg: 'text-white',
    border: 'border-green-700'
  },
  {
    id: 'hobby',
    name: 'תחביב',
    emoji: '🎯',
    description: 'Hobbies, crafts, creative work',
    bg: 'bg-rose-600',
    fg: 'text-white',
    border: 'border-rose-600'
  },
  {
    id: 'volunteer',
    name: 'התנדבות',
    emoji: '🤝',
    description: 'Community service, volunteering',
    bg: 'bg-sky-600',
    fg: 'text-white',
    border: 'border-sky-600'
  },
  {
    id: 'appointment',
    name: 'פגישה',
    emoji: '📅',
    description: 'General appointments, scheduled visits',
    bg: 'bg-slate-600',
    fg: 'text-white',
    border: 'border-slate-600'
  },
  {
    id: 'maintenance',
    name: 'תחזוקה',
    emoji: '🛠️',
    description: 'Repairs, service tasks (car/home)',
    bg: 'bg-stone-600',
    fg: 'text-white',
    border: 'border-stone-600'
  },
  {
    id: 'celebration',
    name: 'חגיגה',
    emoji: '🎂',
    description: 'Birthdays, anniversaries, special occasions',
    bg: 'bg-yellow-500',
    fg: 'text-black',
    border: 'border-yellow-500'
  },
  {
    id: 'meeting',
    name: 'ישיבה',
    emoji: '🗣️',
    description: 'Formal meetings, structured discussions',
    bg: 'bg-blue-800',
    fg: 'text-white',
    border: 'border-blue-800'
  },
  {
    id: 'childcare',
    name: 'טיפול בילדים',
    emoji: '🧒',
    description: 'Child care, support, activities',
    bg: 'bg-emerald-700',
    fg: 'text-white',
    border: 'border-emerald-700'
  },
  {
    id: 'pet',
    name: 'חיות מחמד',
    emoji: '🐾',
    description: 'Pet care, vet visits, training',
    bg: 'bg-orange-500',
    fg: 'text-white',
    border: 'border-orange-500'
  },
  {
    id: 'errand',
    name: 'סידור',
    emoji: '📝',
    description: 'Quick errands and small tasks',
    bg: 'bg-gray-600',
    fg: 'text-white',
    border: 'border-gray-600'
  },
  {
    id: 'transport',
    name: 'תחבורה',
    emoji: '🚕',
    description: 'Commute, driving, transportation planning',
    bg: 'bg-cyan-700',
    fg: 'text-white',
    border: 'border-cyan-700'
  },
  {
    id: 'project',
    name: 'פרויקט',
    emoji: '📐',
    description: 'Multi-step project, structured output',
    bg: 'bg-purple-700',
    fg: 'text-white',
    border: 'border-purple-700'
  },
  {
    id: 'deadline',
    name: 'דדליין',
    emoji: '⏰',
    description: 'Time sensitive deliverable or due item',
    bg: 'bg-red-700',
    fg: 'text-white',
    border: 'border-red-700'
  },
  {
    id: 'other',
    name: 'אחר',
    emoji: '🔖',
    description: 'Miscellaneous / uncategorized tasks',
    bg: 'bg-neutral-600',
    fg: 'text-white',
    border: 'border-neutral-600'
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

// Helper: build AI prompt list (concise)
export function buildCategoryPromptList(): string {
  return TASK_CATEGORY_DEFINITIONS.map(c => `${c.id} ${c.emoji} - ${c.description}`).join('\\n');
}
