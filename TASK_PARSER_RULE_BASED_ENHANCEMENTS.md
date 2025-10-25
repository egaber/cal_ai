# Task Parser Rule-Based Enhancement Catalog

This document catalogs all rule-based inference patterns that should be supported in the task parser. Each rule includes triggers, variations, expected inferences, and examples.

---

## 1. Activity-Based Children Selection

### Rule: Kindergarten Activities
**Triggers**: גן, kindergarten, גן ילדים, לגן, בגן
**Inference**: Include children aged 3-6 years
**Family Context**: Yael (5.5), Alon (3) ✅ | Hilly (11) ❌

**Variations**:
- "לקחת את הילדים לגן" (take the children to kindergarten)
- "הסעה לגן" (transportation to kindergarten)
- "איסוף מהגן" (pickup from kindergarten)
- "להביא את הילדים מהגן" (bring the children from kindergarten)
- "הילדים בגן" (children at kindergarten)
- "גן ילדים" (kindergarten)

**Expected Output**:
```json
{
  "location": "kindergarten",
  "involvedMembers": ["Yael", "Alon"],
  "requiresDriving": true,
  "drivingDuration": 15
}
```

---

### Rule: School Activities
**Triggers**: בית ספר, school, ביה"ס, לבית ספר, בביה"ס
**Inference**: Include school-age children (6-18 years)
**Family Context**: Hilly (11) ✅ | Yael (5.5), Alon (3) ❌

**Variations**:
- "לקחת את הילדים לבית ספר" (take the children to school)
- "הסעה לביה״ס" (transportation to school)
- "איסוף מבית הספר" (pickup from school)
- "הילדים בבית ספר" (children at school)
- "אסיפת הורים בביה״ס" (parent-teacher meeting at school)

**Expected Output**:
```json
{
  "location": "school",
  "involvedMembers": ["Hilly"],
  "requiresDriving": true,
  "drivingDuration": 10
}
```

---

## 2. Activity-Based Time Inference

### Rule: Kindergarten Pickup
**Triggers**: איסוף + גן, לקיחה + מהגן, pickup + kindergarten, להביא + מהגן
**Inference**: Time = 16:00 (typical kindergarten end time)
**Duration**: 15-30 minutes

**Variations**:
- "לקיחת הילדים מהגן" (picking up kids from kindergarten)
- "איסוף מהגן" (pickup from kindergarten)
- "להביא את הילדים מהגן" (bring the kids from kindergarten)
- "לאסוף את הילדים" + context has kindergarten

**Expected Output**:
```json
{
  "specificTime": { "hour": 16, "minute": 0 },
  "location": "kindergarten",
  "involvedMembers": ["Yael", "Alon"],
  "requiresDriving": true
}
```

---

### Rule: School Pickup
**Triggers**: איסוף + בית ספר, לקיחה + מבית הספר, pickup + school
**Inference**: Time = 14:00 (typical school end time in Israel)
**Duration**: 15-30 minutes

**Variations**:
- "לקחת את הילי מבית הספר" (pick up Hilly from school)
- "איסוף מהבית ספר" (pickup from school)
- "להביא את הילדה מהבית ספר" (bring the girl from school)

**Expected Output**:
```json
{
  "specificTime": { "hour": 14, "minute": 0 },
  "location": "school",
  "involvedMembers": ["Hilly"]
}
```

---

### Rule: Kindergarten Drop-off
**Triggers**: הסעה + גן, להביא + לגן, drop + kindergarten
**Inference**: Time = 08:00 (typical kindergarten start time)

**Variations**:
- "להביא את הילדים לגן" (bring kids to kindergarten)
- "הסעה לגן" (drive to kindergarten)
- "לקחת לגן בבוקר" (take to kindergarten in the morning)

**Expected Output**:
```json
{
  "specificTime": { "hour": 8, "minute": 0 },
  "timeBucket": "today",
  "location": "kindergarten",
  "involvedMembers": ["Yael", "Alon"]
}
```

---

### Rule: School Drop-off
**Triggers**: הסעה + בית ספר, להביא + לבית ספר
**Inference**: Time = 07:30 (typical school start time)

