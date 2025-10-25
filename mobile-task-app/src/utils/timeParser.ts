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
      time: { hour, minute: 0 },
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
      time: { hour, minute },
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
      time: { hour, minute: 0 },
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
  // Pattern: "בשמונה בבוקר" (at eight in the morning)
  const morningPattern = /ב(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)\s+בבוקר/g;
  let match = morningPattern.exec(text);
  
  if (match) {
    const hour = HEBREW_NUMBERS[match[1]];
    return {
      time: { hour, minute: 0 },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // Pattern: "שמונה בערב" (eight in the evening) = 20:00
  const eveningPattern = /(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)\s+בערב/g;
  match = eveningPattern.exec(text);
  
  if (match) {
    let hour = HEBREW_NUMBERS[match[1]];
    // Evening time: add 12 if hour < 12
    if (hour < 12) hour += 12;
    return {
      time: { hour, minute: 0 },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // Pattern: "שמונה בבוקר" (eight in the morning) - without ב prefix
  const morningPattern2 = /(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)\s+בבוקר/g;
  match = morningPattern2.exec(text);
  
  if (match) {
    const hour = HEBREW_NUMBERS[match[1]];
    return {
      time: { hour, minute: 0 },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // Pattern: "שמונה בצהריים" (eight at noon)
  const noonPattern = /(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)\s+בצהריים/g;
  match = noonPattern.exec(text);
  
  if (match) {
    let hour = HEBREW_NUMBERS[match[1]];
    // Noon time: if hour < 12, add 12
    if (hour < 12) hour += 12;
    return {
      time: { hour, minute: 0 },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // Pattern: "8 ורבע לתשע" (8 and a quarter to 9 = 8:45)
  // CHECK THIS FIRST before simple quarter pattern!
  const digitQuarterToPattern = /(\d{1,2})\s+ורבע\s+ל(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)/g;
  match = digitQuarterToPattern.exec(text);
  
  if (match) {
    const hour = parseInt(match[1]);
    if (hour >= 0 && hour < 24) {
      return {
        time: { hour, minute: 45 },
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
        time: { hour, minute: 30 },
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
        time: { hour, minute: 15 },
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      };
    }
  }
  
  // Pattern: "בשמונה וחצי" (at eight and a half)
  const halfPattern = /ב(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)\s+וחצי/g;
  match = halfPattern.exec(text);
  
  if (match) {
    const hour = HEBREW_NUMBERS[match[1]];
    return {
      time: { hour, minute: 30 },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // Pattern: "שמונה וחצי" (eight and a half) - without ב prefix
  const halfPattern2 = /(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)\s+וחצי/g;
  match = halfPattern2.exec(text);
  
  if (match) {
    const hour = HEBREW_NUMBERS[match[1]];
    return {
      time: { hour, minute: 30 },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // Pattern: "בשמונה ורבע" (at eight and a quarter)
  const quarterPattern = /ב(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)\s+ורבע/g;
  match = quarterPattern.exec(text);
  
  if (match) {
    const hour = HEBREW_NUMBERS[match[1]];
    return {
      time: { hour, minute: 15 },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // Pattern: "תשע ורבע" (nine and a quarter) - without ב prefix
  const quarterPattern2 = /(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)\s+ורבע/g;
  match = quarterPattern2.exec(text);
  
  if (match) {
    const hour = HEBREW_NUMBERS[match[1]];
    return {
      time: { hour, minute: 15 },
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    };
  }
  
  // Pattern: "בשמונה" (at eight) - simple form
  const simplePattern = /ב(אפס|אחד|אחת|שתיים|שלוש|ארבע|חמש|שש|שבע|שמונה|תשע|עשר|אחד עשרה|שתיים עשרה)(?!\s)/g;
  match = simplePattern.exec(text);
  
  if (match) {
    const hour = HEBREW_NUMBERS[match[1]];
    return {
      time: { hour, minute: 0 },
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
