import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  MapPin,
  Flag,
  Repeat,
  Bell,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Plus,
} from 'lucide-react';
import { format, addDays, parseISO, setHours, setMinutes } from 'date-fns';
import { he } from 'date-fns/locale';
import { categoryBadgeClasses, getCategoryEmoji, getCategoryName } from '@/config/taskCategories';
import SmartTextInput from './SmartTextInput';

// Intelligent text parsing utilities
interface ParsedElements {
  text: string;
  dates: Array<{ match: string; date: Date; position: number }>;
  times: Array<{ match: string; time: { hour: number; minute: number }; position: number }>;
  locations: Array<{ match: string; location: string; position: number }>;
  priorities: Array<{ match: string; priority: 'P1' | 'P2' | 'P3'; position: number }>;
  cleanedText: string;
}

interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
  occurrences?: number;
}

interface Reminder {
  id: string;
  time: number; // minutes before task
  enabled: boolean;
}

const parseTaskInput = (text: string, lang: 'he' | 'en' = 'he'): ParsedElements => {
  const dates: ParsedElements['dates'] = [];
  const times: ParsedElements['times'] = [];
  const locations: ParsedElements['locations'] = [];
  const priorities: ParsedElements['priorities'] = [];

  let cleanedText = text;

  // Priority patterns (P1, P2, P3)
  const priorityRegex = /\b[Pp][123]\b/g;
  let match;
  while ((match = priorityRegex.exec(text)) !== null) {
    const priority = match[0].toUpperCase() as 'P1' | 'P2' | 'P3';
    priorities.push({
      match: match[0],
      priority,
      position: match.index,
    });
    cleanedText = cleanedText.replace(match[0], '');
  }

  // Hebrew date patterns
  if (lang === 'he') {
    // Tomorrow: מחר
    const tomorrowRegex = /\bמחר\b/gi;
    while ((match = tomorrowRegex.exec(text)) !== null) {
      dates.push({
        match: match[0],
        date: addDays(new Date(), 1),
        position: match.index,
      });
      cleanedText = cleanedText.replace(match[0], '');
    }

    // Today: היום, הערב
    const todayRegex = /\b(היום|הערב)\b/gi;
    while ((match = todayRegex.exec(text)) !== null) {
      dates.push({
        match: match[0],
        date: new Date(),
        position: match.index,
      });
      cleanedText = cleanedText.replace(match[0], '');
    }

    // Days of week: יום ראשון, יום שני, etc.
    const daysOfWeek = [
      { name: 'ראשון', day: 0 },
      { name: 'שני', day: 1 },
      { name: 'שלישי', day: 2 },
      { name: 'רביעי', day: 3 },
      { name: 'חמישי', day: 4 },
      { name: 'שישי', day: 5 },
      { name: 'שבת', day: 6 },
    ];

    daysOfWeek.forEach(({ name, day }) => {
      const regex = new RegExp(`\\b(יום )?${name}\\b`, 'gi');
      while ((match = regex.exec(text)) !== null) {
        const today = new Date();
        const currentDay = today.getDay();
        let daysToAdd = day - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        
        dates.push({
          match: match[0],
          date: addDays(today, daysToAdd),
          position: match.index,
        });
        cleanedText = cleanedText.replace(match[0], '');
      }
    });

    // Time patterns: בשעה 14:00, ב-15:30
    const timeRegex = /\b(?:בשעה|ב-?)\s*(\d{1,2}):(\d{2})\b/gi;
    while ((match = timeRegex.exec(text)) !== null) {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
        times.push({
          match: match[0],
          time: { hour, minute },
          position: match.index,
        });
        cleanedText = cleanedText.replace(match[0], '');
      }
    }

    // Location patterns: ב-, בבית, במשרד
    const locationRegex = /\b(?:ב|במקום|בבית|במשרד|ב-)\s*([א-ת\s]+?)(?=\s|$)/gi;
    while ((match = locationRegex.exec(text)) !== null) {
      const location = match[1].trim();
      if (location.length > 2) {
        locations.push({
          match: match[0],
          location: match[0],
          position: match.index,
        });
      }
    }
  } else {
    // English patterns
    const tomorrowRegex = /\btomorrow\b/gi;
    while ((match = tomorrowRegex.exec(text)) !== null) {
      dates.push({
        match: match[0],
        date: addDays(new Date(), 1),
        position: match.index,
      });
      cleanedText = cleanedText.replace(match[0], '');
    }

    const todayRegex = /\btoday\b/gi;
    while ((match = todayRegex.exec(text)) !== null) {
      dates.push({
        match: match[0],
        date: new Date(),
        position: match.index,
      });
      cleanedText = cleanedText.replace(match[0], '');
    }

    // Time patterns: at 2:00 PM, at 14:30
    const timeRegex = /\bat\s*(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\b/gi;
    while ((match = timeRegex.exec(text)) !== null) {
      let hour = parseInt(match[1]);
      const minute = parseInt(match[2]);
      const meridiem = match[3]?.toUpperCase();

      if (meridiem === 'PM' && hour < 12) hour += 12;
      if (meridiem === 'AM' && hour === 12) hour = 0;

      if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
        times.push({
          match: match[0],
          time: { hour, minute },
          position: match.index,
        });
        cleanedText = cleanedText.replace(match[0], '');
      }
    }

    // Location patterns: at, in
    const locationRegex = /\b(?:at|in)\s+([A-Za-z\s]+?)(?=\s|$)/gi;
    while ((match = locationRegex.exec(text)) !== null) {
      const location = match[1].trim();
      if (location.length > 2) {
        locations.push({
          match: match[0],
          location: match[0],
          position: match.index,
        });
      }
    }
  }

  // Date patterns (DD/MM/YYYY, YYYY-MM-DD)
  const dateRegex = /\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})\b/g;
  while ((match = dateRegex.exec(text)) !== null) {
    try {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      let year = parseInt(match[3]);
      if (year < 100) year += 2000;

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        dates.push({
          match: match[0],
          date,
          position: match.index,
        });
        cleanedText = cleanedText.replace(match[0], '');
      }
    } catch (e) {
      // Invalid date, skip
    }
  }

  // Clean up extra spaces
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

  return {
    text,
    dates,
    times,
    locations,
    priorities,
    cleanedText,
  };
};

