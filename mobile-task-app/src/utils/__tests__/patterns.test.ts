import { describe, it, expect } from 'vitest';
import {
  HEBREW_PATTERNS,
  extractMultipleWeekdays,
  detectLanguage,
  getFamilyMember,
  getKnownPlace,
  detectTransportAction,
} from '../patterns';
import { parseTask } from '../../services/taskParser';

describe('Hebrew Patterns', () => {
  describe('Multiple Recurring Days', () => {
    it('should match "כל יום שני וחמישי"', () => {
      const text = 'כל יום שני וחמישי בבוקר';
      const match = text.match(HEBREW_PATTERNS.recurring.multipleDays);
      expect(match).toBeTruthy();
      expect(match![0]).toBe('כל יום שני וחמישי');
    });

    it('should match "שני וחמישי" without "כל יום"', () => {
      const text = 'שני וחמישי ללכת לריצה';
      const match = text.match(HEBREW_PATTERNS.recurring.multipleDays);
      expect(match).toBeTruthy();
      expect(match![0]).toBe('שני וחמישי');
    });

    it('should match "ראשון ושלישי"', () => {
      const text = 'ראשון ושלישי בערב';
      const match = text.match(HEBREW_PATTERNS.recurring.multipleDays);
      expect(match).toBeTruthy();
      expect(match![0]).toBe('ראשון ושלישי');
    });

    it('should match three days "שני, רביעי וחמישי"', () => {
      const text = 'כל יום שני, רביעי וחמישי';
      const match = text.match(HEBREW_PATTERNS.recurring.multipleDays);
      expect(match).toBeTruthy();
      // Pattern will match the connected days
      expect(match![0]).toContain('שני');
    });

    it('should NOT match single day', () => {
      const text = 'כל יום שני בבוקר';
      const match = text.match(HEBREW_PATTERNS.recurring.multipleDays);
      expect(match).toBeNull();
    });
  });

  describe('extractMultipleWeekdays', () => {
    it('should extract [1, 4] from "שני וחמישי"', () => {
      const result = extractMultipleWeekdays('שני וחמישי');
      expect(result).toEqual([1, 4]);
    });

    it('should extract [0, 2] from "ראשון ושלישי"', () => {
      const result = extractMultipleWeekdays('כל יום ראשון ושלישי');
      expect(result).toEqual([0, 2]);
    });

    it('should extract [1, 3, 4] from "שני, רביעי וחמישי"', () => {
      const result = extractMultipleWeekdays('שני רביעי וחמישי');
      expect(result).toEqual([1, 3, 4]);
    });

    it('should return null for single day', () => {
      const result = extractMultipleWeekdays('כל יום שני');
      expect(result).toBeNull();
    });

    it('should return null for no match', () => {
      const result = extractMultipleWeekdays('בבוקר ללכת לריצה');
      expect(result).toBeNull();
    });
  });

  describe('Family Members with Punctuation', () => {
    it('should match "יעל,"', () => {
      const text = 'עם יעל, אלון';
      const match = text.match(HEBREW_PATTERNS.familyMembers.yael);
      expect(match).toBeTruthy();
      expect(match![0]).toContain('יעל');
    });

    it('should match "אלון)"', () => {
      const text = 'לקחת את הילדים (יעל ואלון)';
      const match = text.match(HEBREW_PATTERNS.familyMembers.alon);
      expect(match).toBeTruthy();
    });

    it('should match "הילי."', () => {
      const text = 'עם הילי.';
      const match = text.match(HEBREW_PATTERNS.familyMembers.hilly);
      expect(match).toBeTruthy();
    });

    it('should match "לאלה:"', () => {
      const text = 'להגיד לאלה: תזכורת';
      const match = text.match(HEBREW_PATTERNS.familyMembers.ella);
      expect(match).toBeTruthy();
    });

    it('should match with Hebrew prefix "את יעל"', () => {
      const text = 'לקחת את יעל לגן';
      const match = text.match(HEBREW_PATTERNS.familyMembers.yael);
      expect(match).toBeTruthy();
    });
  });

  describe('Time Buckets', () => {
    it('should match "היום"', () => {
      const text = 'היום בבוקר';
      const match = text.match(HEBREW_PATTERNS.today);
      expect(match).toBeTruthy();
      expect(match![2]).toBe('היום');
    });

    it('should match "מחר"', () => {
      const text = 'מחר בערב';
      const match = text.match(HEBREW_PATTERNS.tomorrow);
      expect(match).toBeTruthy();
      expect(match![2]).toBe('מחר');
    });

    it('should match "השבוע"', () => {
      const text = 'השבוע לקנות חלב';
      const match = text.match(HEBREW_PATTERNS.thisWeek);
      expect(match).toBeTruthy();
      expect(match![2]).toBe('השבוע');
    });

    it('should match "שבוע הבא"', () => {
      const text = 'שבוע הבא פגישה';
      const match = text.match(HEBREW_PATTERNS.nextWeek);
      expect(match).toBeTruthy();
      expect(match![2]).toBe('שבוע הבא');
    });
  });

  describe('Time Expressions', () => {
    it('should match "בשעה 08:00"', () => {
      const text = 'בשעה 08:00 לצאת לריצה';
      const match = text.match(HEBREW_PATTERNS.time);
      expect(match).toBeTruthy();
      expect(match![2]).toBe('08');
      expect(match![3]).toBe('00');
    });

    it('should match "ב-16:30"', () => {
      const text = 'ב-16:30 איסוף';
      const match = text.match(HEBREW_PATTERNS.time);
      expect(match).toBeTruthy();
      expect(match![2]).toBe('16');
      expect(match![3]).toBe('30');
    });

    it('should match "ב14:00"', () => {
      const text = 'ב14:00 ארוחה';
      const match = text.match(HEBREW_PATTERNS.time);
      expect(match).toBeTruthy();
      expect(match![2]).toBe('14');
      expect(match![3]).toBe('00');
    });
  });

  describe('Locations', () => {
    it('should match "לגן"', () => {
      const text = 'לקחת את הילדים לגן';
      const match = text.match(HEBREW_PATTERNS.locations.kindergarten);
      expect(match).toBeTruthy();
      expect(match![2]).toBe('לגן');
    });

    it('should match "בית ספר"', () => {
      const text = 'איסוף מבית ספר';
      const match = text.match(HEBREW_PATTERNS.locations.school);
      expect(match).toBeTruthy();
    });

    it('should match "לרופא שיניים"', () => {
      const text = 'ללכת לרופא שיניים';
      const match = text.match(HEBREW_PATTERNS.locations.dentist);
      expect(match).toBeTruthy();
      expect(match![2]).toBe('לרופא שיניים');
    });

    it('should match "בבריכה"', () => {
      const text = 'השיעור בבריכה';
      const match = text.match(HEBREW_PATTERNS.locations.pool);
      expect(match).toBeTruthy();
    });
  });

  describe('Recurring Patterns', () => {
    it('should match "כל יום"', () => {
      const text = 'כל יום בבוקר';
      const match = text.match(HEBREW_PATTERNS.recurring.daily);
      expect(match).toBeTruthy();
      expect(match![2]).toBe('כל יום');
    });

    it('should match "כל בוקר"', () => {
      const text = 'כל בוקר לריצה';
      const match = text.match(HEBREW_PATTERNS.recurring.morning);
      expect(match).toBeTruthy();
      expect(match![2]).toBe('כל בוקר');
    });

    it('should match "כל ערב"', () => {
      const text = 'כל ערב להתקלח';
      const match = text.match(HEBREW_PATTERNS.recurring.evening);
      expect(match).toBeTruthy();
    });

    it('should match "כל יום שני"', () => {
      const text = 'כל יום שני בבוקר';
      const match = text.match(HEBREW_PATTERNS.recurring.monday);
      expect(match).toBeTruthy();
      expect(match![2]).toBe('כל יום שני');
    });

    it('should match "כל שבת"', () => {
      const text = 'כל שבת ארוחה משפחתית';
      const match = text.match(HEBREW_PATTERNS.recurring.saturday);
      expect(match).toBeTruthy();
    });
  });

  describe('Transport Actions', () => {
    it('should match "לקחת"', () => {
      const text = 'לקחת את הילדים';
      const match = text.match(HEBREW_PATTERNS.transport);
      expect(match).toBeTruthy();
    });

    it('should match "להסיע"', () => {
      const text = 'להסיע את יעל';
      const match = text.match(HEBREW_PATTERNS.transport);
      expect(match).toBeTruthy();
    });

    it('should match "לאסוף"', () => {
      const text = 'לאסוף מהגן';
      const match = text.match(HEBREW_PATTERNS.transport);
      expect(match).toBeTruthy();
    });

    it('should detect transport action in "לקחת את הילדים לגן"', () => {
      const result = detectTransportAction('לקחת את הילדים לגן', 'he');
      expect(result).toBe(true);
    });
  });

  describe('Language Detection', () => {
    it('should detect Hebrew', () => {
      const result = detectLanguage('לקחת את הילדים לגן');
      expect(result).toBe('he');
    });

    it('should detect English', () => {
      const result = detectLanguage('Take the kids to kindergarten');
      expect(result).toBe('en');
    });

    it('should detect Hebrew with mixed content', () => {
      const result = detectLanguage('לקחת את Yael לגן');
      expect(result).toBe('he');
    });
  });

  describe('Family Member Lookup', () => {
    it('should find Yael', () => {
      const member = getFamilyMember('yael');
      expect(member).toBeDefined();
      expect(member?.name).toBe('Yael');
      expect(member?.age).toBe(5.5);
    });

    it('should find Alon', () => {
      const member = getFamilyMember('alon');
      expect(member).toBeDefined();
      expect(member?.name).toBe('Alon');
      expect(member?.needsSupervision).toBe(true);
    });

    it('should find Hilly', () => {
      const member = getFamilyMember('hilly');
      expect(member).toBeDefined();
      expect(member?.isChild).toBe(true);
      expect(member?.needsSupervision).toBe(false); // Independent at 11
    });

    it('should return undefined for unknown name', () => {
      const member = getFamilyMember('unknown');
      expect(member).toBeUndefined();
    });
  });

  describe('Known Place Lookup', () => {
    it('should find kindergarten by Hebrew name', () => {
      const place = getKnownPlace('גן');
      expect(place).toBeDefined();
      expect(place?.name).toBe('kindergarten');
      expect(place?.requiresDriving).toBe(true);
    });

    it('should find school', () => {
      const place = getKnownPlace('school');
      expect(place).toBeDefined();
      expect(place?.drivingTimeFromHome).toBe(10);
    });

    it('should find dentist', () => {
      const place = getKnownPlace('רופא שיניים');
      expect(place).toBeDefined();
      expect(place?.requiresDriving).toBe(true);
    });

    it('should return undefined for unknown place', () => {
      const place = getKnownPlace('לונה פארק');
      expect(place).toBeUndefined();
    });
  });

  describe('Complex Sentences', () => {
    it('should match all patterns in "כל יום שני וחמישי בשעה 08:00 לקחת את יעל לגן"', () => {
      const text = 'כל יום שני וחמישי בשעה 08:00 לקחת את יעל לגן';
      
      // Multiple days
      const multiDays = text.match(HEBREW_PATTERNS.recurring.multipleDays);
      expect(multiDays).toBeTruthy();
      
      // Time
      const time = text.match(HEBREW_PATTERNS.time);
      expect(time).toBeTruthy();
      
      // Family member
      const yael = text.match(HEBREW_PATTERNS.familyMembers.yael);
      expect(yael).toBeTruthy();
      
      // Location
      const kindergarten = text.match(HEBREW_PATTERNS.locations.kindergarten);
      expect(kindergarten).toBeTruthy();
      
      // Transport
      const transport = text.match(HEBREW_PATTERNS.transport);
      expect(transport).toBeTruthy();
    });

    it('should match patterns in "מחר בערב להזכיר לאלה P1"', () => {
      const text = 'מחר בערב להזכיר לאלה P1';
      
      // Tomorrow
      const tomorrow = text.match(HEBREW_PATTERNS.tomorrow);
      expect(tomorrow).toBeTruthy();
      
      // Reminder
      const reminder = text.match(HEBREW_PATTERNS.reminder);
      expect(reminder).toBeTruthy();
      
      // Family member
      const ella = text.match(HEBREW_PATTERNS.familyMembers.ella);
      expect(ella).toBeTruthy();
    });
  });

  describe('Natural Language Time Parsing', () => {
    it('should parse "8 וחצי" as 8:30', () => {
      const result = parseTask('להוציא את אלון מהגן בשעה 8 וחצי בבוקר');
      
      expect(result.specificTime).toBeDefined();
      expect(result.specificTime?.hours).toBe(8);
      expect(result.specificTime?.minutes).toBe(30);
      
      // Should have time tag
      const timeTag = result.tags.find(t => t.type === 'time');
      expect(timeTag).toBeDefined();
      expect(timeTag?.displayText).toBe('08:30');
    });

    it('should parse "8 ורבע" as 8:15', () => {
      const result = parseTask('להוציא את אלון מהגן בשעה 8 ורבע בבוקר');
      
      expect(result.specificTime).toBeDefined();
      expect(result.specificTime?.hours).toBe(8);
      expect(result.specificTime?.minutes).toBe(15);
      
      const timeTag = result.tags.find(t => t.type === 'time');
      expect(timeTag).toBeDefined();
      expect(timeTag?.displayText).toBe('08:15');
    });

    it('should parse "8 ורבע לתשע" as 8:45', () => {
      const result = parseTask('פגישה בשעה 8 ורבע לתשע');
      
      expect(result.specificTime).toBeDefined();
      expect(result.specificTime?.hours).toBe(8);
      expect(result.specificTime?.minutes).toBe(45);
    });

    it('should parse "שמונה וחצי בבוקר" as 8:30', () => {
      const result = parseTask('איסוף בשעה שמונה וחצי בבוקר');
      
      expect(result.specificTime).toBeDefined();
      expect(result.specificTime?.hours).toBe(8);
      expect(result.specificTime?.minutes).toBe(30);
    });

    it('should parse "תשע ורבע" as 9:15', () => {
      const result = parseTask('להגיע בשעה תשע ורבע');
      
      expect(result.specificTime).toBeDefined();
      expect(result.specificTime?.hours).toBe(9);
      expect(result.specificTime?.minutes).toBe(15);
    });

    it('should highlight written time in segments', () => {
      const result = parseTask('להוציא את אלון מהגן בשעה 8 וחצי בבוקר');
      
      // Find the time segment
      const timeSegment = result.segments.find(s => s.type === 'time');
      expect(timeSegment).toBeDefined();
      expect(timeSegment?.text).toContain('8 וחצי');
    });

    it('should handle both numeric time and written time (prefers numeric)', () => {
      const result = parseTask('פגישה ב-14:30 או שלוש וחצי');
      
      // Should prefer the numeric time
      expect(result.specificTime?.hours).toBe(14);
      expect(result.specificTime?.minutes).toBe(30);
    });
    
    it('should parse "בשעה 8" as 8:00 am (without context)', () => {
      const result = parseTask('להוציא את אלון מהגן בשעה 8');
      
      expect(result.specificTime).toBeDefined();
      expect(result.specificTime?.hours).toBe(8);
      expect(result.specificTime?.minutes).toBe(0);
      
      const timeTag = result.tags.find(t => t.type === 'time');
      expect(timeTag).toBeDefined();
      expect(timeTag?.displayText).toBe('08:00');
    });
    
    it('should parse "ב8" as 8:00 am (without context)', () => {
      const result = parseTask('להוציא את אלון מהגן ב8');
      
      expect(result.specificTime).toBeDefined();
      expect(result.specificTime?.hours).toBe(8);
      expect(result.specificTime?.minutes).toBe(0);
      
      const timeTag = result.tags.find(t => t.type === 'time');
      expect(timeTag).toBeDefined();
      expect(timeTag?.displayText).toBe('08:00');
    });
    
    it('should parse "ב8 בערב" as 20:00 (evening context)', () => {
      const result = parseTask('להוציא את אלון מהגן ב8 בערב');
      
      expect(result.specificTime).toBeDefined();
      expect(result.specificTime?.hours).toBe(20);
      expect(result.specificTime?.minutes).toBe(0);
      
      const timeTag = result.tags.find(t => t.type === 'time');
      expect(timeTag).toBeDefined();
      expect(timeTag?.displayText).toBe('20:00');
    });
    
    it('should parse "בשעה 8 בערב" as 20:00 (evening context)', () => {
      const result = parseTask('להוציא את אלון מהגן בשעה 8 בערב');
      
      expect(result.specificTime).toBeDefined();
      expect(result.specificTime?.hours).toBe(20);
      expect(result.specificTime?.minutes).toBe(0);
      
      const timeTag = result.tags.find(t => t.type === 'time');
      expect(timeTag).toBeDefined();
      expect(timeTag?.displayText).toBe('20:00');
    });
    
    it('should parse "ב8 וחצי בערב" as 20:30', () => {
      const result = parseTask('להוציא את אלון מהגן ב8 וחצי בערב');
      
      expect(result.specificTime).toBeDefined();
      expect(result.specificTime?.hours).toBe(20);
      expect(result.specificTime?.minutes).toBe(30);
      
      const timeTag = result.tags.find(t => t.type === 'time');
      expect(timeTag).toBeDefined();
      expect(timeTag?.displayText).toBe('20:30');
    });
    
    it('should parse "בשמונה" as 8:00', () => {
      const result = parseTask('להוציא את אלון מהגן בשמונה');
      
      expect(result.specificTime).toBeDefined();
      expect(result.specificTime?.hours).toBe(8);
      expect(result.specificTime?.minutes).toBe(0);
      
      const timeTag = result.tags.find(t => t.type === 'time');
      expect(timeTag).toBeDefined();
      expect(timeTag?.displayText).toBe('08:00');
    });
    
    it('should parse "בשמונה בערב" as 20:00', () => {
      const result = parseTask('להוציא את אלון מהגן בשמונה בערב');
      
      expect(result.specificTime).toBeDefined();
      expect(result.specificTime?.hours).toBe(20);
      expect(result.specificTime?.minutes).toBe(0);
      
      const timeTag = result.tags.find(t => t.type === 'time');
      expect(timeTag).toBeDefined();
      expect(timeTag?.displayText).toBe('20:00');
    });
    
    it('should parse "בשמונה וחצי בערב" as 20:30', () => {
      const result = parseTask('להוציא את אלון מהגן בשמונה וחצי בערב');
      
      expect(result.specificTime).toBeDefined();
      expect(result.specificTime?.hours).toBe(20);
      expect(result.specificTime?.minutes).toBe(30);
      
      const timeTag = result.tags.find(t => t.type === 'time');
      expect(timeTag).toBeDefined();
      expect(timeTag?.displayText).toBe('20:30');
    });
    
    it('should highlight "בשעה 8" in segments', () => {
      const result = parseTask('להוציא את אלון מהגן בשעה 8');
      
      const timeSegment = result.segments.find(s => s.type === 'time');
      expect(timeSegment).toBeDefined();
      expect(timeSegment?.text).toContain('בשעה 8');
    });
    
    it('should highlight "ב8" in segments', () => {
      const result = parseTask('להוציא את אלון מהגן ב8');
      
      const timeSegment = result.segments.find(s => s.type === 'time');
      expect(timeSegment).toBeDefined();
      expect(timeSegment?.text).toContain('ב8');
    });
  });

  describe('Parser Integration Tests', () => {
    it('should parse "כל יום שני וחמישי לצאת לרוץ" and detect both days', () => {
      const result = parseTask('כל יום שני וחמישי לצאת לרוץ');
      
      // Should detect recurring pattern
      expect(result.recurring).toBe('weekdays');
      
      // Should have a recurring tag with both days
      const recurringTag = result.tags.find(t => t.type === 'recurring');
      expect(recurringTag).toBeDefined();
      
      // The value should be an array of day numbers [1, 4] for Monday and Thursday
      expect(Array.isArray(recurringTag?.value)).toBe(true);
      expect(recurringTag?.value).toEqual([1, 4]);
      
      // Display text should show both days
      expect(recurringTag?.displayText).toContain('שני');
      expect(recurringTag?.displayText).toContain('חמישי');
    });

    it('should parse "שני, רביעי וחמישי בבוקר" and detect three days', () => {
      const result = parseTask('שני, רביעי וחמישי בבוקר');
      
      expect(result.recurring).toBe('weekdays');
      
      const recurringTag = result.tags.find(t => t.type === 'recurring');
      expect(recurringTag).toBeDefined();
      expect(recurringTag?.value).toEqual([1, 3, 4]); // Monday, Wednesday, Thursday
    });

    it('should have recurring segment that covers full "שני וחמישי" text', () => {
      const result = parseTask('כל יום שני וחמישי לצאת לרוץ');
      
      // Find the recurring segment
      const recurringSegment = result.segments.find(s => s.type === 'recurring');
      expect(recurringSegment).toBeDefined();
      
      // The segment text should include both days
      expect(recurringSegment?.text).toContain('שני');
      expect(recurringSegment?.text).toContain('חמישי');
      
      // Should be the full phrase
      expect(recurringSegment?.text).toBe('כל יום שני וחמישי');
    });
  });
});
