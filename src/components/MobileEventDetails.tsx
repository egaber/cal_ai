import { CalendarEvent, RecurrenceRule, FamilyMember } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { describeRecurrence, validateRecurrenceRule } from "@/utils/recurrenceUtils";
import { ArrowLeft, RepeatIcon, Trash2Icon, Calendar, Clock } from "lucide-react";
import { llmService } from "@/services/llmService";
import { PRIMARY_COLOR } from "@/config/branding";

interface MobileEventDetailsProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onDeleteRecurring?: (recurringEventId: string, deleteAll: boolean) => void;
  familyMembers: FamilyMember[];
}

export const MobileEventDetails = ({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDeleteRecurring,
  familyMembers,
}: MobileEventDetailsProps) => {
  const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [],
  });
  const [endType, setEndType] = useState<'never' | 'date' | 'count'>('never');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'this' | 'all'>('this');

  useEffect(() => {
    if (event) {
      setEditedEvent({ ...event });
      
      const isRecurringEvent = !!event.recurrence;
      setIsRecurring(isRecurringEvent);
      
      if (isRecurringEvent && event.recurrence) {
        setRecurrence({ ...event.recurrence });
        
        if (event.recurrence.endDate) {
          setEndType('date');
        } else if (event.recurrence.count) {
          setEndType('count');
        } else {
          setEndType('never');
        }
      } else {
        setRecurrence({
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [],
        });
        setEndType('never');
      }
    }
  }, [event]);

  if (!editedEvent) return null;

  const isRecurringInstance = !!editedEvent.recurringEventId;
  const member = familyMembers.find(m => m.id === editedEvent.memberId);

  const handleSave = async () => {
    if (isRecurring) {
      const error = validateRecurrenceRule(recurrence);
      if (error) {
        alert(error);
        return;
      }
    }

    const titleChanged = editedEvent.title !== event?.title;
    const descriptionChanged = editedEvent.description !== event?.description;
    const categoryChanged = editedEvent.category !== event?.category;
    
    let emoji = editedEvent.emoji;
    
    if (titleChanged || descriptionChanged || categoryChanged) {
      emoji = await llmService.generateEventEmoji(
        editedEvent.title,
        editedEvent.description || '',
        editedEvent.category
      );
    }

    const updatedEvent: CalendarEvent = {
      ...editedEvent,
      emoji,
      recurrence: isRecurring ? recurrence : undefined,
    };

    onSave(updatedEvent);
    onClose();
  };

  const handleDelete = () => {
    if (isRecurringInstance && onDeleteRecurring && editedEvent.recurringEventId) {
      setShowDeleteConfirm(true);
    } else {
      if (confirm('Delete this event?')) {
        onDelete(editedEvent.id);
        onClose();
      }
    }
  };

  const handleConfirmDelete = () => {
    if (isRecurringInstance && onDeleteRecurring && editedEvent.recurringEventId) {
      onDeleteRecurring(editedEvent.recurringEventId, deleteOption === 'all');
    } else {
      onDelete(editedEvent.id);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDayOfWeekToggle = (day: number) => {
    const current = recurrence.daysOfWeek || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort();
    setRecurrence({ ...recurrence, daysOfWeek: updated });
  };

  const formatDateTimeForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 z-[100]' : 'opacity-0 pointer-events-none z-[-1]'
        }`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className={`fixed inset-0 bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0 z-[101]' : 'translate-x-full z-[-1]'
        }`}
      >
        {/* Compact Header */}
        <div 
          className="pt-[40px] pb-3 px-4 border-b"
          style={{ 
            background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_COLOR} 100%)`
          }}
        >
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 -ml-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-white/20 text-white hover:bg-white/30 backdrop-blur"
            >
              Save
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-100px)] overflow-y-auto pb-6">
          {/* Event Title & Emoji */}
          <div className="p-4 pb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-4xl">{editedEvent.emoji}</div>
              <Input
                value={editedEvent.title}
                onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                className="text-xl font-bold border-0 px-0 focus-visible:ring-0 flex-1"
                placeholder="Event title"
              />
            </div>
            
            {member && (
              <div className="flex items-center gap-2 pl-1">
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name[0]}
                </div>
                <span className="text-sm text-muted-foreground">{member.name}</span>
              </div>
            )}
          </div>

          {/* Date & Time - Compact */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 space-y-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={editedEvent.startTime.slice(0, 10)}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  const oldStart = new Date(editedEvent.startTime);
                  newDate.setHours(oldStart.getHours(), oldStart.getMinutes());
                  const duration = new Date(editedEvent.endTime).getTime() - oldStart.getTime();
                  setEditedEvent({
                    ...editedEvent,
                    startTime: newDate.toISOString(),
                    endTime: new Date(newDate.getTime() + duration).toISOString(),
                  });
                }}
                className="flex-1 border-0 bg-transparent text-sm focus-visible:ring-0"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="time"
                  value={editedEvent.startTime.slice(11, 16)}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newStart = new Date(editedEvent.startTime);
                    newStart.setHours(parseInt(hours), parseInt(minutes));
                    const newEnd = new Date(newStart.getTime() + (2 * 60 * 60 * 1000)); // 2 hours later
                    setEditedEvent({
                      ...editedEvent,
                      startTime: newStart.toISOString(),
                      endTime: newEnd.toISOString(),
                    });
                  }}
                  className="border-0 bg-transparent text-sm focus-visible:ring-0 flex-1"
                />
                <span className="text-muted-foreground flex-shrink-0">→</span>
                <Input
                  type="time"
                  value={editedEvent.endTime.slice(11, 16)}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    const newEnd = new Date(editedEvent.endTime);
                    newEnd.setHours(parseInt(hours), parseInt(minutes));
                    setEditedEvent({
                      ...editedEvent,
                      endTime: newEnd.toISOString(),
                    });
                  }}
                  className="border-0 bg-transparent text-sm focus-visible:ring-0 flex-1"
                />
              </div>
            </div>
          </div>

          {/* Category & Priority - Compact */}
          <div className="px-4 py-3 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground px-1">Category</label>
              <Select
                value={editedEvent.category}
                onValueChange={(value: CalendarEvent['category']) =>
                  setEditedEvent({ ...editedEvent, category: value })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">🏥 Health</SelectItem>
                  <SelectItem value="work">💼 Work</SelectItem>
                  <SelectItem value="personal">👤 Personal</SelectItem>
                  <SelectItem value="family">👨‍👩‍👧‍👦 Family</SelectItem>
                  <SelectItem value="education">📚 Education</SelectItem>
                  <SelectItem value="social">🎉 Social</SelectItem>
                  <SelectItem value="fitness">💪 Fitness</SelectItem>
                  <SelectItem value="food">🍽️ Food</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground px-1">Priority</label>
              <Select
                value={editedEvent.priority}
                onValueChange={(value: CalendarEvent['priority']) =>
                  setEditedEvent({ ...editedEvent, priority: value })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="px-4 py-2">
            <Textarea
              value={editedEvent.description || ''}
              onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
              rows={3}
              placeholder="Add description..."
              className="resize-none text-sm"
            />
          </div>

          {/* Repeat Toggle */}
          {!isRecurringInstance && (
            <div className="px-4 py-3 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RepeatIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Repeat</span>
                </div>
                <Checkbox
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                />
              </div>

              {isRecurring && (
                <div className="mt-3 space-y-3 pl-6">
                  <Select
                    value={recurrence.frequency}
                    onValueChange={(value: RecurrenceRule['frequency']) =>
                      setRecurrence({ ...recurrence, frequency: value })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>

                  {recurrence.frequency === 'weekly' && (
                    <div className="flex gap-1">
                      {dayNames.map((day, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant={recurrence.daysOfWeek?.includes(index) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDayOfWeekToggle(index)}
                          className="flex-1 h-8 text-xs"
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    {describeRecurrence(recurrence)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Delete Button */}
          <div className="px-4 pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full h-10"
              size="sm"
            >
              <Trash2Icon className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[102]">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full p-6 space-y-4 animate-in slide-in-from-bottom">
            <h3 className="text-lg font-bold">Delete Recurring Event?</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => setDeleteOption('this')}
                className={`w-full p-3 rounded-lg border-2 text-left text-sm ${
                  deleteOption === 'this' ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                <div className="font-semibold">This occurrence only</div>
              </button>

              <button
                onClick={() => setDeleteOption('all')}
                className={`w-full p-3 rounded-lg border-2 text-left text-sm ${
                  deleteOption === 'all' ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                <div className="font-semibold">All occurrences</div>
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
