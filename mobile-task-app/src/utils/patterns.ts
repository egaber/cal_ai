// Detection Patterns for Mobile Task Parser

import { FamilyMember, KnownPlace } from '../types/mobileTask';

// Family members configuration
export const FAMILY_MEMBERS: FamilyMember[] = [
  { name: 'Eyal', age: undefined, isChild: false, needsSupervision: false },
  { name: 'Ella', age: undefined, isChild: false, needsSupervision: false },
  { name: 'Hilly', age: 11, isChild: true, needsSupervision: false }, // 11 years old - independent
  { name: 'Yael', age: 5.5, isChild: true, needsSupervision: true },
  { name: 'Alon', age: 3, isChild: true, needsSupervision: true },
];

// Known places configuration
export const KNOWN_PLACES: KnownPlace[] = [
  { name: 'home', nameHe: 'בית', drivingTimeFromHome: 0, requiresDriving: false },
  { name: 'kindergarten', nameHe: 'גן', drivingTimeFromHome: 15, requiresDriving: true },
  { name: 'school', nameHe: 'בית ספר', drivingTimeFromHome: 10, requiresDriving: true },
  { name: 'work', nameHe: 'עבודה', drivingTimeFromHome: 20, requiresDriving: true },
  { name: 'supermarket', nameHe: 'סופר', drivingTimeFromHome: 5, requiresDriving: false },
  { name: 'mall', nameHe: 'קניון', drivingTimeFromHome: 15, requiresDriving: true },
  { name: 'park', nameHe: 'פארק', drivingTimeFromHome: 10, requiresDriving: false },
  { name: 'doctor', nameHe: 'רופא', drivingTimeFromHome: 12, requiresDriving: true },
  { name: 'dentist', nameHe: 'רופא שיניים', drivingTimeFromHome: 12, requiresDriving: true },
  { name: 'gym', nameHe: 'חדר כושר', drivingTimeFromHome: 8, requiresDriving: false },
  { name: 'pool', nameHe: 'בריכה', drivingTimeFromHome: 15, requiresDriving: true },
];