**Expected Output**:
```json
{
  "specificTime": { "hour": 7, "minute": 30 },
  "location": "school",
  "involvedMembers": ["Hilly"]
}
```

---

### Rule: Dinner Time
**Triggers**: ארוחת ערב, dinner, ארוחה + evening context
**Inference**: Time = 19:00
**Duration**: 1-2 hours

**Variations**:
- "ארוחת ערב" (dinner)
- "אוכל ערב" (evening meal)
- "dinner time"
- "evening meal"

**Expected Output**:
```json
{
  "specificTime": { "hour": 19, "minute": 0 },
  "timeBucket": "today"
}
```

---

### Rule: Lunch Time
**Triggers**: ארוחת צהריים, lunch, צהריים
**Inference**: Time = 13:00
**Duration**: 30-60 minutes

**Variations**:
- "ארוחת צהריים" (lunch)
- "אוכל צהריים" (midday meal)
- "lunch break"

---

### Rule: Breakfast
**Triggers**: ארוחת בוקר, breakfast
**Inference**: Time = 07:30

---

### Rule: Bedtime
**Triggers**: שינה, bedtime, ללכת לישון, להעלות לישון
**Inference**: Time = 21:00 for children, 23:00 for adults

**Variations**:
- "להעלות את הילדים לישון" (put children to bed)
- "שעת שינה" (bedtime)
- "ללכת לישון" (go to sleep)

---

## 3. Relationship-Based Location Inference

### Rule: Parents' House (Ella's)
**Triggers**: הורים + של אלה, אמא של אלה, אבא של אלה, parents of Ella
**Additional Triggers**: ערוגות, arugot, מושב ערוגות, Moshav Arugot
**Inference**: Location = "Moshav Arugot", Driving = 60 minutes
**Family Context**: All family members involved

