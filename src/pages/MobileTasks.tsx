import React, { useState } from 'react';
import { parseTask } from '../../mobile-task-app/src/services/taskParser';
import { ParsedTask, ExtractedTag } from '../../mobile-task-app/src/types/mobileTask';
import { Mic, MicOff, Plus, X, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TagEditor } from '../../mobile-task-app/src/components/TagEditor';
import { correctFamilyNames } from '../../mobile-task-app/src/utils/nameCorrection';

interface TaskWithStatus extends ParsedTask {
  completed: boolean;
}

export default function MobileTasks() {
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [finalTranscriptRef, setFinalTranscriptRef] = useState('');
  const [editingTag, setEditingTag] = useState<{ taskIndex: number; tag: ExtractedTag } | null>(null);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [isAiEnhancing, setIsAiEnhancing] = useState(false);

  // Parse text in real-time
  const parsedTask = inputText ? parseTask(inputText) : null;

  // AI Enhancement function
  const handleAiEnhance = () => {
    if (!inputText.trim()) return;
    
    setIsAiEnhancing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const text = inputText.toLowerCase();
      
      // Determine category based on keywords - broader search
      let category = '';
      let categoryIcon = '';
      
      if (text.includes('עבודה') || text.includes('פגישה') || text.includes('מייל') || text.includes('משרד') || 
          text.includes('פרויקט') || text.includes('דוח') || text.includes('ישיבה')) {
        category = 'עבודה';
        categoryIcon = '💼';
      } else if (text.includes('משפחה') || text.includes('ילדים') || text.includes('גן') || text.includes('בית ספר') ||
                 text.includes('הורים') || text.includes('ילד') || text.includes('ילדה')) {
        category = 'משפחה';
        categoryIcon = '👨‍👩‍👧‍👦';
      } else if (text.includes('קניות') || text.includes('סופר') || text.includes('קנה') || text.includes('לקנות') ||
                 text.includes('חנות') || text.includes('קניון')) {
        category = 'קניות';
        categoryIcon = '🛒';
      } else if (text.includes('בריאות') || text.includes('רופא') || text.includes('ספורט') || text.includes('כושר') ||
                 text.includes('רפואה') || text.includes('חדר כושר') || text.includes('תרופה')) {
        category = 'בריאות';
        categoryIcon = '🏥';
      } else if (text.includes('לימודים') || text.includes('שיעור') || text.includes('לימוד') || text.includes('לקרוא') ||
                 text.includes('למד') || text.includes('קורס')) {
        category = 'לימודים';
        categoryIcon = '📚';
      } else if (text.includes('נסיעה') || text.includes('דרך') || text.includes('הסעה') || text.includes('לנסוע') ||
                 text.includes('טיול') || text.includes('נהיגה')) {
        category = 'תחבורה';
        categoryIcon = '🚗';
      } else {
        category = 'כללי';
        categoryIcon = '📝';
      }
      
      // Determine context-specific icon - very detailed and accurate
      let contextIcon = '';
      
      // Food & Eating
      if (text.includes('אכל') || text.includes('ארוחה') || text.includes('מסעדה')) {
        contextIcon = '🍽️';
      } else if (text.includes('בישול') || text.includes('לבשל') || text.includes('מתכון')) {
        contextIcon = '👨‍🍳';
      } else if (text.includes('קפה') || text.includes('בית קפה')) {
        contextIcon = '☕';
      } else if (text.includes('פיצה')) {
        contextIcon = '🍕';
      } else if (text.includes('עוגה') || text.includes('עוגיות') || text.includes('קינוח')) {
        contextIcon = '🍰';
      }
      // Communication
      else if (text.includes('טלפון') || text.includes('להתקשר') || text.includes('שיחה')) {
        contextIcon = '📞';
      } else if (text.includes('מייל') || text.includes('אימייל') || text.includes('דואר')) {
        contextIcon = '📧';
      } else if (text.includes('הודעה') || text.includes('וואטסאפ') || text.includes('whatsapp')) {
        contextIcon = '💬';
      }
      // Home & Cleaning
      else if (text.includes('ניקיון') || text.includes('לנקות')) {
        contextIcon = '🧹';
      } else if (text.includes('כביסה')) {
        contextIcon = '👕';
      } else if (text.includes('כלים') || text.includes('למדיח')) {
        contextIcon = '🍽️';
      } else if (text.includes('אשפה') || text.includes('זבל')) {
        contextIcon = '🗑️';
      }
      // Health & Medical
      else if (text.includes('רופא') || text.includes('רפואי') || text.includes('מרפאה')) {
        contextIcon = '👨‍⚕️';
      } else if (text.includes('תרופה') || text.includes('תרופות')) {
        contextIcon = '💊';
      } else if (text.includes('שיניים') || text.includes('רופא שיניים')) {
        contextIcon = '🦷';
      } else if (text.includes('ספורט') || text.includes('כושר') || text.includes('אימון')) {
        contextIcon = '💪';
      } else if (text.includes('ריצה') || text.includes('לרוץ')) {
        contextIcon = '🏃';
      }
      // Reading & Writing
      else if (text.includes('ספר') || text.includes('לקרוא')) {
        contextIcon = '📖';
      } else if (text.includes('כתב') || text.includes('לכתוב')) {
        contextIcon = '✍️';
      } else if (text.includes('מסמך') || text.includes('דוח')) {
        contextIcon = '📄';
      }
      // Finance
      else if (text.includes('תשלום') || text.includes('לשלם')) {
        contextIcon = '💳';
      } else if (text.includes('חשבון') || text.includes('בנק')) {
        contextIcon = '🏦';
      } else if (text.includes('כסף') || text.includes('כספים')) {
        contextIcon = '💰';
      }
      // Events & Celebrations
      else if (text.includes('יום הולדת') || text.includes('ימולדת')) {
        contextIcon = '🎂';
      } else if (text.includes('מתנה') || text.includes('מתנות')) {
        contextIcon = '🎁';
      } else if (text.includes('חתונה')) {
        contextIcon = '💒';
      } else if (text.includes('אירוע') || text.includes('מסיבה')) {
        contextIcon = '🎉';
      }
      // Travel & Transportation
      else if (text.includes('טיול') || text.includes('נופש') || text.includes('חופשה')) {
        contextIcon = '✈️';
      } else if (text.includes('מונית') || text.includes('טקסי')) {
        contextIcon = '🚕';
      } else if (text.includes('אוטובוס')) {
        contextIcon = '🚌';
      } else if (text.includes('רכבת')) {
        contextIcon = '🚆';
      } else if (text.includes('נהיגה') || text.includes('לנהוג') || text.includes('מכונית')) {
        contextIcon = '🚗';
      }
      // Meeting & Work
      else if (text.includes('פגישה') || text.includes('ישיבה')) {
        contextIcon = '🤝';
      } else if (text.includes('פרזנטציה') || text.includes('מצגת')) {
        contextIcon = '📊';
      } else if (text.includes('ועידה') || text.includes('כנס')) {
        contextIcon = '🎤';
      }
      // Kids & Education
      else if (text.includes('גן') || text.includes('גננת')) {
        contextIcon = '🎨';
      } else if (text.includes('בית ספר') || text.includes('בי"ס')) {
        contextIcon = '🏫';
      } else if (text.includes('שיעורי בית') || text.includes('שיעורים')) {
        contextIcon = '📚';
      } else if (text.includes('מורה')) {
        contextIcon = '👨‍🏫';
      }
      // Shopping
      else if (text.includes('סופר') || text.includes('סופרמרקט')) {
        contextIcon = '🛒';
      } else if (text.includes('ירקות') || text.includes('פירות')) {
        contextIcon = '🥬';
      } else if (text.includes('לחם')) {
        contextIcon = '🍞';
      } else if (text.includes('בשר')) {
        contextIcon = '🥩';
      } else if (text.includes('חלב') || text.includes('גבינה')) {
        contextIcon = '🥛';
      }
      // Pets
      else if (text.includes('כלב')) {
        contextIcon = '🐕';
      } else if (text.includes('חתול')) {
        contextIcon = '🐱';
      } else if (text.includes('וטרינר')) {
        contextIcon = '🏥';
      }
      // Utilities & Services
      else if (text.includes('חשמל') || text.includes('אור')) {
        contextIcon = '💡';
      } else if (text.includes('מים') || text.includes('אינסטלטור')) {
        contextIcon = '💧';
      } else if (text.includes('מזגן') || text.includes('מיזוג')) {
        contextIcon = '❄️';
      }
      
      // Build enhanced text - add only the content icon, NOT the category
      let enhancedText = inputText;
      
      // Add context icon at the beginning if found and not already there
      if (contextIcon && !enhancedText.includes(contextIcon)) {
        enhancedText = `${contextIcon} ${enhancedText}`;
      }
      
      // DO NOT add category to text - it will be added as a separate tag
      // Instead, add a special marker that the parser will recognize
      if (category) {
        enhancedText = `${enhancedText} @category:${category}:${categoryIcon}`;
      }
      
      setInputText(enhancedText);
      setIsAiEnhancing(false);
    }, 1000);
  };

  const handleAddTask = () => {
    if (parsedTask && inputText.trim()) {
      if (editingTaskIndex !== null) {
        // Update existing task
        const updatedTasks = [...tasks];
        updatedTasks[editingTaskIndex] = { ...parsedTask, completed: tasks[editingTaskIndex].completed };
        setTasks(updatedTasks);
        setEditingTaskIndex(null);
      } else {
        // Add new task
        setTasks([...tasks, { ...parsedTask, completed: false }]);
      }
      setInputText('');
      setFinalTranscriptRef('');
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = (index: number) => {
    setTasks(tasks.map((task, i) => 
      i === index ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleTaskClick = (index: number) => {
    setEditingTaskIndex(index);
    setInputText(tasks[index].rawText);
    setIsAddingTask(true);
  };

  const handleSegmentClick = (taskIndex: number, segment: any) => {
    // Find the tag that corresponds to this segment
    const task = tasks[taskIndex];
    const matchingTag = task.tags.find(tag => tag.type === segment.type);
    
    if (matchingTag) {
      setEditingTag({ taskIndex, tag: matchingTag });
    }
  };

  const handleTagClick = (taskIndex: number, tag: ExtractedTag) => {
    setEditingTag({ taskIndex, tag });
  };

  const handleTagUpdate = (newValue: any) => {
    if (!editingTag) return;
    
    const updatedTasks = [...tasks];
    const task = updatedTasks[editingTag.taskIndex];
    
    // Find and update the tag
    const tagIndex = task.tags.findIndex(t => t.id === editingTag.tag.id);
    if (tagIndex !== -1) {
      const oldTag = task.tags[tagIndex];
      const newDisplayText = formatTagDisplay(editingTag.tag.type, newValue);
      
      task.tags[tagIndex] = {
        ...oldTag,
        value: newValue,
        displayText: newDisplayText,
      };
      
      // Find the actual text segment that corresponds to this tag
      const matchingSegment = task.segments.find(seg => 
        seg.type === oldTag.type && seg.value === oldTag.value
      );
      
      // Update the raw text by finding and replacing the old value
      console.log('BEFORE update - task.rawText:', task.rawText);
      console.log('Matching segment:', matchingSegment);
      console.log('Old tag:', oldTag);
      console.log('New value:', newValue);
      
      // Use smart text replacement that handles different formats
      // Pass the segment text (actual Hebrew text) rather than the tag's displayText
      task.rawText = updateTextForTagChange(task.rawText, oldTag, newValue, matchingSegment);
      
      console.log('AFTER update - task.rawText:', task.rawText);
      
      // Reparse to update segments (highlighting) and get new tags
      const reparsed = parseTask(task.rawText);
      task.segments = reparsed.segments;
      
      // Update the tag in the tags array with the reparsed one
      const newTag = reparsed.tags.find(t => t.type === oldTag.type);
      if (newTag) {
        task.tags[tagIndex] = newTag;
      }
      
      console.log('AFTER reparse - segments:', reparsed.segments);
      console.log('AFTER reparse - tags:', reparsed.tags);
      
      // Also update the task's main properties
      updateTaskProperties(task, editingTag.tag.type, newValue);
    }
    
    setTasks(updatedTasks);
    setEditingTag(null);
  };

  const handleTagRemove = () => {
    if (!editingTag) return;
    
    const updatedTasks = [...tasks];
    const task = updatedTasks[editingTag.taskIndex];
    
    // Remove the tag
    task.tags = task.tags.filter(t => t.id !== editingTag.tag.id);
    
    // Also clear the task's main property
    clearTaskProperty(task, editingTag.tag.type);
    
    setTasks(updatedTasks);
    setEditingTag(null);
  };

  const formatTagDisplay = (type: string, value: any): string => {
    if (type === 'time' && typeof value === 'object') {
      // Support both { hour, minute } and { hours, minutes } formats
      const hour = (value as any).hour ?? (value as any).hours ?? 0;
      const minute = (value as any).minute ?? (value as any).minutes ?? 0;
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    if (type === 'transport') {
      return `${value}min`;
    }
    if (type === 'timeBucket') {
      // Convert English to Hebrew for display
      return timeBucketToHebrew(value);
    }
    if (type === 'involved' || type === 'owner') {
      // Convert family member names to Hebrew
      const member = FAMILY_MEMBERS.find(m => m.name === value);
      return member?.nameHe || String(value);
    }
    return String(value);
  };

  // Get color for category tags
  const getCategoryColor = (categoryName: string): { text: string; bg: string; border: string } => {
    const lowerCategory = categoryName.toLowerCase();
    
    if (lowerCategory === 'עבודה') {
      return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
    } else if (lowerCategory === 'משפחה') {
      return { text: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200' };
    } else if (lowerCategory === 'קניות') {
      return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    } else if (lowerCategory === 'בריאות') {
      return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };
    } else if (lowerCategory === 'לימודים') {
      return { text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' };
    } else if (lowerCategory === 'תחבורה') {
      return { text: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' };
    } else {
      // Default for 'כללי' and others
      return { text: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  const FAMILY_MEMBERS = [
    { name: 'Eyal', nameHe: 'אייל' },
    { name: 'Ella', nameHe: 'אלה' },
    { name: 'Hilly', nameHe: 'הילי' },
    { name: 'Yael', nameHe: 'יעל' },
    { name: 'Alon', nameHe: 'אלון' },
  ];

  const timeBucketToHebrew = (bucket: string): string => {
    const mapping: Record<string, string> = {
      'today': 'היום',
      'tomorrow': 'מחר',
      'this-week': 'השבוע',
      'next-week': 'שבוע הבא',
    };
    return mapping[bucket] || bucket;
  };

  const getTimeOfDay = (hour: number): string => {
    if (hour >= 5 && hour < 12) return 'בוקר';
    if (hour >= 12 && hour < 17) return 'צהריים';
    if (hour >= 17 && hour < 21) return 'ערב';
    return 'לילה';
  };

  const hourToHebrew = (hour: number): string => {
    // Normalize hour to 0-23 range
    const normalizedHour = ((hour % 24) + 24) % 24;
    
    const hours: Record<number, string> = {
      0: 'חצות', 1: 'אחת', 2: 'שתיים', 3: 'שלוש', 4: 'ארבע', 5: 'חמש',
      6: 'שש', 7: 'שבע', 8: 'שמונה', 9: 'תשע', 10: 'עשר', 11: 'אחת עשרה',
      12: 'שתיים עשרה', 13: 'אחת', 14: 'שתיים', 15: 'שלוש', 16: 'ארבע',
      17: 'חמש', 18: 'שש', 19: 'שבע', 20: 'שמונה', 21: 'תשע', 22: 'עשר', 23: 'אחת עשרה'
    };
    return hours[normalizedHour] || String(normalizedHour);
  };

  const updateTextForTagChange = (rawText: string, oldTag: ExtractedTag, newValue: any, segment?: any): string => {
    const oldDisplayText = oldTag.displayText;
    const newDisplayText = formatTagDisplay(oldTag.type, newValue);
    
    // Use the segment text if available (actual Hebrew text in the raw text)
    const actualOldText = segment?.text || oldDisplayText;
    
    console.log('updateTextForTagChange:', { rawText, oldDisplayText, actualOldText, newDisplayText, type: oldTag.type, oldValue: oldTag.value, newValue });
    
    // Special handling for different tag types
    if (oldTag.type === 'time') {
      const newTime = newValue as { hour: number; minute: number };
      const oldTime = oldTag.value as { hour: number; minute: number };
      
      // Try to find and replace Hebrew time phrases like "שמונה בבוקר"
      const oldHourHebrew = hourToHebrew(oldTime.hour);
      const newHourHebrew = hourToHebrew(newTime.hour);
      const oldTimeOfDay = getTimeOfDay(oldTime.hour);
      const newTimeOfDay = getTimeOfDay(newTime.hour);
      
      console.log('Time replacement attempt:', { oldHourHebrew, newHourHebrew, oldTimeOfDay, newTimeOfDay });
      
      // Pattern 1: "שמונה בבוקר" -> "תשע בבוקר" (with or without ב prefix on time word)
      // First try with ב prefix on both hour and time-of-day
      const hebrewTimePattern1 = new RegExp(`ב${oldHourHebrew}\\s+ב(${oldTimeOfDay}|צהריים|ערב|לילה)`, 'gi');
      if (hebrewTimePattern1.test(rawText)) {
        console.log('✅ Pattern 1a matched (ב + hour + ב + time-of-day)');
        const result = rawText.replace(hebrewTimePattern1, `ב${newHourHebrew} ב${newTimeOfDay}`);
        console.log('Result:', result);
        return result;
      }
      
      // Pattern 1b: "שמונה בבוקר" -> "תשע בבוקר" (no ב on hour, ב on time-of-day)
      const hebrewTimePattern2 = new RegExp(`${oldHourHebrew}\\s+ב(${oldTimeOfDay}|צהריים|ערב|לילה)`, 'gi');
      if (hebrewTimePattern2.test(rawText)) {
        console.log('✅ Pattern 1b matched (hour + ב + time-of-day)');
        const result = rawText.replace(hebrewTimePattern2, `${newHourHebrew} ב${newTimeOfDay}`);
        console.log('Result:', result);
        return result;
      }
      
      // Pattern 2: "בשעה X" or numeric time
      const timePatterns = [
        new RegExp(`בשעה\\s+${oldDisplayText.replace(':', '\\:')}`, 'g'),
        new RegExp(`\\b${oldDisplayText.replace(':', '\\:')}\\b`, 'g'),
      ];
      
      for (let i = 0; i < timePatterns.length; i++) {
        const pattern = timePatterns[i];
        if (pattern.test(rawText)) {
          console.log(`✅ Pattern 2.${i} matched (numeric time)`);
          const result = rawText.replace(pattern, (match) => {
            if (match.includes('בשעה')) {
              return `בשעה ${newDisplayText}`;
            }
            return newDisplayText;
          });
          console.log('Result:', result);
          return result;
        }
      }
      
      // Pattern 3: Just the Hebrew hour word alone
      const simpleHebrewPattern = new RegExp(`\\b${oldHourHebrew}\\b`, 'g');
      if (simpleHebrewPattern.test(rawText)) {
        console.log('✅ Pattern 3 matched (Hebrew word alone)');
        // If changing time significantly (morning to evening), might need time of day
        if (Math.abs(newTime.hour - oldTime.hour) > 6) {
          const result = rawText.replace(simpleHebrewPattern, `${newDisplayText}`);
          console.log('Result:', result);
          return result;
        }
        const result = rawText.replace(simpleHebrewPattern, newHourHebrew);
        console.log('Result:', result);
        return result;
      }
      
      // Fallback: simple replacement
      console.log('⚠️ Using fallback replacement');
      const result = rawText.replace(oldDisplayText, newDisplayText);
      console.log('Result:', result);
      return result;
    } else if (oldTag.type === 'timeBucket') {
      // Replace time bucket words - need to convert English to Hebrew
      const oldHebrewWord = timeBucketToHebrew(oldTag.value as string);
      const newHebrewWord = timeBucketToHebrew(newValue as string);
      
      console.log('timeBucket replace:', { oldHebrewWord, newHebrewWord, rawText });
      
      // Try to find the word in the text (it might not have word boundaries in Hebrew)
      if (rawText.includes(oldHebrewWord)) {
        const result = rawText.replace(oldHebrewWord, newHebrewWord);
        console.log('timeBucket result:', result);
        return result;
      }
      
      // Fallback: replace by display text
      const result = rawText.replace(oldDisplayText, newDisplayText);
      console.log('timeBucket fallback result:', result);
      return result;
    } else if (oldTag.type === 'involved' || oldTag.type === 'owner') {
      // Replace family member names - use the actual segment text (Hebrew)
      console.log('Family member replace:', { actualOldText, oldDisplayText, newDisplayText, rawText });
      
      // Use the actual text from the segment (e.g., "את הילי")
      if (actualOldText && rawText.includes(actualOldText)) {
        const result = rawText.replace(actualOldText, `את ${newDisplayText}`);
        console.log('Family member result (using segment):', result);
        return result;
      }
      
      // Fallback: Hebrew names don't have word boundaries, so just replace directly
      if (rawText.includes(oldDisplayText)) {
        const result = rawText.replace(oldDisplayText, newDisplayText);
        console.log('Family member result:', result);
        return result;
      }
      
      // Final fallback to word boundary pattern
      const result = rawText.replace(new RegExp(`\\b${oldDisplayText}\\b`, 'g'), newDisplayText);
      console.log('Family member fallback result:', result);
      return result;
    } else if (oldTag.type === 'transport') {
      // Replace drive time - look for patterns like "15min" or "15 דקות נסיעה"
      return rawText.replace(new RegExp(`${oldTag.value}\\s*(min|דקות נסיעה?)`, 'g'), `${newDisplayText}`);
    } else if (oldTag.type === 'priority') {
      // Replace priority
      return rawText.replace(new RegExp(`\\b${oldDisplayText}\\b`, 'g'), newDisplayText);
    }
    
    // Fallback: simple replacement
    return rawText.replace(oldDisplayText, newDisplayText);
  };

  const updateTaskProperties = (task: TaskWithStatus, type: string, value: any) => {
    switch (type) {
      case 'timeBucket':
        task.timeBucket = value;
        break;
      case 'time':
        task.specificTime = value;
        break;
      case 'owner':
        task.owner = value;
        break;
      case 'involved':
        // Update involved members array
        if (!task.involvedMembers.includes(value)) {
          task.involvedMembers = [...task.involvedMembers, value];
        }
        break;
      case 'priority':
        task.priority = value;
        break;
      case 'transport':
        task.drivingDuration = value;
        break;
    }
  };

  const clearTaskProperty = (task: TaskWithStatus, type: string) => {
    switch (type) {
      case 'timeBucket':
        task.timeBucket = 'unlabeled';
        break;
      case 'time':
        task.specificTime = undefined;
        break;
      case 'owner':
        task.owner = undefined;
        break;
      case 'involved':
        // Remove from involved members
        task.involvedMembers = task.involvedMembers.filter(m => 
          !task.tags.some(t => t.type === 'involved' && t.value === m)
        );
        break;
      case 'priority':
        task.priority = undefined;
        break;
      case 'transport':
        task.drivingDuration = undefined;
        task.requiresDriving = false;
        break;
    }
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not supported');
      return;
    }

    // Clear previous text when starting new recording
    setInputText('');
    setFinalTranscriptRef('');

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'he-IL';

    let silenceTimer: NodeJS.Timeout | null = null;

    recognitionInstance.onresult = (event: any) => {
      let interimTranscript = '';
      let newFinalTranscript = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update the final transcript ref if we have new final text
      if (newFinalTranscript && newFinalTranscript !== finalTranscriptRef) {
        // Apply name corrections to the final transcript
        const corrected = correctFamilyNames(newFinalTranscript);
        setFinalTranscriptRef(corrected);
        setInputText(corrected);
      } else if (interimTranscript) {
        // Show final + interim (streaming) - correct interim as well for preview
        const correctedInterim = correctFamilyNames(finalTranscriptRef + interimTranscript);
        setInputText(correctedInterim);
      }

      // Reset silence timer - user is speaking
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }

      // Start new silence timer - stop after 3 seconds of no speech
      silenceTimer = setTimeout(() => {
        console.log('3 seconds of silence detected - stopping recording');
        if (recognitionInstance) {
          recognitionInstance.stop();
        }
      }, 3000);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
    };

    recognitionInstance.start();
    setRecognition(recognitionInstance);
    setIsListening(true);
  };

  const stopVoiceRecognition = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      setFinalTranscriptRef(''); // Reset for next time
    }
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">המשימות שלי</h1>
      </div>

      {/* Task List */}
      <div className="pb-24">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">אין משימות עדיין</p>
            <p className="text-sm mt-2">לחץ על + כדי להוסיף משימה</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div key={index}>
              <div className="px-6 py-4">
                <div className="flex gap-3 items-start group">
                  {/* Checkbox - aligned with text top */}
                  <button
                    onClick={() => handleToggleTask(index)}
                    className="flex-shrink-0"
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.completed 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300 hover:border-green-400'
                    }`}>
                      {task.completed && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* Task content */}
                  <div className="flex-1 space-y-3">
                    {/* Task text with highlighting - clickable */}
                    <div 
                      className={`text-base leading-relaxed cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 transition-colors ${task.completed ? 'line-through opacity-60' : ''}`}
                      onClick={() => handleTaskClick(index)}
                    >
                      {task.segments.map((segment, i) => {
                        if (segment.type === 'text') {
                          return <span key={i}>{segment.text}</span>;
                        }
                        
                        let bgColor = 'bg-gray-100';
                        if (segment.type === 'involved') bgColor = 'bg-purple-100';
                        else if (segment.type === 'location') bgColor = 'bg-amber-100';
                        else if (segment.type === 'time') bgColor = 'bg-green-100';
                        else if (segment.type === 'timeBucket') bgColor = 'bg-blue-100';
                        else if (segment.type === 'priority') bgColor = 'bg-red-100';
                        else if (segment.type === 'recurring') bgColor = 'bg-cyan-100';
                        
                        return (
                          <span 
                            key={i} 
                            className={`${bgColor} px-1 rounded cursor-pointer hover:opacity-80 active:scale-95 transition-all`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSegmentClick(index, segment);
                            }}
                          >
                            {segment.text}
                          </span>
                        );
                      })}
                    </div>

                    {/* Tags with white background and colorful text - CLICKABLE */}
                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag) => {
                          let textColor = 'text-gray-700';
                          let bgColor = 'bg-white';
                          let borderColor = 'border-gray-200';
                          
                          // Check if this is a category tag (hashtag)
                          if (tag.type === 'tag') {
                            const categoryColors = getCategoryColor(tag.displayText);
                            textColor = categoryColors.text;
                            bgColor = categoryColors.bg;
                            borderColor = categoryColors.border;
                          } else {
                            // Standard tag colors
                            if (tag.type === 'involved') textColor = 'text-purple-600';
                            else if (tag.type === 'location') textColor = 'text-amber-600';
                            else if (tag.type === 'time') textColor = 'text-green-600';
                            else if (tag.type === 'timeBucket') textColor = 'text-blue-600';
                            else if (tag.type === 'priority') textColor = 'text-red-600';
                            else if (tag.type === 'owner') textColor = 'text-indigo-600';
                            else if (tag.type === 'recurring') textColor = 'text-cyan-600';
                          }
                          
                          return (
                            <button
                              key={tag.id}
                              onClick={() => handleTagClick(index, tag)}
                              className={`inline-flex items-center gap-1 px-2 py-1 ${bgColor} border ${borderColor} rounded-lg text-xs ${textColor} font-medium hover:shadow-md transition-shadow active:scale-95`}
                            >
                              <span>{tag.emoji}</span>
                              <span>{tag.displayText}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Subtle delete button - appears on hover */}
                  <button
                    onClick={() => handleDeleteTask(index)}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>
              
              {/* Divider between tasks */}
              {index < tasks.length - 1 && (
                <div className="mx-6 border-b border-gray-200"></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Task Button (Fixed) - positioned above bottom nav */}
      {!isAddingTask && (
        <button
          onClick={() => {
            setInputText('');
            setIsAddingTask(true);
          }}
          className="fixed bottom-20 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-50"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Add Task Panel (Slides up from bottom) */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setIsAddingTask(false)}>
          <div
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h2 className="text-lg font-semibold">{editingTaskIndex !== null ? 'ערוך משימה' : 'משימה חדשה'}</h2>
              <button onClick={() => {
                setIsAddingTask(false);
                setEditingTaskIndex(null);
              }}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Input area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="תאר את המשימה..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                dir="rtl"
              />

              {/* Live parsing preview */}
              {parsedTask && inputText && (
                <div className="mt-4 space-y-3">
                  {/* Highlighted text */}
                  <div className="p-4 bg-gray-50 rounded-lg text-base leading-relaxed">
                    {parsedTask.segments.map((segment, i) => {
                      if (segment.type === 'text') {
                        return <span key={i}>{segment.text}</span>;
                      }
                      
                      let bgColor = 'bg-gray-100';
                      if (segment.type === 'involved') bgColor = 'bg-purple-100';
                      else if (segment.type === 'location') bgColor = 'bg-amber-100';
                      else if (segment.type === 'time') bgColor = 'bg-green-100';
                      else if (segment.type === 'timeBucket') bgColor = 'bg-blue-100';
                      else if (segment.type === 'priority') bgColor = 'bg-red-100';
                      
                      return (
                        <span key={i} className={`${bgColor} px-1 rounded`}>
                          {segment.text}
                        </span>
                      );
                    })}
                  </div>

                  {/* Tags preview with white background and colorful text */}
                  {parsedTask.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {parsedTask.tags.map((tag) => {
                        let textColor = 'text-gray-700';
                        let bgColor = 'bg-white';
                        let borderColor = 'border-gray-200';
                        
                        // Check if this is a category tag (hashtag)
                        if (tag.type === 'tag') {
                          const categoryColors = getCategoryColor(tag.displayText);
                          textColor = categoryColors.text;
                          bgColor = categoryColors.bg;
                          borderColor = categoryColors.border;
                        } else {
                          // Standard tag colors
                          if (tag.type === 'involved') textColor = 'text-purple-600';
                          else if (tag.type === 'location') textColor = 'text-amber-600';
                          else if (tag.type === 'time') textColor = 'text-green-600';
                          else if (tag.type === 'timeBucket') textColor = 'text-blue-600';
                          else if (tag.type === 'priority') textColor = 'text-red-600';
                          else if (tag.type === 'owner') textColor = 'text-indigo-600';
                        }
                        
                        return (
                          <span
                            key={tag.id}
                            className={`inline-flex items-center gap-1 px-3 py-1 ${bgColor} border ${borderColor} rounded-lg text-sm ${textColor} font-medium`}
                          >
                            <span>{tag.emoji}</span>
                            <span>{tag.displayText}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom actions */}
            <div className="p-4 border-t bg-white space-y-3">
              {/* AI and Voice buttons row */}
              <div className="grid grid-cols-2 gap-3">
                {/* AI Enhancement button */}
                <button
                  onClick={handleAiEnhance}
                  disabled={!inputText.trim() || isAiEnhancing}
                  className={`py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
                    isAiEnhancing
                      ? 'bg-purple-500 text-white'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <Sparkles className={`w-5 h-5 ${isAiEnhancing ? 'animate-pulse' : ''}`} />
                  <span>{isAiEnhancing ? 'מעבד...' : 'AI'}</span>
                </button>

                {/* Voice button */}
                <button
                  onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                  className={`py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
                    isListening
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      <span>עצור</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>דבר</span>
                    </>
                  )}
                </button>
              </div>

              {/* Add/Update button */}
              <Button
                onClick={handleAddTask}
                disabled={!inputText.trim()}
                className="w-full py-3 text-base font-medium"
              >
                {editingTaskIndex !== null ? 'עדכן משימה' : 'הוסף משימה'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Editor */}
      {editingTag && (
        <TagEditor
          tag={editingTag.tag}
          onUpdate={handleTagUpdate}
          onRemove={handleTagRemove}
          onClose={() => setEditingTag(null)}
        />
      )}
    </div>
  );
}
