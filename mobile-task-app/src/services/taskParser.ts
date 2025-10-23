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

interface Match {
  start: number;
  end: number;
  type: ParsedSegment['type'];
  value: Date | TimeValue | FamilyMemberName | PriorityLevel | RecurringPattern | string | boolean | number;
  text: string;
}

export function parseTask(text: string): ParsedTask {
  if (!text || text.trim().length === 0) {
    return createEmptyTask(text);
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
  let hasDaily = false;
  let hasWeekly = false;
  let hasMonthly = false;

  // 1. Priority (P1, P2, P3)
  let match: RegExpExecArray | null;
  const priorityPattern = new RegExp(PRIORITY_PATTERN);
  while ((match = priorityPattern.exec(text)) !== null) {
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
  patterns.today.lastIndex = 0;
  while ((match = patterns.today.exec(text)) !== null) {
    hasToday = true;
    const actualText = match[2] || match[0]; // group 2 is the actual word
    const startOffset = match[0].indexOf(actualText);
    allMatches.push({
      start: match.index + startOffset,
      end: match.index + startOffset + actualText.length,
      type: 'timeBucket',
      value: 'today',
      text: actualText,
    });
  }

  patterns.tomorrow.lastIndex = 0;
  while ((match = patterns.tomorrow.exec(text)) !== null) {
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

  patterns.thisWeek.lastIndex = 0;
  while ((match = patterns.thisWeek.exec(text)) !== null) {
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

  patterns.nextWeek.lastIndex = 0;
  while ((match = patterns.nextWeek.exec(text)) !== null) {
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
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
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

  // 4. Locations - extract from capture group [2]
  Object.entries(patterns.locations).forEach(([placeName, pattern]) => {
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      location = placeName;
      const actualText = match[2] || match[0];
      const startOffset = match[0].indexOf(actualText);
      allMatches.push({
        start: match.index + startOffset,
        end: match.index + startOffset + actualText.length,
        type: 'location',
        value: placeName,
        text: actualText,
      });
    }
  });

  // 5. Time (HH:MM)
  patterns.time.lastIndex = 0;
  while ((match = patterns.time.exec(text)) !== null) {
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

  // 6. Transport actions
  patterns.transport.lastIndex = 0;
  if (patterns.transport.test(text)) {
    hasTransportAction = true;
  }

  // 7. Recurring patterns
  if (patterns.recurring.daily.test(text)) {
    hasDaily = true;
  }
  if (patterns.recurring.weekly.test(text)) {
    hasWeekly = true;
  }
  if (patterns.recurring.monthly.test(text)) {
    hasMonthly = true;
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

  const recurring = inferRecurring({ hasDaily, hasWeekly, hasMonthly });

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
    tags.push({
      id: `tag-${tagId++}`,
      type: 'recurring',
      displayText: recurring,
      value: recurring,
      emoji: getTagEmoji('recurring'),
      editable: true,
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