interface TaskData {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  deadline?: string;
  location?: string;
  urgency?: string;
  importance?: string;
  priority?: number;
  recurrence?: RecurrencePattern | null;
  reminders?: Reminder[];
}

interface TaskCreationProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: TaskData) => void;
  initialData?: TaskData;
}

export default function TaskCreation({ open, onClose, onSave, initialData }: TaskCreationProps) {
  const [inputText, setInputText] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<{ hour: number; minute: number } | null>(null);
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<'P1' | 'P2' | 'P3' | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrencePattern>({
    frequency: null,
    interval: 1,
  });
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', time: 15, enabled: true },
  ]);
  const [lang, setLang] = useState<'he' | 'en'>('he');

  // Parse input text in real-time
  const parsed = useMemo(() => parseTaskInput(inputText, lang), [inputText, lang]);

  // Auto-apply parsed values
  useEffect(() => {
    if (parsed.dates.length > 0 && !selectedDate) {
      setSelectedDate(parsed.dates[0].date);
    }
    if (parsed.times.length > 0 && !selectedTime) {
      setSelectedTime(parsed.times[0].time);
    }
    if (parsed.locations.length > 0 && !location) {
      setLocation(parsed.locations[0].location);
    }
    if (parsed.priorities.length > 0 && !priority) {
      setPriority(parsed.priorities[0].priority);
    }
  }, [parsed]);

  // Initialize with existing data if editing
  useEffect(() => {
    if (initialData && open) {
      setInputText(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category || 'other');
      if (initialData.deadline) {
        setSelectedDate(new Date(initialData.deadline));
      }
      setLocation(initialData.location || '');
      // Map urgency to priority
      const urgencyMap: Record<string, 'P1' | 'P2' | 'P3'> = {
        critical: 'P1',
        high: 'P1',
        medium: 'P2',
        low: 'P3',
      };
      setPriority(urgencyMap[initialData.urgency] || null);
    } else if (!open) {
      // Reset form when closed
      setInputText('');
      setDescription('');
      setCategory('other');
      setSelectedDate(null);
      setSelectedTime(null);
      setLocation('');
      setPriority(null);
      setIsRecurring(false);
      setRecurrence({ frequency: null, interval: 1 });
      setReminders([{ id: '1', time: 15, enabled: true }]);
    }
  }, [initialData, open]);

  const handleSave = () => {
    let deadline: Date | undefined;
    if (selectedDate) {
      deadline = new Date(selectedDate);
      if (selectedTime) {
        deadline = setHours(setMinutes(deadline, selectedTime.minute), selectedTime.hour);
      }
    }

    const priorityMap: Record<string, { urgency: string; importance: string }> = {
      P1: { urgency: 'critical', importance: 'high' },
      P2: { urgency: 'medium', importance: 'medium' },
      P3: { urgency: 'low', importance: 'low' },
    };

    const mappedPriority = priority ? priorityMap[priority] : { urgency: 'medium', importance: 'medium' };

    const task = {
      ...initialData,
      title: parsed.cleanedText || inputText,
      description,
      category,
      deadline: deadline?.toISOString(),
      location,
      urgency: mappedPriority.urgency,
      importance: mappedPriority.importance,
      priority: priority === 'P1' ? 90 : priority === 'P2' ? 50 : 30,
      recurrence: isRecurring ? recurrence : null,
      reminders: reminders.filter(r => r.enabled),
    };

    onSave(task);
    onClose();
  };

  const addReminder = () => {
    const newId = String(Date.now());
    setReminders([...reminders, { id: newId, time: 30, enabled: true }]);
  };

  const removeReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const updateReminder = (id: string, time: number) => {
    setReminders(reminders.map(r => (r.id === id ? { ...r, time } : r)));
  };

  const toggleReminder = (id: string) => {
    setReminders(reminders.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const categories = [
    'health', 'work', 'personal', 'family', 'education', 'social',
    'finance', 'home', 'travel', 'fitness', 'food', 'shopping',
    'entertainment', 'sports', 'hobby', 'volunteer', 'appointment',
    'maintenance', 'celebration', 'meeting', 'childcare', 'pet',
    'errand', 'transport', 'project', 'deadline', 'other'
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            {initialData ? 'עריכת משימה' : 'משימה חדשה'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Language Toggle */}
          <div className="flex items-center gap-2 justify-end">
            <Label className="text-xs">שפה:</Label>
            <div className="flex gap-1">
              <Button
                variant={lang === 'he' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLang('he')}
                className="h-7 px-3 text-xs"
              >
                עברית
              </Button>
              <Button
                variant={lang === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLang('en')}
                className="h-7 px-3 text-xs"
              >
                English
              </Button>
            </div>
          </div>

          {/* Smart Input with Live Inline Highlighting */}
          <div className="space-y-2">
            <Label>כותרת המשימה *</Label>
            <SmartTextInput
              value={inputText}
              onChange={(newText, segments) => {
                setInputText(newText);
                
                // Auto-extract from segments
                const dateSegment = segments.find(s => s.type === 'date');
                const timeSegment = segments.find(s => s.type === 'time');
                const locationSegment = segments.find(s => s.type === 'location');
                const prioritySegment = segments.find(s => s.type === 'priority');
                
                if (dateSegment && dateSegment.value instanceof Date && !selectedDate) {
                  setSelectedDate(dateSegment.value);
                }
                
                if (timeSegment && typeof timeSegment.value === 'object' && 'hour' in timeSegment.value && !selectedTime) {
                  setSelectedTime(timeSegment.value);
                }
                
                if (locationSegment && typeof locationSegment.value === 'string' && !location) {
                  setLocation(locationSegment.value);
                }
                
                if (prioritySegment && typeof prioritySegment.value === 'string') {
                  const priorityValue = prioritySegment.value as 'P1' | 'P2' | 'P3';
                  if (!priority) {
                    setPriority(priorityValue);
                  }
                }
              }}
              placeholder={lang === 'he' ? "לדוגמה: פגישה עם דני מחר בשעה 14:00 במשרד P1" : "e.g., Meeting with Danny tomorrow at 2:00 PM at office P1"}
              lang={lang}
              className="text-right"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>תיאור</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="פרטים נוספים על המשימה..."
              className="min-h-[80px] text-right"
              dir="rtl"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>קטגוריה</Label>
            <div className="grid grid-cols-4 gap-2">
              {categories.slice(0, 12).map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className="h-auto py-2 px-2 flex flex-col items-center gap-1"
                >
                  <span className="text-lg">{getCategoryEmoji(cat)}</span>
                  <span className="text-[10px]">{getCategoryName(cat)}</span>
                </Button>
              ))}
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="text-right">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <div className="flex items-center gap-2">
                      <span>{getCategoryEmoji(cat)}</span>
                      <span>{getCategoryName(cat)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                תאריך
              </Label>
              <Input
                type="date"
                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setSelectedDate(e.target.value ? parseISO(e.target.value) : null)}
                className="text-right"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                שעה
              </Label>
              <Input
                type="time"
                value={selectedTime ? `${String(selectedTime.hour).padStart(2, '0')}:${String(selectedTime.minute).padStart(2, '0')}` : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const [hour, minute] = e.target.value.split(':').map(Number);
                    setSelectedTime({ hour, minute });
                  } else {
                    setSelectedTime(null);
                  }
                }}
                className="text-right"
                dir="rtl"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              מיקום
            </Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="כתובת או שם מקום..."
              className="text-right"
              dir="rtl"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Flag className="h-3 w-3" />
              עדיפות
            </Label>
            <div className="flex gap-2">
              <Button
                variant={priority === 'P1' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriority('P1')}
                className={priority === 'P1' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300'}
              >
                P1 - קריטי
              </Button>
              <Button
                variant={priority === 'P2' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriority('P2')}
                className={priority === 'P2' ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-yellow-300'}
              >
                P2 - בינוני
              </Button>
              <Button
                variant={priority === 'P3' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriority('P3')}
                className={priority === 'P3' ? 'bg-green-600 hover:bg-green-700' : 'border-green-300'}
              >
                P3 - נמוך
              </Button>
              {priority && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPriority(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Recurring Task */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                משימה חוזרת
              </Label>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>

            {isRecurring && (
              <Card className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">תדירות</Label>
                    <Select
                      value={recurrence.frequency || ''}
                      onValueChange={(v) => setRecurrence({ ...recurrence, frequency: v as 'daily' | 'weekly' | 'monthly' | 'yearly' })}
                    >
                      <SelectTrigger className="text-right text-xs">
                        <SelectValue placeholder="בחר..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">יומי</SelectItem>
                        <SelectItem value="weekly">שבועי</SelectItem>
                        <SelectItem value="monthly">חודשי</SelectItem>
                        <SelectItem value="yearly">שנתי</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">כל</Label>
                    <Input
                      type="number"
                      min={1}
                      value={recurrence.interval}
                      onChange={(e) => setRecurrence({ ...recurrence, interval: Number(e.target.value) })}
                      className="text-right text-xs"
                      dir="rtl"
                    />
                  </div>
                </div>

                {recurrence.frequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label className="text-xs">ימים בשבוע</Label>
                    <div className="flex gap-1 flex-wrap">
                      {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day, idx) => {
                        const isSelected = recurrence.daysOfWeek?.includes(idx);
                        return (
                          <Button
                            key={idx}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 w-8 p-0 text-xs"
                            onClick={() => {
                              const days = recurrence.daysOfWeek || [];
                              const newDays = isSelected
                                ? days.filter(d => d !== idx)
                                : [...days, idx];
                              setRecurrence({ ...recurrence, daysOfWeek: newDays });
                            }}
                          >
                            {day}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">סיום</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={recurrence.endDate ? format(recurrence.endDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setRecurrence({
                        ...recurrence,
                        endDate: e.target.value ? parseISO(e.target.value) : undefined,
                      })}
                      placeholder="תאריך סיום"
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={recurrence.occurrences || ''}
                      onChange={(e) => setRecurrence({
                        ...recurrence,
                        occurrences: e.target.value ? Number(e.target.value) : undefined,
                      })}
                      placeholder="מספר חזרות"
                      className="text-xs"
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Reminders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                תזכורות
              </Label>
              <Button variant="outline" size="sm" onClick={addReminder}>
                <Plus className="h-3 w-3 ml-1" />
                הוסף
              </Button>
            </div>

            <div className="space-y-2">
              {reminders.map((reminder) => (
                <Card key={reminder.id} className="p-2 flex items-center gap-2">
                  <Checkbox
                    checked={reminder.enabled}
                    onCheckedChange={() => toggleReminder(reminder.id)}
                  />
                  <Input
                    type="number"
                    min={1}
                    value={reminder.time}
                    onChange={(e) => updateReminder(reminder.id, Number(e.target.value))}
                    disabled={!reminder.enabled}
                    className="h-8 w-20 text-xs"
                  />
                  <span className="text-xs text-gray-600">דקות לפני</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReminder(reminder.id)}
                    className="mr-auto"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              ביטול
            </Button>
            <Button
              onClick={handleSave}
              disabled={!inputText.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Check className="h-4 w-4 ml-1" />
              {initialData ? 'עדכן' : 'צור משימה'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
