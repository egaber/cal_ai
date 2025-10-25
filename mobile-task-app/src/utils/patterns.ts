// Detection Patterns for Mobile Task Parser

import { FamilyMember, KnownLocation, LocationInfo } from '../types/mobileTask';

// Family members configuration
export const FAMILY_MEMBERS: FamilyMember[] = [
  { name: 'Eyal', displayName: 'Eyal', displayNameHebrew: 'אייל', age: undefined, isChild: false, needsSupervision: false },
  { name: 'Ella', displayName: 'Ella', displayNameHebrew: 'אלה', age: undefined, isChild: false, needsSupervision: false },
  { name: 'Hilly', displayName: 'Hilly', displayNameHebrew: 'הילי', age: 11, isChild: true, needsSupervision: false }, // 11 years old - independent
  { name: 'Yael', displayName: 'Yael', displayNameHebrew: 'יעל', age: 5.5, isChild: true, needsSupervision: true },
  { name: 'Alon', displayName: 'Alon', displayNameHebrew: 'אלון', age: 3, isChild: true, needsSupervision: true },
];

// Known places configuration with driving requirements
export interface KnownPlace extends LocationInfo {
  requiresDriving: boolean;
}

export const KNOWN_PLACES: KnownPlace[] = [
  { name: 'home', displayName: 'Home', displayNameHebrew: 'בית', drivingTimeFromHome: 0, requiresDriving: false },
  { name: 'kindergarten', displayName: 'Kindergarten', displayNameHebrew: 'גן', drivingTimeFromHome: 15, requiresDriving: true },
  { name: 'school', displayName: 'School', displayNameHebrew: 'בית ספר', drivingTimeFromHome: 10, requiresDriving: true },
  { name: 'work', displayName: 'Work', displayNameHebrew: 'עבודה', drivingTimeFromHome: 20, requiresDriving: true },
  { name: 'home', displayName: 'Supermarket', displayNameHebrew: 'סופר', drivingTimeFromHome: 5, requiresDriving: false },
  { name: 'home', displayName: 'Mall', displayNameHebrew: 'קניון', drivingTimeFromHome: 15, requiresDriving: true },
  { name: 'home', displayName: 'Park', displayNameHebrew: 'פארק', drivingTimeFromHome: 10, requiresDriving: false },
  { name: 'home', displayName: 'Doctor', displayNameHebrew: 'רופא', drivingTimeFromHome: 12, requiresDriving: true },
  { name: 'home', displayName: 'Dentist', displayNameHebrew: 'רופא שיניים', drivingTimeFromHome: 12, requiresDriving: true },
  { name: 'home', displayName: 'Gym', displayNameHebrew: 'חדר כושר', drivingTimeFromHome: 8, requiresDriving: false },
  { name: 'home', displayName: 'Pool', displayNameHebrew: 'בריכה', drivingTimeFromHome: 15, requiresDriving: true },
];

