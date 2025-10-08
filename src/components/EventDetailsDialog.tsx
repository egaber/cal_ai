import { CalendarEvent, RecurrenceRule } from "@/types/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { RepeatIcon, Trash2Icon } from "lucide-react";

interface EventDetailsDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onDeleteRecurring?: (recurringEventId: string, deleteAll: boolean) => void;
}

export const EventDetailsDialog = ({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDeleteRecurring,
}: EventDetailsDialogProps) => {
  const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [],
  });
  const [endType, setEndType] = useState<'never' | 'date' | 'count'>('never');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'this' | 'all'>('this');
  const [showEditScopeDialog, setShowEditScopeDialog] = useState(false);
  const [editScope, setEditScope] = useState<'this' | 'all'>('this');
  const [pendingUpdate, setPendingUpdate] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (event) {
      setEditedEvent({ ...event });
      
      // Check if this is a recurring event
      const isRecurringEvent = !!event.recurrence;
      setIsRecurring(isRecurringEvent);
      
      if (isRecurringEvent && event.recurrence) {
        setRecurrence({ ...event.recurrence });
        
        // Determine end type
        if (event.recurrence.endDate) {
          setEndType('date');
        } else if (event.recurrence.count) {
          setEndType('count');
        } else {
          setEndType('never');
        }
      } else {
        // Reset recurrence for non-recurring events
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

  const handleSave = () => {
    // Validate recurrence if enabled
    if (isRecurring) {
      const error = validateRecurrenceRule(recurrence);
      if (error) {
        alert(error);
        return;
      }
    }

    const updatedEvent: CalendarEvent = {
      ...editedEvent,
      recurrence: isRecurring ? recurrence : undefined,
    };

    onSave(updatedEvent);
    onClose();
  };

  const handleDelete = () => {
    if (isRecurringInstance && onDeleteRecurring && editedEvent.recurringEventId) {
      // Show dialog to choose delete option
      setShowDeleteDialog(true);
    } else {
      // Simple delete for non-recurring events
      onDelete(editedEvent.id);
      onClose();
    }
  };

  const handleConfirmDelete = () => {
    if (isRecurringInstance && onDeleteRecurring && editedEvent.recurringEventId) {
      onDeleteRecurring(editedEvent.recurringEventId, deleteOption === 'all');
    } else {
      onDelete(editedEvent.id);
    }
    setShowDeleteDialog(false);
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

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isRecurringInstance ? 'Edit Recurring Event Instance' : 'Event Details'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isRecurringInstance && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100">
                <div className="flex items-center gap-2">
                  <RepeatIcon className="h-4 w-4" />
                  <span className="font-medium">This is part of a recurring event</span>
                </div>
                <p className="mt-1 text-xs opacity-80">
                  Editing this instance will only affect this occurrence. To edit all occurrences, you need to edit the parent event.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedEvent.title}
                onChange={(e) =>
                  setEditedEvent({ ...editedEvent, title: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formatDateTimeForInput(editedEvent.startTime)}
                  onChange={(e) =>
                    setEditedEvent({
                      ...editedEvent,
                      startTime: new Date(e.target.value).toISOString(),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formatDateTimeForInput(editedEvent.endTime)}
                  onChange={(e) =>
                    setEditedEvent({
                      ...editedEvent,
                      endTime: new Date(e.target.value).toISOString(),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={editedEvent.category}
                  onValueChange={(value: CalendarEvent['category']) =>
                    setEditedEvent({ ...editedEvent, category: value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={editedEvent.priority}
                  onValueChange={(value: CalendarEvent['priority']) =>
                    setEditedEvent({ ...editedEvent, priority: value })
                  }
                >
                  <SelectTrigger id="priority">
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

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedEvent.description || ''}
                onChange={(e) =>
                  setEditedEvent({ ...editedEvent, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Recurring Event Section - Only for non-recurring instances */}
            {!isRecurringInstance && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                  />
                  <Label htmlFor="recurring" className="flex items-center gap-2 cursor-pointer">
                    <RepeatIcon className="h-4 w-4" />
                    {editedEvent.recurrence ? 'Recurring Event (Disable to remove)' : 'Make Recurring'}
                  </Label>
                </div>

                {isRecurring && (
                  <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select
                          value={recurrence.frequency}
                          onValueChange={(value: RecurrenceRule['frequency']) =>
                            setRecurrence({ ...recurrence, frequency: value })
                          }
                        >
                          <SelectTrigger id="frequency">
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

                      <div className="space-y-2">
                        <Label htmlFor="interval">Repeat Every</Label>
                        <Input
                          id="interval"
                          type="number"
                          min="1"
                          value={recurrence.interval}
                          onChange={(e) =>
                            setRecurrence({ ...recurrence, interval: parseInt(e.target.value) || 1 })
                          }
                        />
                      </div>
                    </div>

                    {recurrence.frequency === 'weekly' && (
                      <div className="space-y-2">
                        <Label>Repeat On</Label>
                        <div className="flex flex-wrap gap-2">
                          {dayNames.map((day, index) => (
                            <Button
                              key={index}
                              type="button"
                              variant={recurrence.daysOfWeek?.includes(index) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleDayOfWeekToggle(index)}
                              className="w-12"
                            >
                              {day}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {recurrence.frequency === 'monthly' && (
                      <div className="space-y-2">
                        <Label htmlFor="dayOfMonth">Day of Month</Label>
                        <Input
                          id="dayOfMonth"
                          type="number"
                          min="1"
                          max="31"
                          value={recurrence.dayOfMonth || ''}
                          onChange={(e) =>
                            setRecurrence({
                              ...recurrence,
                              dayOfMonth: parseInt(e.target.value) || undefined,
                            })
                          }
                          placeholder="Leave empty to use start date's day"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="endType">Ends</Label>
                      <Select
                        value={endType}
                        onValueChange={(value: 'never' | 'date' | 'count') => {
                          setEndType(value);
                          if (value === 'never') {
                            setRecurrence({ ...recurrence, endDate: undefined, count: undefined });
                          }
                        }}
                      >
                        <SelectTrigger id="endType">
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
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={recurrence.endDate?.slice(0, 10) || ''}
                          onChange={(e) =>
                            setRecurrence({
                              ...recurrence,
                              endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                              count: undefined,
                            })
                          }
                        />
                      </div>
                    )}

                    {endType === 'count' && (
                      <div className="space-y-2">
                        <Label htmlFor="count">Number of Occurrences</Label>
                        <Input
                          id="count"
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
                        />
                      </div>
                    )}

                    {/* Preview of recurrence pattern */}
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      <strong>Pattern:</strong> {describeRecurrence(recurrence)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2Icon className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Recurring Event Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Event</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>This event is part of a recurring series. What would you like to delete?</p>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="this"
                    checked={deleteOption === 'this'}
                    onChange={(e) => setDeleteOption(e.target.value as 'this' | 'all')}
                    className="h-4 w-4"
                  />
                  <span>Only this occurrence</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="all"
                    checked={deleteOption === 'all'}
                    onChange={(e) => setDeleteOption(e.target.value as 'this' | 'all')}
                    className="h-4 w-4"
                  />
                  <span>All occurrences (delete the entire series)</span>
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