**Variations**:
- "הולכים להורים של אלה" (going to Ella's parents)
- "אצל ההורים של אלה" (at Ella's parents)
- "לבקר את ההורים של אלה" (visit Ella's parents)
- "אמא של אלה" (Ella's mother)
- "אבא של אלה" (Ella's father)
- "בערוגות" (in Arugot)
- "ארוחת שישי השבוע בערוגות אצל ההורים של אלה" (Friday dinner this week in Arugot at Ella's parents)

**Expected Output**:
```json
{
  "location": "Moshav Arugot",
  "involvedMembers": ["Eyal", "Ella", "Hilly", "Yael", "Alon"],
  "requiresDriving": true,
  "drivingDuration": 60
}
```

**Location Resolution Logic**:
When both explicit location and relationship are mentioned:
1. Detect explicit location: "בערוגות" → Arugot
2. Detect relationship: "הורים של אלה" → Ella's parents → Moshav Arugot
3. Cross-validate: Both point to same location ✓
4. Use the more specific name: "Moshav Arugot"

---

### Rule: Parents' House (Eyal's)
**Triggers**: הורים + של אייל, אמא של אייל, אבא של אייל
**Inference**: Location = "Tel Aviv", Driving = 45 minutes

**Variations**:
- "הולכים להורים של אייל" (going to Eyal's parents)
- "אצל ההורים של אייל" (at Eyal's parents)
- "סבא וסבתא" + context (grandparents - need to determine which side)

---

### Rule: Generic Grandparents
**Triggers**: סבא וסבתא, grandparents, grandma, grandpa
**Inference**: All family members involved
**Context Needed**: May need additional context to determine location

**Variations**:
- "סבא וסבתא" (grandpa and grandma)
- "אצל סבא וסבתא" (at grandparents)
- "ארוחת ערב אצל סבא וסבתא" (dinner at grandparents)
- "לבקר את סבא וסבתא" (visit grandparents)

**Expected Output**:
```json
{
  "involvedMembers": ["Eyal", "Ella", "Hilly", "Yael", "Alon"],
  "requiresDriving": true
  // Location requires additional context or AI
}
```

---

## 4. Family Event Inference

### Rule: Family Activities
**Triggers**: משפחה, family, כולם, everyone, all of us
**Inference**: All family members involved

**Variations**:
- "פעילות משפחתית" (family activity)
- "יציאה משפחתית" (family outing)
- "כולם יוצאים" (everyone going out)
- "family trip"
- "משפחה יוצאת" (family going out)

**Expected Output**:
```json
{
  "involvedMembers": ["Eyal", "Ella", "Hilly", "Yael", "Alon"]
}
```

---

### Rule: Parent-Only Events
**Triggers**: הורים, parents, Eyal + Ella together
**Inference**: Only Eyal and Ella, may need childcare

**Variations**:
- "הערב של ההורים" (parents' evening)
- "date night"
- "יציאה של אלה ואייל" (Ella and Eyal going out)

**Expected Output**:
```json
{
  "involvedMembers": ["Eyal", "Ella"],
  "metadata": {
    "needsChildcare": true
  }
}
```

---

## 5. Hebrew Date Parsing

### Rule: Day + Hebrew Month
**Triggers**: [1-31] + [Hebrew month name]
**Format**: "22 לאוקטובר", "ב-15 למאי", "בעשרים לינואר"

**Hebrew Month Names**:
- ינואר (January), פברואר (February), מרץ (March)
- אפריל (April), מאי (May), יוני (June)
- יולי (July), אוגוסט (August), ספטמבר (September)
- אוקטובר (October), נובמבר (November), דצמבר (December)

**Variations**:
- "ב22 לאוקטובר" (on October 22)
- "בעשרים ושניים לאוקטובר" (on twenty-two of October)
- "22.10" or "22/10"
- "ב-22 לאוקטובר"
- "22 באוקטובר"

**Expected Output**:
```json
{
  "specificDate": "2025-10-22",
  "timeBucket": "nextWeek" // if relevant
}
```

---

### Rule: Hebrew Written Numbers
**Triggers**: Written numbers in Hebrew
**Mapping**:
- אחד (1), שניים (2), שלושה (3), ארבעה (4), חמישה (5)
- שישה (6), שבעה (7), שמונה (8), תשעה (9), עשרה (10)
- אחד עשר (11), שנים עשר (12), ... עשרים (20), ... שלושים (30)

**Variations**:
- "בעשרים ושניים לאוקטובר" (on the twenty-second of October)
- "בשלושה ועשרים למאי" (on the twenty-third of May)

---

### Rule: Relative Dates with "ב" Prefix
**Triggers**: ב + [date number/name]
**Inference**: Specific date reference

**Variations**:
- "בשישי" (on Friday) → next/this Friday
- "בשבת" (on Saturday) → next/this Saturday
- "ב15" (on the 15th)
- "בראשון" (on Sunday)

---

## 6. Time of Day Inference

### Rule: Morning
**Triggers**: בוקר, morning, בבוקר
**Inference**: 07:00-12:00
**Default**: 09:00 if no specific time

**Variations**:
- "בבוקר" (in the morning)
- "בוקר מוקדם" (early morning) → 07:00
- "סוף הבוקר" (late morning) → 11:00

---

### Rule: Afternoon
**Triggers**: אחר הצהריים, afternoon, צהריים
**Inference**: 12:00-17:00
**Default**: 14:00 if no specific time

**Variations**:
- "אחר הצהריים" (afternoon)
- "בצהריים" (at noon) → 12:00

---

### Rule: Evening
**Triggers**: ערב, evening, בערב
**Inference**: 17:00-21:00
**Default**: 18:00 if no specific time

**Variations**:
- "בערב" (in the evening)
- "ערב מוקדם" (early evening) → 17:00
- "ערב מאוחר" (late evening) → 20:00

---

### Rule: Night
**Triggers**: לילה, night, בלילה
**Inference**: 21:00-06:00
**Default**: 22:00 if no specific time

---

## 7. Day of Week Inference

### Rule: Friday Evening
**Triggers**: שישי + ערב, Friday + evening
**Inference**: Friday 17:00-20:00
**Context**: Often family events, Shabbat preparation

**Variations**:
- "בשישי בערב" (on Friday evening)
- "ערב שבת" (Shabbat eve)
- "כניסת שבת" (Shabbat entry) → 18:00 (varies by season)

**Expected Output**:
```json
{
  "specificDate": "[next/this Friday date]",
  "specificTime": { "hour": 17, "minute": 0 }
}
```

---

### Rule: Weekend
**Triggers**: סוף שבוע, weekend, בסופש
**Inference**: Friday evening to Saturday evening

**Variations**:
- "בסוף שבוע" (on the weekend)
- "סופש" (weekend abbreviation)
- "בסופש הבא" (next weekend)

---

## 8. Medical Appointments

### Rule: Doctor Visit
**Triggers**: רופא, doctor, clinic, קופת חולים
**Inference**: 
- Duration: 30 minutes
- Requires driving (usually)
- Time: Usually morning or afternoon slots

**Variations**:
- "לרופא" (to the doctor)
- "תור לרופא" (doctor's appointment)
- "ביקור אצל הרופא" (visit to the doctor)
- "קופת חולים" (health clinic)

---

### Rule: Dentist
**Triggers**: שיניים, רופא שיניים, dentist
**Inference**:
- Duration: 45 minutes
- Requires driving
- Involved: Person mentioned or inferred

**Variations**:
- "שיננית" (dentist - feminine)
- "שיניסט" (dentist - masculine)
- "רופא שיניים" (tooth doctor)
- "לרופא שיניים" (to the dentist)

---

## 9. Transportation Actions

### Rule: Drive/Take
**Triggers**: להסיע, לקחת, להביא, drive, take
**Inference**: Driving required
**Context**: Check for children or distant location

**Variations**:
- "להסיע את" (to drive [someone])
- "לקחת את" (to take [someone])
- "להביא את" (to bring [someone])
- "להוריד את" (to drop off [someone])
- "לאסוף את" (to pick up [someone])

---

### Rule: Pickup/Drop-off
**Triggers**: איסוף, אסיפה, להוריד, pickup, drop off
**Inference**: 
- Short duration (5-15 minutes)
- Specific location needed
- Driving required

---

## 10. Shopping and Errands

### Rule: Supermarket
**Triggers**: סופר, supermarket, קניות + מזון
**Inference**:
- Duration: 30-60 minutes
- May not require driving (close)
- Time: Usually 17:00-20:00 if evening, 10:00-12:00 if morning

**Variations**:
- "לסופר" (to the supermarket)
- "קניות" (shopping)
- "קניות שבועיות" (weekly shopping)

---

### Rule: Mall Shopping
**Triggers**: קניון, mall, shopping center
**Inference**:
- Duration: 1-3 hours
- Requires driving
- Often family activity

---

## 11. Recurring Patterns with Context

### Rule: Every Day + Time of Day
**Triggers**: כל בוקר, כל ערב, every morning, every evening
**Inference**: Daily recurring + specific time bucket

**Variations**:
- "כל בוקר" (every morning) → daily, 09:00
- "כל ערב" (every evening) → daily, 18:00
- "כל יום בצהריים" (every day at noon) → daily, 12:00

---

### Rule: Every Weekday
**Triggers**: כל יום + [weekday name]
**Inference**: Weekly recurring on specific day

**Variations**:
- "כל יום ראשון" (every Sunday)
- "כל שני" (every Monday - short form)
- "בכל יום שלישי" (on every Tuesday)

---

## 12. Priority and Urgency

### Rule: Urgent Tasks
**Triggers**: דחוף, urgent, ASAP, מיידי
**Inference**: Priority = P1, timeBucket = today

**Variations**:
- "דחוף!" (urgent)
- "מיידי" (immediate)
- "ASAP"
- "כמה שיותר מהר" (as soon as possible)

---

### Rule: Important But Not Urgent
**Triggers**: חשוב, important
**Inference**: Priority = P2

---

## 13. Duration Hints

### Rule: Quick/Short
**Triggers**: מהיר, quick, קצר, short
**Inference**: Duration = 15-30 minutes

**Variations**:
- "ביקור קצר" (short visit)
- "משימה מהירה" (quick task)
- "קפה מהיר" (quick coffee)

---

### Rule: Long/Extended
**Triggers**: ארוך, long, מורחב, extended
**Inference**: Duration = 2-4 hours

**Variations**:
- "פגישה ארוכה" (long meeting)
- "ביקור מורחב" (extended visit)

---

## Implementation Priority

### Phase 1 - High Priority (Immediate Value)
1. ✅ Activity-based children selection (kindergarten/school)
2. ✅ Activity-based time inference (pickup/drop-off times)
3. ✅ Hebrew date parsing (day + month)
4. ✅ Time of day inference (morning/afternoon/evening)
5. ✅ Day of week + time combinations (Friday evening)

### Phase 2 - Medium Priority (Significant Value)
6. ✅ Relationship-based location inference (parents' houses)
7. ✅ Family event inference (all members)
8. ✅ Medical appointment duration/requirements
9. ✅ Transportation action detection
10. ✅ Shopping/errand inference

### Phase 3 - Lower Priority (Nice to Have)
11. ✅ Recurring patterns with time context
12. ✅ Priority/urgency detection
13. ✅ Duration hints
14. ✅ Hebrew written numbers

---

## 14. Explicit Location Names

### Rule: Moshav/Town Names
**Triggers**: Specific town/moshav names mentioned
**Inference**: Match to known locations in database

**Known Locations Database**:
```typescript
const KNOWN_LOCATIONS = {
  'ערוגות': { fullName: 'Moshav Arugot', drivingTime: 60, relatedTo: "Ella's parents" },
  'arugot': { fullName: 'Moshav Arugot', drivingTime: 60, relatedTo: "Ella's parents" },
  'תל אביב': { fullName: 'Tel Aviv', drivingTime: 45, relatedTo: "Eyal's parents" },
  'tel aviv': { fullName: 'Tel Aviv', drivingTime: 45, relatedTo: "Eyal's parents" },
  // Add more locations as needed
};
```

**Variations**:
- "בערוגות" (in Arugot)
- "מערוגות" (from Arugot)
- "לערוגות" (to Arugot)
- "מושב ערוגות" (Moshav Arugot - full name)

**Combined Location Detection**:
When multiple location indicators exist:
1. **Explicit + Relationship**: "בערוגות אצל ההורים של אלה"
   - Explicit: ערוגות → Moshav Arugot
   - Relationship: הורים של אלה → Moshav Arugot
   - Result: Cross-validated ✓
   
2. **Explicit Only**: "בערוגות"
   - Look up in database → Moshav Arugot
   - Infer relationships if known (Ella's parents)
   
3. **Relationship Only**: "אצל ההורים של אלה"
   - Look up relationship → Moshav Arugot
   - Store for future reference

**Expected Output**:
```json
{
  "location": "Moshav Arugot",
  "explicitLocationMentioned": true,
  "relationshipMatch": "Ella's parents",
  "crossValidated": true
}
```

---

## Testing Examples

For each rule, test with these variations:

### Example 1: Kindergarten Pickup
```
✅ "לקחת את הילדים מהגן"
✅ "איסוף מהגן"
✅ "להביא את הילדים מהגן בארבע"
✅ "לקיחת הילדים גן"
```

### Example 2: Date Parsing
```
✅ "שיננית ב22 לאוקטובר"
✅ "רופא ב15.10"
✅ "פגישה בעשרים לנובמבר"
✅ "בשישי ה25"
```

### Example 3: Family Events
```
✅ "הולכים להורים של אלה בשישי בערב"
✅ "ארוחת ערב אצל סבא וסבתא"
✅ "פעילות משפחתית בפארק"
✅ "כולם יוצאים לים"
```

### Example 4: Location Detection (NEW)
```
✅ "ארוחת שישי השבוע בערוגות אצל ההורים של אלה"
   → Location: Moshav Arugot (cross-validated)
   → Time: Friday this week, 19:00
   → Involved: All family members
   → Driving: 60 minutes
   
✅ "בערוגות"
   → Location: Moshav Arugot
   → Infer: Likely visiting Ella's parents
   
✅ "אצל ההורים של אלה בערוגות"
   → Same result (order doesn't matter)
```

---

## Summary

This catalog defines **50+ rules** across 13 major categories that can be implemented using regex patterns and inference logic. Each rule has:
- Clear triggers (words/phrases)
- Expected inferences (what to add)
- Multiple variations (how people say it)
- Expected output structure

These rules can significantly improve the parser before adding AI enhancement for the truly complex cases.
