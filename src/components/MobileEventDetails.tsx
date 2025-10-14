import { CalendarEvent, RecurrenceRule, FamilyMember } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, RepeatIcon, Trash2Icon, Save } from "lucide-react";
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

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDisplayTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      {/* Backdrop with blur */}
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
        {/* Header */}
        <div 
          className="sticky top-0 z-10 border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur"
          style={{ 
            background: `linear-gradient(to right, ${PRIMARY_COLOR}, #e91e63)`
          }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-white text-pink-600 hover:bg-white/90"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-60px)] overflow-y-auto pb-20">
          <div className="p-4 space-y-6">
            {/* Event Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="text-5xl">{editedEvent.emoji}</div>
                <div className="flex-1">
                  <Input
                    value={editedEvent.title}
                    onChange={(e) =>
                      setEditedEvent({ ...editedEvent, title: e.target.value })
                    }
                    className="text-2xl font-bold border-0 px-0 focus-visible:ring-0"
                    placeholder="Event title"
                  />
                </div>
              </div>
              
              {member && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name[0]}
                  </div>
                  <span>{member.name}</span>
                </div>
              )}
            </div>

            {isRecurringInstance && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <RepeatIcon className="h-5 w-5" />
                  <span className="font-semibold">Recurring Event</span>
                </div>
                <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                  This is part of a recurring series. Changes will only affect this occurrence.
                </p>
              </div>
            )}

            {/* Date & Time */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Date & Time</h3>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">START</Label>
                  <Input
                    type="datetime-local"
                    value={formatDateTimeForInput(editedEvent.startTime)}
                    onChange={(e) =>
                      setEditedEvent({
                        ...editedEvent,
                        startTime: new Date(e.target.value).toISOString(),
                      })
                    }
                    className="mt-1"
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDisplayDate(editedEvent.startTime)} at {formatDisplayTime(editedEvent.startTime)}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">END</Label>
                  <Input
                    type="datetime-local"
                    value={formatDateTimeForInput(editedEvent.endTime)}
                    onChange={(e) =>
                      setEditedEvent({
                        ...editedEvent,
                        endTime: new Date(e.target.value).toISOString(),
                      })
                    }
                    className="mt-1"
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDisplayDate(editedEvent.endTime)} at {formatDisplayTime(editedEvent.endTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Category & Priority */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">CATEGORY</Label>
                  <Select
                    value={editedEvent.category}
                    onValueChange={(value: CalendarEvent['category']) =>
                      setEditedEvent({ ...editedEvent, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">PRIORITY</Label>
                  <Select
                    value={editedEvent.priority}
                    onValueChange={(value: CalendarEvent['priority']) =>
                      setEditedEvent({ ...editedEvent, priority: value })
                    }
                  >
                    <SelectTrigger>
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
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">DESCRIPTION</Label>
              <Textarea
                value={editedEvent.description || ''}
                onChange={(e) =>
                  setEditedEvent({ ...editedEvent, description: e.target.value })
                }
                rows={4}
                placeholder="Add details about this event..."
                className="resize-none"
              />
            </div>

            {/* Recurring Event Section */}
            {!isRecurringInstance && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RepeatIcon className="h-5 w-5 text-muted-foreground" />
                    <Label htmlFor="recurring" className="text-base font-semibold">
                      Repeat
                    </Label>
                  </div>
                  <Checkbox
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                  />
                </div>

                {isRecurring && (
                  <div className="space-y-4 pl-4 border-l-2" style={{ borderColor: PRIMARY_COLOR }}>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">FREQUENCY</Label>
                        <Select
                          value={recurrence.frequency}
                          onValueChange={(value: RecurrenceRule['frequency']) =>
                            setRecurrence({ ...recurrence, frequency: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">REPEAT EVERY</Label>
                        <Input
                          type="number"
                          min="1"
                          value={recurrence.interval}
                          onChange={(e) =>
                            setRecurrence({ ...recurrence, interval: parseInt(e.target.value) || 1 })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {recurrence.frequency === 'weekly' && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">REPEAT ON</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {dayNames.map((day, index) => (
                            <Button
                              key={index}
                              type="button"
                              variant={recurrence.daysOfWeek?.includes(index) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleDayOfWeekToggle(index)}
                              className="flex-1 min-w-[40px]"
                              style={recurrence.daysOfWeek?.includes(index) ? {
                                backgroundColor: PRIMARY_COLOR,
                                borderColor: PRIMARY_COLOR
                              } : {}}
                            >
                              {day}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs text-muted-foreground">ENDS</Label>
                      <Select
                        value={endType}
                        onValueChange={(value: 'never' | 'date' | 'count') => {
                          setEndType(value);
                          if (value === 'never') {
                            setRecurrence({ ...recurrence, endDate: undefined, count: undefined });
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">Never</SelectItem>
                          <SelectItem value="date">On Date</SelectItem>
                          <SelectItem value="count">After Occurrences</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {endType === 'date' && (
                      <div>
                        <Label className="text-xs text-muted-foreground">END DATE</Label>
                        <Input
                          type="date"
                          value={recurrence.endDate?.slice(0, 10) || ''}
                          onChange={(e) =>
                            setRecurrence({
                              ...recurrence,
                              endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                              count: undefined,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    )}

                    {endType === 'count' && (
                      <div>
                        <Label className="text-xs text-muted-foreground">OCCURRENCES</Label>
                        <Input
                          type="number"
                          min="1"
                          value={recurrence.count || ''}
                          onChange={(e) =>
                            setRecurrence({
                              ...recurrence,
                              count: parseInt(e.target.value) || undefined,
                              endDate: undefined,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    )}

                    <div className="text-sm bg-muted p-3 rounded-lg">
                      <strong>Pattern:</strong> {describeRecurrence(recurrence)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delete Button */}
            <div className="pt-4">
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="w-full"
                size="lg"
              >
                <Trash2Icon className="h-5 w-5 mr-2" />
                Delete Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation for Recurring */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[102]">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-md p-6 space-y-4 animate-in slide-in-from-bottom">
            <h3 className="text-xl font-bold">Delete Recurring Event</h3>
            <p className="text-muted-foreground">
              This event is part of a recurring series. What would you like to delete?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => setDeleteOption('this')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  deleteOption === 'this'
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
                }`}
              >
                <div className="font-semibold">Only this occurrence</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Delete just this event
                </div>
              </button>

              <button
                onClick={() => setDeleteOption('all')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  deleteOption === 'all'
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
                }`}
              >
                <div className="font-semibold">All occurrences</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Delete the entire recurring series
                </div>
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
