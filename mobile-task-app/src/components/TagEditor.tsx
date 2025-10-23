import React from 'react';
import { X, Clock, Calendar, Users, MapPin, Car, AlertCircle } from 'lucide-react';
import { ExtractedTag, FamilyMemberName, TimeBucket, TimeValue, PriorityLevel } from '../types/mobileTask';
import { FAMILY_MEMBERS } from '../utils/patterns';

const TIME_BUCKET_LABELS: Record<TimeBucket, string> = {
  today: 'היום',
  tomorrow: 'מחר',
  'this-week': 'השבוע',
  'next-week': 'שבוע הבא',
  unlabeled: 'ללא תיוג',
};

type TagVisual = {
  color: string;
  bg: string;
  border: string;
  title: string;
};

interface TagEditorProps {
  tag: ExtractedTag;
  onUpdate: (newValue: any) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function TagEditor({ tag, onUpdate, onRemove, onClose }: TagEditorProps) {
  // Get tag styling based on type
  const getTagStyle = () => {
    switch (tag.type) {
      case 'timeBucket':
        return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', title: 'מתי?' };
      case 'time':
        return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', title: 'שעה' };
      case 'involved':
      case 'owner':
        return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', title: tag.type === 'owner' ? 'בעלים' : 'מעורבים' };
      case 'transport':
        return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', title: 'נסיעה' };
      case 'priority':
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', title: 'עדיפות' };
      case 'location':
        return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', title: 'מיקום' };
      case 'recurring':
        return { color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', title: 'חזרתיות' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', title: 'ערוך' };
    }
  };

  const style = getTagStyle();

  const renderEditor = () => {
    switch (tag.type) {
      case 'timeBucket':
        return <TimeBucketEditor value={tag.value as TimeBucket} onUpdate={onUpdate} onRemove={onRemove} />;
      
      case 'time':
        return <TimeEditor value={tag.value as TimeValue} onUpdate={onUpdate} onRemove={onRemove} />;
      
      case 'involved':
      case 'owner':
        return <FamilyMemberEditor value={tag.value as FamilyMemberName} onUpdate={onUpdate} onRemove={onRemove} type={tag.type} />;
      
      case 'transport':
        return <DriveTimeEditor value={tag.value as number} onUpdate={onUpdate} onRemove={onRemove} />;
      
      case 'priority':
        return <PriorityEditor value={tag.value as PriorityLevel} onUpdate={onUpdate} onRemove={onRemove} />;
      
      case 'location':
        return <LocationEditor value={tag.value as string} onUpdate={onUpdate} onRemove={onRemove} />;
      
      case 'recurring':
        return <RecurringEditor value={tag.value as any} onUpdate={onUpdate} onRemove={onRemove} />;
      
      default:
        return <div className="p-4 text-center text-gray-500">Editor not available</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Handle bar */}
        <div className="flex justify-center py-3 bg-white">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header - looks like a large tag */}
        <div className={`px-6 py-5 ${style.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${style.bg} border-2 ${style.border} flex items-center justify-center`}>
                <span className="text-3xl">{tag.emoji}</span>
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${style.color}`}>{style.title}</h3>
                <p className={`text-base ${style.color} opacity-70 mt-1`}>{tag.displayText}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className={`p-2 rounded-full transition-colors ${style.bg} hover:bg-white border ${style.border}`}
            >
              <X className={`w-5 h-5 ${style.color}`} />
            </button>
          </div>
        </div>

        {/* Editor content - continues the tag styling */}
        <div className={`flex-1 overflow-y-auto ${style.bg}`}>
          {renderEditor()}
        </div>
      </div>
    </div>
  );
}

// Time Bucket Editor
function TimeBucketEditor({ value, onUpdate, onRemove }: { value: TimeBucket; onUpdate: (v: TimeBucket) => void; onRemove: () => void }) {
  const options: { value: TimeBucket; label: string; icon: typeof Calendar }[] = [
    { value: 'today', label: 'היום', icon: Calendar },
    { value: 'tomorrow', label: 'מחר', icon: Calendar },
    { value: 'this-week', label: 'השבוע', icon: Calendar },
    { value: 'next-week', label: 'שבוע הבא', icon: Calendar },
  ];

  return (
    <div className="p-4 space-y-3">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onUpdate(option.value)}
          className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
            value === option.value
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <option.icon className="w-5 h-5 text-blue-600" />
          <span className="text-base font-medium">{option.label}</span>
        </button>
      ))}
      
      <button
        onClick={onRemove}
        className="w-full p-4 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
      >
        <X className="w-5 h-5" />
        <span>הסר תג</span>
      </button>
    </div>
  );
}

// Recurring Editor
function RecurringEditor({ value, onUpdate, onRemove }: { value: string | number[]; onUpdate: (v: string | number[]) => void; onRemove: () => void }) {
  const [selectedDays, setSelectedDays] = React.useState<number[]>([]);
  const [recurringType, setRecurringType] = React.useState<string>('none');

  // Initialize from value
  React.useEffect(() => {
    if (Array.isArray(value)) {
      // Array of weekday numbers
      setSelectedDays(value);
      setRecurringType('weekdays');
    } else if (typeof value === 'string') {
      if (value.startsWith('weekday-')) {
        const dayNum = parseInt(value.split('-')[1]);
        setSelectedDays([dayNum]);
        setRecurringType('weekdays');
      } else if (['morning', 'evening', 'afternoon', 'night'].includes(value)) {
        setRecurringType('time-of-day');
      } else {
        setRecurringType(value);
      }
    }
  }, [value]);

  const dayNames = [
    { num: 0, name: 'ראשון', short: 'א' },
    { num: 1, name: 'שני', short: 'ב' },
    { num: 2, name: 'שלישי', short: 'ג' },
    { num: 3, name: 'רביעי', short: 'ד' },
    { num: 4, name: 'חמישי', short: 'ה' },
    { num: 5, name: 'שישי', short: 'ו' },
    { num: 6, name: 'שבת', short: 'ש' },
  ];

  const toggleDay = (dayNum: number) => {
    const newDays = selectedDays.includes(dayNum)
      ? selectedDays.filter(d => d !== dayNum)
      : [...selectedDays, dayNum].sort();
    setSelectedDays(newDays);
  };

  const handleConfirm = () => {
    if (recurringType === 'weekdays' && selectedDays.length === 1) {
      onUpdate(`weekday-${selectedDays[0]}`);
    } else if (recurringType === 'weekdays' && selectedDays.length > 1) {
      // Multiple days - return the array
      onUpdate(selectedDays);
    } else {
      onUpdate(recurringType);
    }
  };

  const isWeekdaysMode = recurringType === 'weekdays';
  const needsConfirmButton = isWeekdaysMode && selectedDays.length > 0;

  return (
    <div className="p-4 space-y-4">
      {/* Quick options */}
      <div>
        <label className="text-sm text-gray-600 mb-2 block">בחר תדירות:</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setRecurringType('daily'); if (!isWeekdaysMode) onUpdate('daily'); }}
            className={`p-3 rounded-lg border-2 transition-all ${
              recurringType === 'daily'
                ? 'border-cyan-500 bg-cyan-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-sm font-medium">כל יום</span>
          </button>
          <button
            onClick={() => { setRecurringType('weekly'); if (!isWeekdaysMode) onUpdate('weekly'); }}
            className={`p-3 rounded-lg border-2 transition-all ${
              recurringType === 'weekly'
                ? 'border-cyan-500 bg-cyan-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-sm font-medium">כל שבוע</span>
          </button>
          <button
            onClick={() => { setRecurringType('monthly'); if (!isWeekdaysMode) onUpdate('monthly'); }}
            className={`p-3 rounded-lg border-2 transition-all ${
              recurringType === 'monthly'
                ? 'border-cyan-500 bg-cyan-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-sm font-medium">כל חודש</span>
          </button>
          <button
            onClick={() => setRecurringType('weekdays')}
            className={`p-3 rounded-lg border-2 transition-all ${
              recurringType === 'weekdays'
                ? 'border-cyan-500 bg-cyan-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-sm font-medium">ימים ספציפיים</span>
          </button>
        </div>
      </div>

      {/* Weekday selector - shows when "specific days" is selected */}
      {isWeekdaysMode && (
        <div>
          <label className="text-sm text-gray-600 mb-2 block">
            בחר ימים (ניתן לבחור כמה שרוצה):
          </label>
          <div className="grid grid-cols-7 gap-2">
            {dayNames.map((day) => (
              <button
                key={day.num}
                onClick={() => toggleDay(day.num)}
                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                  selectedDays.includes(day.num)
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-xs font-bold">{day.short}</span>
                <span className="text-[10px] mt-0.5">{day.name}</span>
              </button>
            ))}
          </div>
          
          {selectedDays.length > 0 && (
            <div className="mt-3 p-3 bg-cyan-50 rounded-lg text-sm text-cyan-700">
              נבחרו {selectedDays.length} ימים
            </div>
          )}
        </div>
      )}

      {/* Confirm button - only shows for multiple day selection */}
      {needsConfirmButton && (
        <button
          onClick={handleConfirm}
          className="w-full p-4 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
        >
          אישור
        </button>
      )}

      <button
        onClick={onRemove}
        className="w-full p-4 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
      >
        <X className="w-5 h-5" />
        <span>הסר תג</span>
      </button>
    </div>
  );
}

// Time Editor
function TimeEditor({ value, onUpdate, onRemove }: { value: TimeValue; onUpdate: (v: TimeValue) => void; onRemove: () => void }) {
  // Support both formats: { hour, minute } and { hours, minutes }
  const initialHour = (value as any)?.hour ?? (value as any)?.hours ?? 0;
  const initialMinute = (value as any)?.minute ?? (value as any)?.minutes ?? 0;
  
  const [hour, setHour] = React.useState<number>(initialHour);
  const [minute, setMinute] = React.useState<number>(initialMinute);

  const handleUpdate = () => {
    onUpdate({ hours: hour, minutes: minute, displayText: `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}` });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-4 items-center justify-center">
        
        {/* Minute - always on right */}
        <div className="flex flex-col items-center gap-2">
          <label className="text-sm text-gray-600">דקות</label>
          <input
            type="number"
            min="0"
            max="59"
            value={String(minute).padStart(2, '0')}
            onChange={(e) => {
              const val = e.target.value.replace(/^0+/, '') || '0';
              setMinute(Math.max(0, Math.min(59, parseInt(val) || 0)));
            }}
            className="w-20 p-3 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <span className="text-3xl font-bold text-gray-400 mt-6">:</span>
        
        {/* Hour - always on left */}
        <div className="flex flex-col items-center gap-2">
          <label className="text-sm text-gray-600">שעה</label>
          <input
            type="number"
            min="0"
            max="23"
            value={String(hour).padStart(2, '0')}
            onChange={(e) => {
              const val = e.target.value.replace(/^0+/, '') || '0';
              setHour(Math.max(0, Math.min(23, parseInt(val) || 0)));
            }}
            className="w-20 p-3 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <button
        onClick={handleUpdate}
        className="w-full p-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        עדכן
      </button>

      <button
        onClick={onRemove}
        className="w-full p-4 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all"
      >
        הסר תג
      </button>
    </div>
  );
}

// Family Member Editor
function FamilyMemberEditor({ value, onUpdate, onRemove, type }: { value: FamilyMemberName; onUpdate: (v: FamilyMemberName) => void; onRemove: () => void; type: 'involved' | 'owner' }) {
  const [selectedMembers, setSelectedMembers] = React.useState<FamilyMemberName[]>(
    type === 'involved' && Array.isArray(value) ? value : [value]
  );
  const [multiSelectMode, setMultiSelectMode] = React.useState(false);

  const toggleMember = (memberName: FamilyMemberName) => {
    if (type === 'owner' || !multiSelectMode) {
      // For owner, or single-select mode: immediately update and close
      onUpdate(memberName);
    } else {
      // For involved in multi-select mode: toggle selection
      const isSelected = selectedMembers.includes(memberName);
      const newSelection = isSelected
        ? selectedMembers.filter(m => m !== memberName)
        : [...selectedMembers, memberName];
      
      setSelectedMembers(newSelection);
    }
  };

  const handleMultiSelectToggle = () => {
    setMultiSelectMode(!multiSelectMode);
  };

  const handleDone = () => {
    if (type === 'involved' && selectedMembers.length > 0) {
      // For now, just update with the first selected
      onUpdate(selectedMembers[0]);
    }
  };

  const isSelected = (memberName: FamilyMemberName) => {
    if (!multiSelectMode) {
      return value === memberName;
    }
    return selectedMembers.includes(memberName);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">
          {type === 'owner' ? 'בחר בעלים:' : multiSelectMode ? 'בחר מעורבים (כמה שרוצה):' : 'בחר מעורב:'}
        </p>
        {type === 'involved' && (
          <button
            onClick={handleMultiSelectToggle}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {multiSelectMode ? 'בחירה בודדת' : 'בחירה מרובה'}
          </button>
        )}
      </div>

      {FAMILY_MEMBERS.map((member) => (
        <button
          key={member.name}
          onClick={() => toggleMember(member.name as FamilyMemberName)}
          className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
            isSelected(member.name as FamilyMemberName)
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300 active:scale-98'
          }`}
        >
          {multiSelectMode && (
            <div className="w-6 h-6 rounded border-2 flex items-center justify-center transition-colors">
              {isSelected(member.name as FamilyMemberName) && (
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          )}
          <Users className="w-5 h-5 text-purple-600" />
          <span className="text-base font-medium">{member.nameHe || member.name}</span>
          {member.isChild && <span className="text-xs text-gray-500">(ילד/ה)</span>}
        </button>
      ))}
      
      {multiSelectMode && selectedMembers.length > 1 && (
        <>
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            נבחרו {selectedMembers.length} אנשים: {selectedMembers.join(', ')}
          </div>
          
          <button
            onClick={handleDone}
            className="w-full p-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            אישור
          </button>
        </>
      )}
      
      <button
        onClick={onRemove}
        className="w-full p-4 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
      >
        <X className="w-5 h-5" />
        <span>הסר תג</span>
      </button>
    </div>
  );
}

// Drive Time Editor
function DriveTimeEditor({ value, onUpdate, onRemove }: { value: number; onUpdate: (v: number) => void; onRemove: () => void }) {
  const adjustTime = (delta: number) => {
    const newValue = Math.max(5, Math.min(120, value + delta));
    onUpdate(newValue);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <Car className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <div className="text-4xl font-bold text-gray-900 mb-2">{value}</div>
        <div className="text-gray-600">דקות נסיעה</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => adjustTime(-5)}
          className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
        >
          -5 דקות
        </button>
        <button
          onClick={() => adjustTime(5)}
          className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
        >
          +5 דקות
        </button>
        <button
          onClick={() => adjustTime(-15)}
          className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
        >
          -15 דקות
        </button>
        <button
          onClick={() => adjustTime(15)}
          className="p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
        >
          +15 דקות
        </button>
      </div>

      <button
        onClick={onRemove}
        className="w-full p-4 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all"
      >
        הסר תג
      </button>
    </div>
  );
}

