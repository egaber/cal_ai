import React from 'react';
import { X, Clock, Calendar, Users, MapPin, Car, AlertCircle } from 'lucide-react';
import { ExtractedTag, FamilyMemberName, TimeBucket, TimeValue, PriorityLevel } from '../types/mobileTask';
import { FAMILY_MEMBERS } from '../utils/patterns';

interface TagEditorProps {
  tag: ExtractedTag;
  onUpdate: (newValue: any) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function TagEditor({ tag, onUpdate, onRemove, onClose }: TagEditorProps) {
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
        return <div className="p-4 text-center text-gray-500">Location editor coming soon</div>;
      
      default:
        return <div className="p-4 text-center text-gray-500">Editor not available</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Handle bar */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">ערוך תג</h3>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Editor content */}
        <div className="flex-1 overflow-y-auto">
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

// Time Editor
function TimeEditor({ value, onUpdate, onRemove }: { value: TimeValue; onUpdate: (v: TimeValue) => void; onRemove: () => void }) {
  const [hour, setHour] = React.useState(value.hour || 0);
  const [minute, setMinute] = React.useState(value.minute || 0);

  const handleUpdate = () => {
    onUpdate({ hour, minute });
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
