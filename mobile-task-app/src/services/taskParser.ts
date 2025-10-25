// Task Parser - Real-time parsing implementation

import { addDays, parse, isValid } from 'date-fns';
import {
  ParsedTask,
  ParsedSegment,
  ExtractedTag,
  FamilyMemberName,
  PriorityLevel,
  RecurringPattern,
  TimeBucket,
  TimeValue,
} from '../types/mobileTask';
import {
  detectLanguage,
  getPatterns,
  getFamilyMember,
  getKnownPlace,
  detectTransportAction,
  PRIORITY_PATTERN,
  DATE_PATTERNS,
  TIME_PATTERN_24H,
  HEBREW_PATTERNS,
} from '../utils/patterns';
import {
  inferDrivingNeeds,
  inferTimeBucket,
  inferOwner,
  inferTaskType,
  inferRecurring,
  calculateConfidence,
  generateWarnings,
  separateOwnerAndInvolved,
} from '../utils/inference';
import { getTagEmoji } from '../utils/tagStyles';
import { parseWrittenTime, WrittenTimeMatch } from '../utils/timeParser';

interface Match {
  start: number;
  end: number;
  type: ParsedSegment['type'];
  value: Date | TimeValue | FamilyMemberName | PriorityLevel | RecurringPattern | string | boolean | number;
  text: string;
}

// Global safety constants for all regex loops
const MAX_REGEX_ITERATIONS = 100;
const MAX_REGEX_TIME_MS = 100; // 100ms max per pattern

// Helper to safely execute regex patterns
function safeExec(pattern: RegExp, text: string, maxIterations = MAX_REGEX_ITERATIONS): RegExpExecArray[] {
  const results: RegExpExecArray[] = [];
  pattern.lastIndex = 0;
  
  let match: RegExpExecArray | null;
  let iterationCount = 0;
  const startTime = Date.now();
  let lastIndex = -1;
  
  while ((match = pattern.exec(text)) !== null) {
    // Safety check 1: iteration limit
    if (++iterationCount > maxIterations) {
      console.warn(`[Parser Safety] Hit iteration limit for pattern: ${pattern.source}`);
      break;
    }
    
    // Safety check 2: time limit
    if (Date.now() - startTime > MAX_REGEX_TIME_MS) {
      console.warn(`[Parser Safety] Hit time limit for pattern: ${pattern.source}`);
      break;
    }
    
    // Safety check 3: zero-length match
    if (match[0].length === 0) {
      console.warn(`[Parser Safety] Zero-length match for pattern: ${pattern.source}`);
      pattern.lastIndex++;
      continue;
    }
    
    // Safety check 4: lastIndex not advancing
    if (match.index === lastIndex) {
      console.warn(`[Parser Safety] lastIndex not advancing for pattern: ${pattern.source}`);
      break;
    }
    
    lastIndex = match.index;
    results.push(match);
  }
  
  return results;
}