// Hebrew patterns
export const HEBREW_PATTERNS = {
  // Time buckets (capture group 2 contains the actual match)
  today: /(^|[\s])(היום|הערב|עכשיו)([\s]|$)/i,
  tomorrow: /(^|[\s])(מחר)([\s]|$)/i,
  thisWeek: /(^|[\s])(השבוע|השבוע הזה|בשבוע)([\s]|$)/i,
  nextWeek: /(^|[\s])(שבוע הבא|בשבוע הבא)([\s]|$)/i,
  
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
  time: /(^|[\s])(?:בשעה|ב-?|ב)\s*(\d{1,2}):(\d{2})/i,
  timeWords: /(^|[\s])(בבוקר|בצהריים|אחר הצהריים|בערב|בלילה)([\s]|$)/i,
  
  // Family members (with Hebrew prefixes: ל=to, ש=that, את=with, של=of, ב=in, ו=and)
  // Now accepts punctuation after names: , . ! ? ) : etc.
  familyMembers: {
    eyal: /(^|[\s])([לשבכ]?את\s+)?([לשבכו]?)(אייל|eyalg?)([\s,.!?):;]|$)/gi,
    ella: /(^|[\s])([לשבכ]?את\s+)?([לשבכו]?)(אלה|ella)([\s,.!?):;]|$)/gi,
    hilly: /(^|[\s])([לשבכ]?את\s+)?([לשבכו]?)(הילי|hilly)([\s,.!?):;]|$)/gi,
    yael: /(^|[\s])([לשבכ]?את\s+)?([לשבכו]?)(יעל|yael)([\s,.!?):;]|$)/gi,
    alon: /(^|[\s])([לשבכ]?את\s+)?([לשבכו]?)(אלון|alon)([\s,.!?):;]|$)/gi,
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
  
  // Locations (capture group 2 contains the actual match)
  locations: {
    home: /(^|[\s])(בית|הבית|בבית|הביתה)([\s]|$)/i,
    kindergarten: /(^|[\s])(גן|הגן|גן ילדים|לגן|בגן)([\s]|$)/i,
    school: /(^|[\s])([מב]?בית ספר|בית הספר|לבית ספר|ביה"ס|בביה"ס|לביה"ס)([\s]|$)/i,
    work: /(^|[\s])(עבודה|למשרד|משרד|העבודה|לעבודה)([\s]|$)/i,
    supermarket: /(^|[\s])(סופר|סופרמרקט|לסופר|בסופר)([\s]|$)/i,
    mall: /(^|[\s])(קניון|לקניון|בקניון)([\s]|$)/i,
    park: /(^|[\s])(פארק|לפארק|בפארק|גינה|לגינה|בגינה)([\s]|$)/i,
    doctor: /(^|[\s])(רופא|לרופא|אצל הרופא|קופ"ח|קופת חולים)([\s]|$)/i,
    dentist: /(^|[\s])(רופא שיניים|שיניים|לרופא שיניים)([\s]|$)/i,
    gym: /(^|[\s])(חדר כושר|כושר|לחדר כושר|בחדר כושר|מכון כושר)([\s]|$)/i,
    pool: /(^|[\s])(בריכה|לבריכה|בבריכה)([\s]|$)/i,
  },
  
  // Transportation
  transport: /(^|[\s])(להסיע|לקחת|להביא|לאסוף|להוריד)/gi,
  driving: /(^|[\s])(נסיעה|נהיגה|לנסוע|לנהוג)/gi,
  
  // Recurring patterns - organized by type (capture group 2 contains the actual match)
  recurring: {
    daily: /(^|[\s])(כל יום|יומי|יומיומי|מדי יום)/i,
    morning: /(^|[\s])(כל בוקר)/i,
    evening: /(^|[\s])(כל ערב)/i,
    afternoon: /(^|[\s])(כל צהריים|אחר הצהריים)/i,
    night: /(^|[\s])(כל לילה)/i,
    weekly: /(^|[\s])(כל שבוע|שבועי|מדי שבוע)/i,
    monthly: /(^|[\s])(כל חודש|חודשי|מדי חודש)/i,
    // Specific weekdays - FULL PHRASE (capture group 2 contains the actual match)
    sunday: /(^|[\s])(כל יום ראשון)/i,
    monday: /(^|[\s])(כל יום שני)/i,
    tuesday: /(^|[\s])(כל יום שלישי)/i,
    wednesday: /(^|[\s])(כל יום רביעי)/i,
    thursday: /(^|[\s])(כל יום חמישי)/i,
    friday: /(^|[\s])(כל יום שישי)/i,
    saturday: /(^|[\s])(כל שבת)/i,
    // Multiple days pattern - "כל יום שני וחמישי" or just "שני וחמישי" or "שני, רביעי וחמישי"
    // Note: Needs /gi flag for parser's .exec() to work, tests use .match() which works with both
    multipleDays: /(כל\s+יום\s+)?(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)([\s,]+ו?[-]?(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת))+([\s,]+ו[-]?(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת))*/gi,
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
  
  // Recurring patterns - organized by type
  recurring: {
    daily: /\b(daily|every day|each day)\b/gi,
    morning: /\b(every morning)\b/gi,
    evening: /\b(every evening)\b/gi,
    afternoon: /\b(every afternoon)\b/gi,
    night: /\b(every night)\b/gi,
    weekly: /\b(weekly|every week|each week)\b/gi,
    monthly: /\b(monthly|every month|each month)\b/gi,
    // Specific weekdays - FULL PHRASE
    sunday: /\b(every sunday)\b/gi,
    monday: /\b(every monday)\b/gi,
    tuesday: /\b(every tuesday)\b/gi,
    wednesday: /\b(every wednesday)\b/gi,
    thursday: /\b(every thursday)\b/gi,
    friday: /\b(every friday)\b/gi,
    saturday: /\b(every saturday)\b/gi,
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
  
  // First try exact matches
  const exactMatch = KNOWN_PLACES.find(place => {
    const placeNameHebrew = place.displayNameHebrew.toLowerCase();
    return normalizedLocation === placeNameHebrew;
  });
  
  if (exactMatch) return exactMatch;
  
  // Then try word-boundary matches (but not for places with "home" as name to avoid false positives)
  return KNOWN_PLACES.find(place => {
    const placeName = place.name.toLowerCase();
    const placeNameHebrew = place.displayNameHebrew.toLowerCase();
    
    // Skip if it's a generic "home" entry (these are used for multiple places)
    if (placeName === 'home') {
      // Only match if the location is EXACTLY the Hebrew name (already checked above)
      return false;
    }
    
    // For non-home entries, check if location contains the place name
    return (
      normalizedLocation.includes(placeNameHebrew) ||
      placeName.includes(normalizedLocation)
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

/**
 * Extract multiple weekdays from text like "שני וחמישי" or "ראשון, שלישי וחמישי"
 * Returns array of day numbers (0=Sunday, 1=Monday, etc.) or null if not found
 */
export function extractMultipleWeekdays(text: string): number[] | null {
  const dayMap: Record<string, number> = {
    'ראשון': 0,
    'שני': 1,
    'שלישי': 2,
    'רביעי': 3,
    'חמישי': 4,
    'שישי': 5,
    'שבת': 6
  };
  
  // Match the multiple days pattern
  const match = text.match(HEBREW_PATTERNS.recurring.multipleDays);
  if (!match) return null;
  
  const matchedText = match[0];
  const days: number[] = [];
  
  // Extract all day names from the matched text
  for (const [dayName, dayNum] of Object.entries(dayMap)) {
    if (matchedText.includes(dayName)) {
      days.push(dayNum);
    }
  }
  
  // Return sorted array if we found multiple days
  return days.length > 1 ? days.sort((a, b) => a - b) : null;
}
