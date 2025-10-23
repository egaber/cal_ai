import React, { useState } from 'react';
import { parseTask } from '../../mobile-task-app/src/services/taskParser';
import { ParsedTask, ExtractedTag } from '../../mobile-task-app/src/types/mobileTask';
import { Mic, MicOff, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TagEditor } from '../../mobile-task-app/src/components/TagEditor';

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

  // Parse text in real-time
  const parsedTask = inputText ? parseTask(inputText) : null;

  const handleAddTask = () => {
    if (parsedTask && inputText.trim()) {
      setTasks([...tasks, { ...parsedTask, completed: false }]);
      setInputText('');
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
        seg.type === oldTag.type && seg.text && task.rawText.includes(seg.text)
      );
      
      // Update the raw text by finding and replacing the old value
      console.log('BEFORE update - task.rawText:', task.rawText);
      console.log('Matching segment:', matchingSegment);
      
      if (matchingSegment && matchingSegment.text) {
        // Use the actual text from the segment
        task.rawText = task.rawText.replace(matchingSegment.text, newDisplayText);
        console.log('✅ Replaced segment text:', matchingSegment.text, '→', newDisplayText);
      } else {
        // Fallback to old method
        task.rawText = updateTextForTagChange(task.rawText, oldTag, newValue);
      }
      
      console.log('AFTER update - task.rawText:', task.rawText);
      
      // Reparse to update ONLY segments (highlighting)
      // Keep the manually updated tags to preserve the change
      const reparsed = parseTask(task.rawText);
      task.segments = reparsed.segments;
      console.log('AFTER reparse - segments:', reparsed.segments);
      
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
      return `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`;
    }
    if (type === 'transport') {
      return `${value}min`;
    }
    if (type === 'timeBucket') {
      // Convert English to Hebrew for display
      return timeBucketToHebrew(value);
    }
    return String(value);
  };

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
    const hours: Record<number, string> = {
      0: 'חצות', 1: 'אחת', 2: 'שתיים', 3: 'שלוש', 4: 'ארבע', 5: 'חמש',
      6: 'שש', 7: 'שבע', 8: 'שמונה', 9: 'תשע', 10: 'עשר', 11: 'אחת עשרה',
      12: 'שתיים עשרה', 13: 'אחת', 14: 'שתיים', 15: 'שלוש', 16: 'ארבע',
      17: 'חמש', 18: 'שש', 19: 'שבע', 20: 'שמונה', 21: 'תשע', 22: 'עשר', 23: 'אחת עשרה'
    };
    return hours[hour] || String(hour);
  };

  const updateTextForTagChange = (rawText: string, oldTag: ExtractedTag, newValue: any): string => {
    const oldDisplayText = oldTag.displayText;
    const newDisplayText = formatTagDisplay(oldTag.type, newValue);
    
    console.log('updateTextForTagChange:', { rawText, oldDisplayText, newDisplayText, type: oldTag.type, oldValue: oldTag.value, newValue });
    
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
      
      // Pattern 1: "שמונה בבוקר" -> "תשע בבוקר" or "תשע ערב"
      const hebrewTimePattern = new RegExp(`${oldHourHebrew}\\s+(ב)?(${oldTimeOfDay}|צהריים|ערב|לילה)`, 'gi');
      if (hebrewTimePattern.test(rawText)) {
        console.log('✅ Pattern 1 matched (Hebrew phrase)');
        const result = rawText.replace(hebrewTimePattern, `${newHourHebrew} ${newTimeOfDay}`);
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
      const result = rawText.replace(new RegExp(`\\b${oldHebrewWord}\\b`, 'g'), newHebrewWord);
      console.log('timeBucket result:', result);
      return result;
    } else if (oldTag.type === 'involved' || oldTag.type === 'owner') {
      // Replace family member names
      return rawText.replace(new RegExp(`\\b${oldDisplayText}\\b`, 'g'), newDisplayText);
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

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'he-IL';

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
        setFinalTranscriptRef(newFinalTranscript);
        setInputText(newFinalTranscript);
      } else if (interimTranscript) {
        // Show final + interim (streaming)
        setInputText(finalTranscriptRef + interimTranscript);
      }
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">המשימות שלי</h1>
      </div>

      {/* Task List */}
      <div className="p-4 space-y-3 pb-24">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">אין משימות עדיין</p>
            <p className="text-sm mt-2">לחץ על + כדי להוסיף משימה</p>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3"
            >
              <div className="flex gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleTask(index)}
                  className="flex-shrink-0 mt-0.5"
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
                  {/* Task text with highlighting */}
                  <div className={`text-base leading-relaxed ${task.completed ? 'line-through opacity-60' : ''}`}>
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
                      
                      return (
                        <span key={i} className={`${bgColor} px-1 rounded`}>
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
                        if (tag.type === 'involved') textColor = 'text-purple-600';
                        else if (tag.type === 'location') textColor = 'text-amber-600';
                        else if (tag.type === 'time') textColor = 'text-green-600';
                        else if (tag.type === 'timeBucket') textColor = 'text-blue-600';
                        else if (tag.type === 'priority') textColor = 'text-red-600';
                        else if (tag.type === 'owner') textColor = 'text-indigo-600';
                        
                        return (
                          <button
                            key={tag.id}
                            onClick={() => handleTagClick(index, tag)}
                            className={`inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-full text-xs ${textColor} font-medium hover:shadow-md transition-shadow active:scale-95`}
                          >
                            <span>{tag.emoji}</span>
                            <span>{tag.displayText}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteTask(index)}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    מחק
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Button (Fixed) - positioned above bottom nav */}
      {!isAddingTask && (
        <button
          onClick={() => setIsAddingTask(true)}
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
              <h2 className="text-lg font-semibold">משימה חדשה</h2>
              <button onClick={() => setIsAddingTask(false)}>
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
                        if (tag.type === 'involved') textColor = 'text-purple-600';
                        else if (tag.type === 'location') textColor = 'text-amber-600';
                        else if (tag.type === 'time') textColor = 'text-green-600';
                        else if (tag.type === 'timeBucket') textColor = 'text-blue-600';
                        else if (tag.type === 'priority') textColor = 'text-red-600';
                        else if (tag.type === 'owner') textColor = 'text-indigo-600';
                        
                        return (
                          <span
                            key={tag.id}
                            className={`inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm ${textColor} font-medium`}
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
              {/* Voice button */}
              <button
                onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors ${
                  isListening
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    <span>עצור הקלטה</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>דבר</span>
                  </>
                )}
              </button>

              {/* Add button */}
              <Button
                onClick={handleAddTask}
                disabled={!inputText.trim()}
                className="w-full py-3 text-base font-medium"
              >
                הוסף משימה
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