// Priority Editor
function PriorityEditor({ value, onUpdate, onRemove }: { value: PriorityLevel; onUpdate: (v: PriorityLevel) => void; onRemove: () => void }) {
  const priorities: { value: PriorityLevel; label: string; color: string }[] = [
    { value: 'P1', label: 'עדיפות גבוהה', color: 'red' },
    { value: 'P2', label: 'עדיפות בינונית', color: 'orange' },
    { value: 'P3', label: 'עדיפות נמוכה', color: 'yellow' },
  ];

  return (
    <div className="p-4 space-y-3">
      {priorities.map((priority) => (
        <button
          key={priority.value}
          onClick={() => onUpdate(priority.value)}
          className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
            value === priority.value
              ? `border-${priority.color}-500 bg-${priority.color}-50`
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <AlertCircle className={`w-5 h-5 text-${priority.color}-600`} />
          <span className="text-base font-medium">{priority.label}</span>
          <span className="mr-auto text-sm font-mono">{priority.value}</span>
        </button>
      ))}
      
      <button
        onClick={onRemove}
        className="w-full p-4 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
      >
        <X className="w-5 h-5" />
        <span>הסר תג</span>
      </button>
    </div>
  );
}

// Location Editor
function LocationEditor({ value, onUpdate, onRemove }: { value: string; onUpdate: (v: string) => void; onRemove: () => void }) {
  const [customLocation, setCustomLocation] = React.useState(value || '');
  const [recentLocations] = React.useState<string[]>([
    'גן ילדים של אלון',
    'בית ספר של יעל',
  ]);
  const [favoriteLocations] = React.useState<string[]>([
    'הבית',
    'עבודה',
    'סופר',
    'פארק',
  ]);

  return (
    <div className="p-4 space-y-4">
      {/* Custom location input */}
      <div>
        <label className="text-sm text-gray-600 mb-2 block">כתוב מיקום:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            placeholder="הכנס מיקום..."
            className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => customLocation && onUpdate(customLocation)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            אישור
          </button>
        </div>
      </div>

      {/* Favorite locations */}
      {favoriteLocations.length > 0 && (
        <div>
          <label className="text-sm text-gray-600 mb-2 block">מועדפים:</label>
          <div className="grid grid-cols-2 gap-2">
            {favoriteLocations.map((location) => (
              <button
                key={location}
                onClick={() => onUpdate(location)}
                className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                  value === location
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <MapPin className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium">{location}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent locations */}
      {recentLocations.length > 0 && (
        <div>
          <label className="text-sm text-gray-600 mb-2 block">אחרונים:</label>
          <div className="space-y-2">
            {recentLocations.map((location) => (
              <button
                key={location}
                onClick={() => onUpdate(location)}
                className={`w-full p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                  value === location
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">{location}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map placeholder */}
      <div className="p-8 bg-gray-100 rounded-lg text-center">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">מפה בקרוב</p>
      </div>

      <button
        onClick={onRemove}
        className="w-full p-4 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
      >
        <X className="w-5 h-5" />
        <span>הסר תג</span>
      </button>
    </div>
  );
}