export function parseTask(text: string): ParsedTask {
  if (!text || text.trim().length === 0) {
    return createEmptyTask(text);
  }

  // Check for category marker and extract it
  let categoryName: string | undefined;
  let categoryIcon: string | undefined;
  const categoryPattern = /@category:([^:]+):(.+?)(?:\s|$)/;
  const categoryMatch = text.match(categoryPattern);
  
  if (categoryMatch) {
    categoryName = categoryMatch[1];
    categoryIcon = categoryMatch[2];
    // Remove the category marker from the text
    text = text.replace(categoryPattern, '').trim();
  }

  const language = detectLanguage(text);
  const patterns = getPatterns(language, text);
  const allMatches: Match[] = [];

  // Track what we've found
  let hasToday = false;
  let hasTomorrow = false;
  let hasThisWeek = false;
  let hasNextWeek = false;
  let specificDate: Date | undefined;
  let specificTime: TimeValue | undefined;
  let priority: PriorityLevel | undefined;
  let location: string | undefined;
  const mentionedMembers: FamilyMemberName[] = [];
  let hasReminderKeyword = false;
  let hasTaskKeyword = false;
  let hasTransportAction = false;
  let detectedRecurring: RecurringPattern = 'none';
  const detectedWeekdays: number[] = []; // Collect all detected weekdays

  // 1. Priority (P1, P2, P3)
  const priorityPattern = new RegExp(PRIORITY_PATTERN);
  const priorityMatches = safeExec(priorityPattern, text);
  for (const match of priorityMatches) {
    priority = `P${match[1]}` as PriorityLevel;
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'priority',
      value: priority,
      text: match[0],
    });
  }

  // 2. Time buckets - extract the actual word from capture group [2]
  const todayMatches = safeExec(patterns.today, text);
  for (const match of todayMatches) {
    hasToday = true;
    const actualText = match[2] || match[0];
    const startOffset = match[0].indexOf(actualText);
    allMatches.push({
      start: match.index + startOffset,
      end: match.index + startOffset + actualText.length,
      type: 'timeBucket',
      value: 'today',
      text: actualText,
    });
  }

  const tomorrowMatches = safeExec(patterns.tomorrow, text);
  for (const match of tomorrowMatches) {
    hasTomorrow = true;
    const actualText = match[2] || match[0];
    const startOffset = match[0].indexOf(actualText);
    allMatches.push({
      start: match.index + startOffset,
      end: match.index + startOffset + actualText.length,
      type: 'timeBucket',
      value: 'tomorrow',
      text: actualText,
    });
  }

  const thisWeekMatches = safeExec(patterns.thisWeek, text);
  for (const match of thisWeekMatches) {
    hasThisWeek = true;
    const actualText = match[2] || match[0];
    const startOffset = match[0].indexOf(actualText);
    allMatches.push({
      start: match.index + startOffset,
      end: match.index + startOffset + actualText.length,
      type: 'timeBucket',
      value: 'this-week',
      text: actualText,
    });
  }

  const nextWeekMatches = safeExec(patterns.nextWeek, text);
  for (const match of nextWeekMatches) {
    hasNextWeek = true;
    const actualText = match[2] || match[0];
    const startOffset = match[0].indexOf(actualText);
    allMatches.push({
      start: match.index + startOffset,
      end: match.index + startOffset + actualText.length,
      type: 'timeBucket',
      value: 'next-week',
      text: actualText,
    });
  }

  // 3. Family members - For Hebrew: group[4] is name, group[2] is "את", group[3] is prefix
  //                      For English: group[1] is the name
  Object.entries(patterns.familyMembers).forEach(([name, pattern]) => {
    const matches = safeExec(pattern, text);
    for (const match of matches) {
      const memberName = name.charAt(0).toUpperCase() + name.slice(1) as FamilyMemberName;
      if (!mentionedMembers.includes(memberName)) {
        mentionedMembers.push(memberName);
      }
      
      // For Hebrew patterns: match[4] is the actual name, match[2] is optional "את ", match[3] is optional prefix
      // For English patterns: match[1] is the name
      const actualName = match[4] || match[1] || match[0];
      const prefix = match[3] || ''; // Hebrew prefix like ל, ש, etc.
      const et = match[2] || ''; // Hebrew את
      
      // Build the full matched text including prefixes
      const fullMatch = et + prefix + actualName;
      const startOffset = match[0].indexOf(fullMatch);
      
      allMatches.push({
        start: match.index + startOffset,
        end: match.index + startOffset + fullMatch.length,
        type: 'involved',
        value: memberName,
        text: fullMatch,
      });
    }
  });

  // 4a. Known locations first - extract from capture group [2]
  const knownLocationMatches: Match[] = [];
  Object.entries(patterns.locations).forEach(([placeName, pattern]) => {
    const matches = safeExec(pattern, text);
    for (const match of matches) {
      location = placeName;
      const actualText = match[2] || match[0];
      const startOffset = match[0].indexOf(actualText);
      const matchObj = {
        start: match.index + startOffset,
        end: match.index + startOffset + actualText.length,
        type: 'location' as const,
        value: placeName,
        text: actualText,
      };
      allMatches.push(matchObj);
      knownLocationMatches.push(matchObj);
    }
  });

  // 4b. Street addresses (Hebrew only) - smart detection AFTER known locations
  // Match Hebrew words after "ב" that aren't known locations or common words
  if (language === 'he') {
    // Common Hebrew words starting with "ב" that are NOT street names
    // NOTE: Don't include time numbers (בחמש, בשש, etc.) - they should be parsed as times
    const commonWords = [
      'בבוקר', 'בצהריים', 'בערב', 'בלילה', 'באחר', // time words  
      'בשעה', // "at hour" - but NOT the numbers themselves
      'בלי', 'בגדים', 'בגד', 'בעד', 'בעוד', 'בכל', 'בזמן', 'במקום', // common prepositions/words
      'ביום', 'בחודש', 'בשנה', 'בשבוע', // date words
      'בקשר', 'באמצעות', 'בעזרת', 'בעקבות', // connecting words
      'בדיוק', 'בערך', 'בכלל', 'בדרך', 'בעיקר', // adverbs
      'בטוח', 'במיוחד', 'במקרה', 'בהחלט', // more common words
      'באמת', 'בעצם', 'בקיצור', 'בסוף', 'בתחילה', // discourse markers
      'להביא', 'להזכיר', 'להוריד', 'להעלות' // verbs (shouldn't match but just in case)
    ];
    
    // Pattern: (start or space) + ב + Hebrew letters (3-20 chars) + optional space + optional number
    const streetPattern = /(?:^|[\s])(ב([א-ת]{3,20})(?:\s+(\d{1,4}))?(?=\s|$))/g;
    const streetMatches = safeExec(streetPattern, text);
    for (const match of streetMatches) {
      const streetName = match[2]; // Group 2 is the street name without "ב"
      const number = match[3]; // Group 3 is the optional number
      const fullMatch = match[1]; // Group 1 is the complete match including "ב"
      const fullMatchLower = fullMatch.toLowerCase();
      
      // Skip if it's a common word
      if (commonWords.some(word => fullMatchLower === word || fullMatchLower.startsWith(word + ' '))) {
        continue;
      }
      
      // Find the actual start position of "ב" (accounting for preceding whitespace)
      const actualStart = match.index + match[0].indexOf(fullMatch);
      
      // Check if this overlaps with a known location
      const overlapsKnown = knownLocationMatches.some(
        km => actualStart < km.end && (actualStart + fullMatch.length) > km.start
      );
      
      // Only add if it's not a known location AND has a number (more likely to be an address)
      // OR if it doesn't overlap and is not a common word
      if (!overlapsKnown && number) {
        const fullAddress = `${streetName} ${number}`;
        location = fullAddress;
        allMatches.push({
          start: actualStart,
          end: actualStart + fullMatch.length,
          type: 'location',
          value: fullAddress,
          text: fullMatch,
        });
      }
    }
  }

  // 5. Time (HH:MM and written times)
  // First try numeric times
  const timeMatches = safeExec(patterns.time, text);
  for (const match of timeMatches) {
    // English: /at\s+(\d{1,2}):(\d{2}).../ -> groups [1] and [2]
    // Hebrew: /(^|[\s])(?:בשעה|ב-?|ב)\s*(\d{1,2}):(\d{2})/ -> groups [2] and [3]
    
    // Determine which groups have the time
    let hourStr, minuteStr;
    if (match[1] && match[2] && !match[3]) {
      // English pattern: groups 1 and 2
      hourStr = match[1];
      minuteStr = match[2];
    } else if (match[2] && match[3]) {
      // Hebrew pattern: groups 2 and 3
      hourStr = match[2];
      minuteStr = match[3];
    } else {
      continue; // Skip if we can't determine the pattern
    }
    
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      specificTime = { hour, minute };
      // Find the actual time string (HH:MM part)
      const timeStr = `${hourStr}:${minuteStr}`;
      const startOffset = match[0].indexOf(timeStr);
      allMatches.push({
        start: match.index + startOffset,
        end: match.index + startOffset + timeStr.length,
        type: 'time',
        value: specificTime,
        text: timeStr,
      });
    }
  }
  
  // Try written times if no numeric time found yet
  if (!specificTime) {
    const writtenTimeMatch = parseWrittenTime(text, language);
    if (writtenTimeMatch) {
      specificTime = writtenTimeMatch.time;
      // Add the written time to matches for highlighting
      allMatches.push({
        start: writtenTimeMatch.start,
        end: writtenTimeMatch.end,
        type: 'time',
        value: writtenTimeMatch.time,
        text: writtenTimeMatch.text,
      });
    }
  }

  // 6. Transport actions
  patterns.transport.lastIndex = 0;
  if (patterns.transport.test(text)) {
    hasTransportAction = true;
  }

  // 7. Recurring patterns - detect and highlight
  // IMPORTANT: Check multiple days pattern FIRST, then other specific patterns
  
  // First, check for multiple days pattern (e.g., "כל יום שני וחמישי")
  // Only available in Hebrew patterns
  const multiDaysPattern = language === 'he' ? HEBREW_PATTERNS.recurring.multipleDays : null;
  if (multiDaysPattern) {
    multiDaysPattern.lastIndex = 0;
    const multiMatch = multiDaysPattern.exec(text);
    if (multiMatch) {
      // Extract weekday numbers from the matched text
      const matchedText = multiMatch[0];
      const dayMap: Record<string, number> = {
        'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3,
        'חמישי': 4, 'שישי': 5, 'שבת': 6
      };
      
      for (const [dayName, dayNum] of Object.entries(dayMap)) {
        if (matchedText.includes(dayName)) {
          if (!detectedWeekdays.includes(dayNum)) {
            detectedWeekdays.push(dayNum);
          }
        }
      }
      
      if (detectedWeekdays.length > 1) {
        detectedRecurring = 'weekdays';
        // Add single match for the ENTIRE phrase
        allMatches.push({
          start: multiMatch.index,
          end: multiMatch.index + matchedText.length,
          type: 'recurring',
          value: 'weekdays',
          text: matchedText,
        });
      }
    }
  }
  
  // Only check individual patterns if we didn't find multiple days
  if (detectedWeekdays.length <= 1) {
    // Map of pattern key to RecurringPattern value
    const recurringMap: Record<string, RecurringPattern> = {
      // Specific weekdays FIRST
      sunday: 'weekday-0',
      monday: 'weekday-1',
      tuesday: 'weekday-2',
      wednesday: 'weekday-3',
      thursday: 'weekday-4',
      friday: 'weekday-5',
      saturday: 'weekday-6',
      // Time-of-day specific
      morning: 'morning',
      evening: 'evening',
      afternoon: 'afternoon',
      night: 'night',
      // General patterns LAST
      daily: 'daily',
      weekly: 'weekly',
      monthly: 'monthly',
    };
    
    // Check each recurring pattern type IN ORDER (specific to general)
    for (const [key, recurringType] of Object.entries(recurringMap)) {
      const pattern = patterns.recurring[key];
      if (!pattern) continue;

      const matches = safeExec(pattern, text);
      for (const match of matches) {
        // If it's a weekday, collect it
        if (recurringType.startsWith('weekday-')) {
          const dayNum = parseInt(recurringType.split('-')[1]);
          if (!detectedWeekdays.includes(dayNum)) {
            detectedWeekdays.push(dayNum);
          }
        }

        // Keep track of the most specific recurring pattern found
        if (detectedRecurring === 'none' ||
            recurringType.startsWith('weekday-') ||
            (recurringType !== 'daily' && recurringType !== 'weekly' && recurringType !== 'monthly')) {
          detectedRecurring = recurringType;
        }

        const actualText = match[2] || match[0];
        const startOffset = match[0].indexOf(actualText);
        allMatches.push({
          start: match.index + startOffset,
          end: match.index + startOffset + actualText.length,
          type: 'recurring',
          value: recurringType,
          text: actualText,
        });
      }
    }
    
    // Set final pattern based on detected weekdays
    if (detectedWeekdays.length === 1) {
      detectedRecurring = `weekday-${detectedWeekdays[0]}` as RecurringPattern;
    }
  }

  // 8. Task type keywords
  patterns.reminder.lastIndex = 0;
  if (patterns.reminder.test(text)) {
    hasReminderKeyword = true;
  }
  patterns.task.lastIndex = 0;
  if (patterns.task.test(text)) {
    hasTaskKeyword = true;
  }

  // Sort matches by start position
  allMatches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches
  const filteredMatches = allMatches.filter((match, index) => {
    if (index === 0) return true;
    const prevMatch = allMatches[index - 1];
    return match.start >= prevMatch.end;
  });

  // Build segments
  const segments: ParsedSegment[] = [];
  let lastEnd = 0;

  filteredMatches.forEach((match) => {
    // Add text before match
    if (match.start > lastEnd) {
      segments.push({
        text: text.substring(lastEnd, match.start),
        type: 'text',
        start: lastEnd,
        end: match.start,
      });
    }

    // Add matched segment
    segments.push({
      text: match.text,
      type: match.type,
      value: match.value as any, // Type assertion for complex union type
      start: match.start,
      end: match.end,
    });

    lastEnd = match.end;
  });

  // Add remaining text
  if (lastEnd < text.length) {
    segments.push({
      text: text.substring(lastEnd),
      type: 'text',
      start: lastEnd,
      end: text.length,
    });
  }

  // Apply inference
  const timeBucket = inferTimeBucket({
    specificDate,
    hasToday,
    hasTomorrow,
    hasThisWeek,
    hasNextWeek,
  });

  const { owner, involved } = separateOwnerAndInvolved(mentionedMembers);

  const drivingInfo = inferDrivingNeeds({
    involvedMembers: involved,
    location,
    hasTransportAction,
  });

  const taskTypeInfo = inferTaskType({
    hasReminderKeyword,
    hasTaskKeyword,
    hasOwner: owner !== undefined,
    hasAction: hasTransportAction || hasTaskKeyword,
  });

  const recurring = detectedRecurring;

  // Build tags
  const tags: ExtractedTag[] = [];
  let tagId = 0;

  if (timeBucket !== 'unlabeled') {
    tags.push({
      id: `tag-${tagId++}`,
      type: 'timeBucket',
      displayText: timeBucket,
      value: timeBucket,
      emoji: getTagEmoji('timeBucket'),
      editable: true,
    });
  }

  if (specificTime) {
    tags.push({
      id: `tag-${tagId++}`,
      type: 'time',
      displayText: `${String(specificTime.hour).padStart(2, '0')}:${String(specificTime.minute).padStart(2, '0')}`,
      value: specificTime,
      emoji: getTagEmoji('time'),
      editable: true,
    });
  }

  if (owner) {
    tags.push({
      id: `tag-${tagId++}`,
      type: 'owner',
      displayText: owner,
      value: owner,
      emoji: getTagEmoji('owner'),
      editable: true,
    });
  }

  involved.forEach((member) => {
    tags.push({
      id: `tag-${tagId++}`,
      type: 'involved',
      displayText: member,
      value: member,
      emoji: getTagEmoji('involved'),
      editable: true,
    });
  });

  if (location) {
    const place = getKnownPlace(location);
    tags.push({
      id: `tag-${tagId++}`,
      type: 'location',
      displayText: place?.name || location,
      value: location,
      emoji: getTagEmoji('location'),
      editable: true,
    });
  }

  if (drivingInfo.requiresDriving && drivingInfo.drivingDuration) {
    tags.push({
      id: `tag-${tagId++}`,
      type: 'transport',
      displayText: `${drivingInfo.drivingDuration}min`,
      value: drivingInfo.drivingDuration,
      emoji: getTagEmoji('transport'),
      editable: false,
    });
  }

  if (priority) {
    tags.push({
      id: `tag-${tagId++}`,
      type: 'priority',
      displayText: priority,
      value: priority,
      emoji: getTagEmoji('priority'),
      editable: true,
    });
  }

  if (recurring !== 'none') {
    // Format display text for recurring patterns
    let recurringDisplayText: string = recurring;
    let recurringValue: RecurringPattern | number[] = recurring;
    
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    
    if (recurring === 'weekdays' && detectedWeekdays.length > 0) {
      // Multiple weekdays - show them all compactly
      const dayNamesShort = detectedWeekdays
        .sort((a, b) => a - b)
        .map(num => dayNames[num])
        .join(', ');
      recurringDisplayText = dayNamesShort;
      recurringValue = detectedWeekdays; // Store as array
    } else if (recurring.startsWith('weekday-')) {
      // Single weekday
      const dayNum = parseInt(recurring.split('-')[1]);
      recurringDisplayText = `יום ${dayNames[dayNum]}`;
    } else if (recurring === 'morning') {
      recurringDisplayText = 'בוקר';
    } else if (recurring === 'evening') {
      recurringDisplayText = 'ערב';
    } else if (recurring === 'afternoon') {
      recurringDisplayText = 'צהריים';
    } else if (recurring === 'night') {
      recurringDisplayText = 'לילה';
    } else if (recurring === 'daily') {
      recurringDisplayText = 'יומי';
    } else if (recurring === 'weekly') {
      recurringDisplayText = 'שבועי';
    } else if (recurring === 'monthly') {
      recurringDisplayText = 'חודשי';
    }
    
    tags.push({
      id: `tag-${tagId++}`,
      type: 'recurring',
      displayText: recurringDisplayText,
      value: recurringValue,
      emoji: getTagEmoji('recurring'),
      editable: true,
    });
  }

  // Add category tag if detected from AI
  if (categoryName && categoryIcon) {
    tags.push({
      id: `tag-${tagId++}`,
      type: 'tag',
      displayText: categoryName,
      value: categoryName,
      emoji: categoryIcon,
      editable: false,
    });
  }

  return {
    rawText: text,
    segments,
    tags,
    timeBucket,
    specificTime,
    specificDate,
    owner,
    involvedMembers: involved,
    location,
    priority,
    recurring,
    isReminder: taskTypeInfo.isReminder,
    requiresDriving: drivingInfo.requiresDriving,
    drivingDuration: drivingInfo.drivingDuration,
    drivingFrom: drivingInfo.drivingFrom,
    drivingTo: drivingInfo.drivingTo,
  };
}

function createEmptyTask(text: string): ParsedTask {
  return {
    rawText: text,
    segments: text ? [{ text, type: 'text', start: 0, end: text.length }] : [],
    tags: [],
    timeBucket: 'unlabeled',
    involvedMembers: [],
    isReminder: false,
    requiresDriving: false,
    drivingFrom: 'home',
  };
}