// Hebrew patterns
export const HEBREW_PATTERNS = {
  // Time buckets (removed \b word boundaries as they don't work with Hebrew)
  today: /(^|[\s])(היום|הערב|עכשיו)([\s]|$)/gi,
  tomorrow: /(^|[\s])(מחר)([\s]|$)/gi,
  thisWeek: /(^|[\s])(השבוע|השבוע הזה|בשבוע)([\s]|$)/gi,
  nextWeek: /(^|[\s])(שבוע הבא|בשבוע הבא)([\s]|$)/gi,
  
  // Days of week
  daysOfWeek: [
    { name: 'ראשון', variants: ['ראשון', 'יום ראשון', 'ביום ראשון'], day: 0 },
    { name: 'שני', variants: ['שני', 'יום שני', 'ביום שני'], day: 1 },
    { name: 'שלישי', variants: ['שלישי', 'יום שלישי', 'ביום שלישי'], day: 2 },
    { name: 'רביעי', variants: ['רביעי', 'יום רביעי', 'ביום רביעי'], day: 3 },
    { name: 'חמישי', variants: ['חמישי', 'יום חמישי', 'ביום חמישי'], day: 4 },
    { name: 'שישי', variants: ['שישי', 'יום שישי', 'ביום שישי'], day: 5 },
    { name: 'שבת', variants: ['שבת', 'בשבת'], day: 6 },
  ],
  
  // Time expressions
  time: /(^|[\s])(?:בשעה|ב-?|ב)\s*(\d{1,2}):(\d{2})/gi,
  timeWords: /(^|[\s])(בבוקר|בצהריים|אחר הצהריים|בערב|בלילה)([\s]|$)/gi,
  
  // Family members (with Hebrew prefixes: ל=to, ש=that, את=with, של=of, ב=in)
  familyMembers: {
    eyal: /(^|[\s])([לשבכ]?את\s+)?([לשבכ]?)(אייל|eyalg?)([\s]|$)/gi,
    ella: /(^|[\s])([לשבכ]?את\s+)?([לשבכ]?)(אלה|ella)([\s]|$)/gi,
    hilly: /(^|[\s])([לשבכ]?את\s+)?([לשבכ]?)(הילי|hilly)([\s]|$)/gi,
    yael: /(^|[\s])([לשבכ]?את\s+)?([לשבכ]?)(יעל|yael)([\s]|$)/gi,
    alon: /(^|[\s])([לשבכ]?את\s+)?([לשבכ]?)(אלון|alon)([\s]|$)/gi,
  },
  
  // Ownership and involvement
  owner: /(^|[\s])(אני צריך|אני צריכה|אני חייב|אייל צריך|אלה צריכה)/gi,
  involved: /(^|[\s])(עם|ביחד עם|יחד עם|לקחת את)/gi,
  
  // Street address patterns (Hebrew)
  // Matches with number: "סחלב 6", "הרצל 123", "בן גוריון 45"
  // Matches without number with "ב" prefix: "בברנר", "בהרצל"
  streetAddressWithNumber: /([א-ת][א-ת\s]{2,20})\s+(\d{1,4})/g,
  streetNameOnly: /ב([א-ת]{3,20})(?=\s|$)/g,
  
  // Location details (floor, room, etc.) - for future enhancement
  locationDetails: /(קומה|מינוס|פלוס|חדר|דירה)\s+([א-ת\d\s]+)/g,
  
  // Locations
  locations: {
    home: /(^|[\s])(בית|הבית|בבית|הביתה)([\s]|$)/gi,
    kindergarten: /(^|[\s])(גן|הגן|גן ילדים|לגן|בגן)([\s]|$)/gi,
    school: /(^|[\s])(בית ספר|בית הספר|לבית ספר|ביה"ס|בביה"ס|לביה"ס)([\s]|$)/gi,
    work: /(^|[\s])(עבודה|למשרד|משרד|העבודה|לעבודה)([\s]|$)/gi,
    supermarket: /(^|[\s])(סופר|סופרמרקט|לסופר|בסופר)([\s]|$)/gi,
    mall: /(^|[\s])(קניון|לקניון|בקניון)([\s]|$)/gi,
    park: /(^|[\s])(פארק|לפארק|בפארק|גינה|לגינה|בגינה)([\s]|$)/gi,
    doctor: /(^|[\s])(רופא|לרופא|אצל הרופא|קופ"ח|קופת חולים)([\s]|$)/gi,
    dentist: /(^|[\s])(רופא שיניים|שיניים|לרופא שיניים)([\s]|$)/gi,
    gym: /(^|[\s])(חדר כושר|כושר|לחדר כושר|בחדר כושר|מכון כושר)([\s]|$)/gi,
    pool: /(^|[\s])(בריכה|לבריכה|בבריכה)([\s]|$)/gi,
  },
  
  // Transportation
  transport: /(^|[\s])(להסיע|לקחת|להביא|לאסוף|להוריד)/gi,
  driving: /(^|[\s])(נסיעה|נהיגה|לנסוע|לנהוג)/gi,
  
  // Recurring patterns
  recurring: {
    daily: /(^|[\s])(כל יום|יומי|יומיומי|מדי יום)/gi,
    weekly: /(^|[\s])(כל שבוע|שבועי|מדי שבוע)/gi,
    monthly: /(^|[\s])(כל חודש|חודשי|מדי חודש)/gi,
  },
  
  // Task type
  reminder: /(^|[\s])(להזכיר|תזכורת|זיכרון)/gi,
  task: /(^|[\s])(צריך|חייב|משימה|לעשות)/gi,
};

// English patterns
export const ENGLISH_PATTERNS = {
  // Time buckets
  today: /\btoday\b/gi,
  tomorrow: /\btomorrow\b/gi,
  thisWeek: /\b(this week|the week)\b/gi,
  nextWeek: /\b(next week)\b/gi,
  
  // Days of week
  daysOfWeek: [
    { name: 'Sunday', variants: ['sunday', 'sun', 'on sunday'], day: 0 },
    { name: 'Monday', variants: ['monday', 'mon', 'on monday'], day: 1 },
    { name: 'Tuesday', variants: ['tuesday', 'tue', 'on tuesday'], day: 2 },
    { name: 'Wednesday', variants: ['wednesday', 'wed', 'on wednesday'], day: 3 },
    { name: 'Thursday', variants: ['thursday', 'thu', 'on thursday'], day: 4 },
    { name: 'Friday', variants: ['friday', 'fri', 'on friday'], day: 5 },
    { name: 'Saturday', variants: ['saturday', 'sat', 'on saturday'], day: 6 },
  ],
  
  // Time expressions
  time: /at\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?/gi,
  timeWords: /(morning|afternoon|evening|night)/gi,
  
  // Family members (English names)
  familyMembers: {
    eyal: /\b(eyal|eyalg?)\b/gi,
    ella: /\b(ella)\b/gi,
    hilly: /\b(hilly)\b/gi,
    yael: /\b(yael)\b/gi,
    alon: /\b(alon)\b/gi,
  },
  
  // Ownership and involvement
  owner: /\b(I need to|I have to|I must|eyal needs?|ella needs?)\b/gi,
  involved: /\b(with|together with|take)\b/gi,
  
  // Locations
  locations: {
    home: /\b(home|at home|to home)\b/gi,
    kindergarten: /\b(kindergarten|kinder|gan|preschool|to kindergarten|at kindergarten)\b/gi,
    school: /\b(school|at school|to school)\b/gi,
    work: /\b(work|office|at work|to work|at the office)\b/gi,
    supermarket: /\b(supermarket|super|grocery|store|to the store)\b/gi,
    mall: /\b(mall|shopping center|shopping mall|to the mall)\b/gi,
    park: /\b(park|playground|to the park|at the park)\b/gi,
    doctor: /\b(doctor|doctors?|physician|clinic|to the doctor|doctor's office)\b/gi,
    dentist: /\b(dentist|dental|to the dentist)\b/gi,
    gym: /\b(gym|fitness|to the gym|at the gym)\b/gi,
    pool: /\b(pool|swimming pool|to the pool|at the pool)\b/gi,
  },
  
  // Transportation
  transport: /\b(take|bring|pick up|drop off|drive)\b/gi,
  driving: /\b(drive|driving)\b/gi,
  
  // Recurring patterns
  recurring: {
    daily: /\b(daily|every day|each day)\b/gi,
    weekly: /\b(weekly|every week|each week)\b/gi,
    monthly: /\b(monthly|every month|each month)\b/gi,
  },
  
  // Task type
  reminder: /\b(remind|reminder)\b/gi,
  task: /\b(need to|have to|must|task|todo)\b/gi,
};

// Priority patterns (same for both languages)
export const PRIORITY_PATTERN = /\b[Pp]([123])\b/g;

// Date patterns (universal formats)
export const DATE_PATTERNS = {
  // DD/MM/YYYY or DD-MM-YYYY
  dmySlash: /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/g,
  // YYYY-MM-DD (ISO format)
  iso: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g,
};

// Time patterns (24-hour format, universal)
export const TIME_PATTERN_24H = /\b(\d{1,2}):(\d{2})\b/g;

/**
 * Detects language from text
 */
export function detectLanguage(text: string): 'he' | 'en' {
  // Count Hebrew characters (Unicode range for Hebrew letters: \u0590-\u05FF)
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  
  // If more than 30% Hebrew characters, consider it Hebrew
  return hebrewChars > totalChars * 0.3 ? 'he' : 'en';
}

/**
 * Get patterns based on detected language
 */
export function getPatterns(language: 'he' | 'en' | 'auto', text?: string) {
  if (language === 'auto' && text) {
    language = detectLanguage(text);
  }
  
  return language === 'he' ? HEBREW_PATTERNS : ENGLISH_PATTERNS;
}

/**
 * Get family member by name (case-insensitive, supports both languages)
 */
export function getFamilyMember(name: string): FamilyMember | undefined {
  const normalizedName = name.toLowerCase().trim();
  
  return FAMILY_MEMBERS.find(member => {
    const memberName = member.name.toLowerCase();
    // Check both English name and common variations
    return (
      memberName === normalizedName ||
      memberName.includes(normalizedName) ||
      normalizedName.includes(memberName)
    );
  });
}

/**
 * Get known place by name (supports both languages)
 */
export function getKnownPlace(location: string): KnownPlace | undefined {
  const normalizedLocation = location.toLowerCase().trim();
  
  return KNOWN_PLACES.find(place => {
    const placeName = place.name.toLowerCase();
    const placeNameHe = place.nameHe.toLowerCase();
    
    return (
      normalizedLocation.includes(placeName) ||
      normalizedLocation.includes(placeNameHe) ||
      placeName.includes(normalizedLocation) ||
      placeNameHe.includes(normalizedLocation)
    );
  });
}

/**
 * Check if text mentions taking/driving someone somewhere
 */
export function detectTransportAction(text: string, language: 'he' | 'en'): boolean {
  const patterns = getPatterns(language);
  return patterns.transport.test(text) || patterns.driving.test(text);
}
