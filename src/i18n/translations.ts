export const translations = {
  he: {
    // Navigation
    'nav.calendar': 'לוח שנה',
    'nav.tasks': 'משימות',
    'nav.today': 'היום',
    
    // Common
    'common.save': 'שמור',
    'common.cancel': 'ביטול',
    'common.delete': 'מחק',
    'common.edit': 'ערוך',
    'common.add': 'הוסף',
    'common.close': 'סגור',
    'common.search': 'חיפוש',
    'common.loading': 'טוען...',
    'common.error': 'שגיאה',
    'common.success': 'הצלחה',
    
    // Calendar
    'calendar.title': 'לוח השנה שלי',
    'calendar.newEvent': 'אירוע חדש',
    'calendar.today': 'היום',
    'calendar.week': 'שבוע',
    'calendar.month': 'חודש',
    'calendar.day': 'יום',
    'calendar.workweek': 'שבוע עבודה',
    'calendar.noEvents': 'אין אירועים',
    
    // Tasks
    'tasks.title': 'תכנון משימות',
    'tasks.newTask': 'משימה חדשה',
    'tasks.pending': 'ממתין',
    'tasks.inProgress': 'בביצוע',
    'tasks.completed': 'הושלם',
    'tasks.schedule': 'תזמן',
    'tasks.priority': 'עדיפות',
    'tasks.duration': 'זמן',
    'tasks.deadline': 'מועד אחרון',
    
    // AI
    'ai.assistant': 'עוזר AI',
    'ai.analyzing': 'מנתח...',
    'ai.suggestions': 'הצעות AI',
    'ai.accept': 'אשר',
    'ai.reject': 'דחה',
    
    // Family
    'family.members': 'בני משפחה',
    'family.all': 'כולם',
    
    // Time
    'time.morning': 'בוקר',
    'time.afternoon': 'צהריים',
    'time.evening': 'ערב',
    'time.minutes': 'דקות',
    'time.hours': 'שעות',
    
    // Categories
    'category.work': 'עבודה',
    'category.personal': 'אישי',
    'category.family': 'משפחה',
    'category.health': 'בריאות',
    'category.education': 'חינוך',
    'category.shopping': 'קניות',
    'category.home': 'בית',
    'category.finance': 'כספים',
    'category.social': 'חברתי',
  },
  en: {
    // Navigation
    'nav.calendar': 'Calendar',
    'nav.tasks': 'Tasks',
    'nav.today': 'Today',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Calendar
    'calendar.title': 'My Calendar',
    'calendar.newEvent': 'New Event',
    'calendar.today': 'Today',
    'calendar.week': 'Week',
    'calendar.month': 'Month',
    'calendar.day': 'Day',
    'calendar.workweek': 'Work Week',
    'calendar.noEvents': 'No events',
    
    // Tasks
    'tasks.title': 'Task Planning',
    'tasks.newTask': 'New Task',
    'tasks.pending': 'Pending',
    'tasks.inProgress': 'In Progress',
    'tasks.completed': 'Completed',
    'tasks.schedule': 'Schedule',
    'tasks.priority': 'Priority',
    'tasks.duration': 'Duration',
    'tasks.deadline': 'Deadline',
    
    // AI
    'ai.assistant': 'AI Assistant',
    'ai.analyzing': 'Analyzing...',
    'ai.suggestions': 'AI Suggestions',
    'ai.accept': 'Accept',
    'ai.reject': 'Reject',
    
    // Family
    'family.members': 'Family Members',
    'family.all': 'All',
    
    // Time
    'time.morning': 'Morning',
    'time.afternoon': 'Afternoon',
    'time.evening': 'Evening',
    'time.minutes': 'minutes',
    'time.hours': 'hours',
    
    // Categories
    'category.work': 'Work',
    'category.personal': 'Personal',
    'category.family': 'Family',
    'category.health': 'Health',
    'category.education': 'Education',
    'category.shopping': 'Shopping',
    'category.home': 'Home',
    'category.finance': 'Finance',
    'category.social': 'Social',
  }
};

export type TranslationKey = keyof typeof translations.he;

export const useTranslation = (language: 'he' | 'en') => {
  return (key: TranslationKey): string => {
    return translations[language][key] || key;
  };
};
