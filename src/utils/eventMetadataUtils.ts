import { CalendarEvent } from "@/types/calendar";

// Local rule-based event metadata generator (no AI required)
// This is fast and works offline
export function generateEventMetadataLocal(title: string, description: string = ''): { emoji: string; category: CalendarEvent['category'] } {
  const text = `${title} ${description}`.toLowerCase();
  
  // Health/Medical patterns (בריאות/רפואה)
  if (text.match(/\b(doctor|dentist|medical|clinic|hospital|checkup|therapy|prescription|surgery|vet|veterinary|health|wellness|appointment|appt|רופא|רופאה|שיניים|רופא שיניים|קליניקה|בית חולים|בדיקה|טיפול|מרשם|ניתוח|בריאות)\b/)) {
    return { emoji: '🏥', category: 'health' };
  }
  
  // Fitness patterns (כושר)
  if (text.match(/\b(gym|workout|exercise|run|running|jog|jogging|yoga|pilates|training|crossfit|swim|swimming|bike|biking|cycling|fitness|sport|חדר כושר|אימון|כושר|ריצה|יוגה|פילאטיס|שחייה|אופניים|רכיבה|ספורט)\b/)) {
    return { emoji: '💪', category: 'fitness' };
  }
  
  // Food/Meals patterns (אוכל/ארוחות)
  if (text.match(/\b(lunch|dinner|breakfast|brunch|meal|restaurant|cook|cooking|recipe|eat|eating|food|cafe|coffee|kitchen|dining|ארוחה|צהריים|ערב|בוקר|ארוחת|מסעדה|בישול|אוכל|קפה|בית קפה|אוכל|מטבח)\b/)) {
    return { emoji: '🍽️', category: 'food' };
  }
  
  // Shopping patterns (קניות)
  if (text.match(/\b(shop|shopping|buy|buying|purchase|store|mall|grocery|groceries|market|supermarket|קניות|קנייה|לקנות|חנות|קניון|סופר|סופרמרקט|שוק)\b/)) {
    return { emoji: '🛍️', category: 'shopping' };
  }
  
  // Travel patterns (נסיעות - רכב)
  if (text.match(/\b(travel|trip|drive|driving|road trip|car ride|vacation|hotel|tour|destination|journey|נסיעה|נסיעות|נוסע|רכב|מכונית|חופשה|מלון|טיול|יעד)\b/)) {
    return { emoji: '🚗', category: 'travel' };
  }
  
  // Transport/Flight patterns (טיסות - מטוס)
  if (text.match(/\b(flight|fly|flying|airport|plane|airline|boarding|takeoff|landing|טיסה|טיסות|טס|נמל תעופה|מטוס|חברת תעופה|המראה|נחיתה)\b/)) {
    return { emoji: '✈️', category: 'transport' };
  }
  
  // Education patterns (לימודים/חינוך)
  if (text.match(/\b(class|course|lecture|study|studying|exam|test|homework|assignment|school|college|university|learn|learning|lesson|seminar|שיעור|קורס|הרצאה|לימוד|לימודים|מבחן|בחינה|שיעורי בית|בית ספר|אוניברסיטה|ללמוד|שיעור|סמינר)\b/)) {
    return { emoji: '📚', category: 'education' };
  }
  
  // Social/Party patterns (חברתי/מסיבה)
  if (text.match(/\b(party|celebration|birthday|wedding|event|gathering|meetup|hangout|drinks|friends|social|מסיבה|חגיגה|יום הולדת|חתונה|אירוע|מפגש|פגישה|חברים|חברתי|שתייה)\b/)) {
    return { emoji: '🎉', category: 'social' };
  }
  
  // Finance patterns (כספים)
  if (text.match(/\b(payment|bill|invoice|tax|taxes|budget|bank|banking|financial|investment|money|salary|paycheck|expense|תשלום|חשבון|חשבונית|מס|מיסים|תקציב|בנק|בנקאות|כספי|השקעה|כסף|משכורת|הוצאה)\b/)) {
    return { emoji: '💰', category: 'finance' };
  }
  
  // Home/Household patterns (בית/משק בית)
  if (text.match(/\b(clean|cleaning|repair|maintenance|chore|chores|laundry|organize|organizing|home improvement|garden|gardening|yard|ניקיון|לנקות|תיקון|תחזוקה|משימה|משימות|כביסה|ארגון|שיפוץ|גינה|גינון|חצר)\b/)) {
    return { emoji: '🏠', category: 'home' };
  }
  
  // Work/Meeting patterns (עבודה/פגישה)
  if (text.match(/\b(meeting|work|office|project|deadline|presentation|conference|call|client|team|business|professional|פגישה|עבודה|משרד|פרויקט|דדליין|מועד אחרון|מצגת|ועידה|שיחה|לקוח|צוות|עסק|מקצועי)\b/)) {
    return { emoji: '💼', category: 'work' };
  }
  
  // Family patterns (משפחה)
  if (text.match(/\b(family|kids|children|parents|relatives|mom|dad|son|daughter|sibling|brother|sister|משפחה|ילדים|ילד|ילדה|הורים|קרובי משפחה|אמא|אבא|בן|בת|אח|אחות)\b/)) {
    return { emoji: '👨‍👩‍👧‍👦', category: 'family' };
  }
  
  // Entertainment patterns (בידור)
  if (text.match(/\b(movie|movies|film|show|theater|cinema|concert|game|gaming|entertainment|watch|watching|סרט|סרטים|הצגה|תיאטרון|קולנוע|קונצרט|משחק|משחקים|בידור|לצפות|צפייה)\b/)) {
    return { emoji: '🎬', category: 'entertainment' };
  }
  
  // Sports patterns (ספורט)
  if (text.match(/\b(football|basketball|soccer|tennis|baseball|hockey|game|match|tournament|championship|כדורגל|כדורסל|טניס|משחק|תחרות|אליפות|ספורט)\b/)) {
    return { emoji: '🏆', category: 'sports' };
  }
  
  // Hobby patterns (תחביב)
  if (text.match(/\b(hobby|hobbies|craft|crafting|art|painting|drawing|music|instrument|photography|reading|תחביב|תחביבים|מלאכה|אומנות|ציור|רישום|מוזיקה|כלי נגינה|צילום|קריאה)\b/)) {
    return { emoji: '🎨', category: 'hobby' };
  }
  
  // Volunteer patterns (התנדבות)
  if (text.match(/\b(volunteer|volunteering|community service|charity|donate|donation|help|helping|התנדבות|מתנדב|שירות קהילתי|צדקה|תרומה|עזרה|לעזור)\b/)) {
    return { emoji: '❤️', category: 'volunteer' };
  }
  
  // Celebration patterns (חגיגה)
  if (text.match(/\b(birthday|anniversary|celebration|celebrate|special occasion|milestone|יום הולדת|יומולדת|יום נישואין|חגיגה|לחגוג|אירוע מיוחד|אבן דרך)\b/)) {
    return { emoji: '🎂', category: 'celebration' };
  }
  
  // Childcare patterns (טיפול בילדים)
  if (text.match(/\b(childcare|babysit|babysitting|daycare|nursery|nanny|kids care|טיפול בילדים|בייביסיטר|מעון|גן ילדים|מטפלת)\b/)) {
    return { emoji: '👶', category: 'childcare' };
  }
  
  // Pet patterns (חיות מחמד)
  if (text.match(/\b(pet|dog|cat|pets|puppy|kitten|animal|walk the dog|חיית מחמד|כלב|חתול|גור|טיול עם הכלב|בעל חיים)\b/)) {
    return { emoji: '🐾', category: 'pet' };
  }
  
  // Errand patterns (סידורים)
  if (text.match(/\b(errand|errands|task|tasks|todo|to-do|pickup|pick up|drop off|סידור|סידורים|משימה|משימות|לאסוף|להוריד)\b/)) {
    return { emoji: '📦', category: 'errand' };
  }
  
  // Project patterns (פרויקט)
  if (text.match(/\b(project|planning|plan|strategy|development|design|build|building|פרויקט|תכנון|תוכנית|אסטרטגיה|פיתוח|עיצוב|בניה|בנייה)\b/)) {
    return { emoji: '📋', category: 'project' };
  }
  
  // Deadline patterns (דדליין)
  if (text.match(/\b(deadline|due|urgent|important|critical|asap|emergency|דדליין|מועד אחרון|דחוף|חשוב|קריטי|חירום)\b/)) {
    return { emoji: '⏰', category: 'deadline' };
  }
  
  // Default: personal
  return { emoji: '📅', category: 'personal' };
}
