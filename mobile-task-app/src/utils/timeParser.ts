// Time Parser - Converts written times to TimeValue

import { TimeValue } from '../types/mobileTask';

export interface WrittenTimeMatch {
  time: TimeValue;
  text: string;
  start: number;
  end: number;
}

// English number words to digits
const ENGLISH_NUMBERS: Record<string, number> = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
  'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
  'ten': 10, 'eleven': 11, 'twelve': 12,
};

// Hebrew number words to digits
const HEBREW_NUMBERS: Record<string, number> = {
  'אפס': 0, 'אחד': 1, 'אחת': 1, 'שתיים': 2, 'שלוש': 3, 'ארבע': 4,
  'חמש': 5, 'שש': 6, 'שבע': 7, 'שמונה': 8, 'תשע': 9,
  'עשר': 10, 'אחד עשרה': 11, 'שתיים עשרה': 12,
};

/**
 * Parse English written time like "eight pm" or "three thirty" with position info
 */
export function parseEnglishWrittenTime(text: string): WrittenTimeMatch | null {
  // Pattern: "eight pm", "three am"
  const amPmPattern = /(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(am|pm)/gi;
  let match = amPmPattern.exec(text);
  
  if (match) {
    let hour = ENGLISH_NUMBERS[match[1].toLowerCase()];
    const isPM = match[2].toLowerCase() === 'pm';
    
    // Convert to 24-hour format
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    
    return {
      time: { hours: hour, minutes: 0, displayText: `${hour.toString().padStart(2, '0')}:00` },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // Pattern: "six fifteen", "three thirty", "eight forty-five"
  const compoundPattern = /(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(thirty|fifteen|forty-five|o'clock)/gi;
  match = compoundPattern.exec(text);
  
  if (match) {
    const hour = ENGLISH_NUMBERS[match[1].toLowerCase()];
    let minute = 0;
    
    const minuteWord = match[2].toLowerCase();
    if (minuteWord === 'thirty') minute = 30;
    else if (minuteWord === 'fifteen') minute = 15;
    else if (minuteWord === 'forty-five') minute = 45;
    
    return {
      time: { hours: hour, minutes: minute, displayText: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // Pattern: "at eight", "on eight" - standalone hour with time preposition
  const standalonePattern = /(at|on)\s+(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?!\s+(?:am|pm|thirty|fifteen|forty-five|o'clock))/gi;
  match = standalonePattern.exec(text);
  
  if (match) {
    const hour = ENGLISH_NUMBERS[match[2].toLowerCase()];
    
    return {
      time: { hours: hour, minutes: 0, displayText: `${hour.toString().padStart(2, '0')}:00` },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  return null;
}

/**
 * Parse Hebrew written time like "בשמונה" or "בשמונה וחצי" with position info
 */
export function parseHebrewWrittenTime(text: string): WrittenTimeMatch | null {
  // PRIORITY 1: Check for context-aware patterns with time-of-day indicators first
  
  // Pattern: "ב8 בערב" or "בשעה 8 בערב" (digit + evening context)
  const digitEveningPattern = /(?:בשעה\s+|ב)(\d{1,2})(?:\s+וחצי)?\s+בערב/g;
  let match = digitEveningPattern.exec(text);
  
  if (match) {
    let hour = parseInt(match[1]);
    const hasHalf = match[0].includes('וחצי');
    const minutes = hasHalf ? 30 : 0;
    
    if (hour >= 0 && hour < 24) {
      // Evening time: add 12 if hour < 12
      if (hour < 12) hour += 12;
      return {
        time: { hours: hour, minutes, displayText: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` },
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      };
    }
  }
  
  // Pattern: "בשמונה בבוקר" or "בשמונה בערב" (Hebrew number with time context)
  const hebrewWithContextPattern = /ב(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)(?:\s+וחצי)?\s+(בבוקר|בערב|בצהריים)/g;
  match = hebrewWithContextPattern.exec(text);
  
  if (match) {
    let hour = HEBREW_NUMBERS[match[1]];
    const hasHalf = match[0].includes('וחצי');
    const minutes = hasHalf ? 30 : 0;
    const timeOfDay = match[2];
    
    // Add 12 for evening/noon times
    if ((timeOfDay === 'בערב' || timeOfDay === 'בצהריים') && hour < 12) {
      hour += 12;
    }
    
    return {
      time: { hours: hour, minutes, displayText: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // Pattern: "שמונה בערב" (Hebrew number + evening, without ב prefix)
  const hebrewEveningPattern = /(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)(?:\s+וחצי)?\s+בערב/g;
  match = hebrewEveningPattern.exec(text);
  
  if (match) {
    let hour = HEBREW_NUMBERS[match[1]];
    const hasHalf = match[0].includes('וחצי');
    const minutes = hasHalf ? 30 : 0;
    
    // Evening time: add 12 if hour < 12
    if (hour < 12) hour += 12;
    return {
      time: { hours: hour, minutes, displayText: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // Pattern: "שמונה בבוקר" (Hebrew number + morning, without ב prefix)
  const hebrewMorningPattern = /(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)\s+בבוקר/g;
  match = hebrewMorningPattern.exec(text);
  
  if (match) {
    const hour = HEBREW_NUMBERS[match[1]];
    return {
      time: { hours: hour, minutes: 0, displayText: `${hour.toString().padStart(2, '0')}:00` },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // PRIORITY 2: Compound patterns (half, quarter) without context
  
  // Pattern: "8 ורבע לתשע" (8 and a quarter to 9 = 8:45)
  const digitQuarterToPattern = /(\d{1,2})\s+ורבע\s+ל(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)/g;
  match = digitQuarterToPattern.exec(text);
  
  if (match) {
    const hour = parseInt(match[1]);
    if (hour >= 0 && hour < 24) {
      return {
        time: { hours: hour, minutes: 45, displayText: `${hour.toString().padStart(2, '0')}:45` },
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      };
    }
  }
  
  // Pattern: "8 וחצי" or "בשעה 8 וחצי" (digit + and a half)
  const digitHalfPattern = /(?:בשעה\s+)?(\d{1,2})\s+וחצי/g;
  match = digitHalfPattern.exec(text);
  
  if (match) {
    const hour = parseInt(match[1]);
    if (hour >= 0 && hour < 24) {
      return {
        time: { hours: hour, minutes: 30, displayText: `${hour.toString().padStart(2, '0')}:30` },
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      };
    }
  }
  
  // Pattern: "8 ורבע" or "בשעה 8 ורבע" (digit + and a quarter)
  const digitQuarterPattern = /(?:בשעה\s+)?(\d{1,2})\s+ורבע/g;
  match = digitQuarterPattern.exec(text);
  
  if (match) {
    const hour = parseInt(match[1]);
    if (hour >= 0 && hour < 24) {
      return {
        time: { hours: hour, minutes: 15, displayText: `${hour.toString().padStart(2, '0')}:15` },
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      };
    }
  }
  
  // Pattern: "בשמונה וחצי" or "בשמונה ורבע" (at eight and a half/quarter)
  const hebrewWithModifierPattern = /ב(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)\s+(וחצי|ורבע)/g;
  match = hebrewWithModifierPattern.exec(text);
  
  if (match) {
    const hour = HEBREW_NUMBERS[match[1]];
    const modifier = match[2];
    const minutes = modifier === 'וחצי' ? 30 : 15;
    return {
      time: { hours: hour, minutes, displayText: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // Pattern: "שמונה וחצי" or "תשע ורבע" (Hebrew number + modifier, without ב prefix)
  const hebrewWithModifierPattern2 = /(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)\s+(וחצי|ורבע)/g;
  match = hebrewWithModifierPattern2.exec(text);
  
  if (match) {
    const hour = HEBREW_NUMBERS[match[1]];
    const modifier = match[2];
    const minutes = modifier === 'וחצי' ? 30 : 15;
    return {
      time: { hours: hour, minutes, displayText: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // PRIORITY 3: Simple standalone patterns (no modifiers, no context)
  
  // Pattern: "בשעה 8" or "ב8" (digit hour without context)
  const digitStandalonePattern = /(?:בשעה\s+|ב)(\d{1,2})(?!\s*(?:וחצי|ורבע|בערב|בבוקר|:|-))/g;
  match = digitStandalonePattern.exec(text);
  
  if (match) {
    const hour = parseInt(match[1]);
    if (hour >= 0 && hour < 24) {
      return {
        time: { hours: hour, minutes: 0, displayText: `${hour.toString().padStart(2, '0')}:00` },
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      };
    }
  }
  
  // Pattern: "בשמונה" (at eight with ב prefix) - simple form without modifiers or context
  const simplePattern = /ב(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)(?!\s+(?:וחצי|ורבע|בערב|בבוקר|בצהריים))/g;
  match = simplePattern.exec(text);
  
  if (match) {
    const hour = HEBREW_NUMBERS[match[1]];
    return {
      time: { hours: hour, minutes: 0, displayText: `${hour.toString().padStart(2, '0')}:00` },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  return null;
}

/**
 * Parse any written time from text (English or Hebrew) with position info
 */
export function parseWrittenTime(text: string, language: 'he' | 'en'): WrittenTimeMatch | null {
  if (language === 'he') {
    return parseHebrewWrittenTime(text);
  } else {
    return parseEnglishWrittenTime(text);
  }
}
