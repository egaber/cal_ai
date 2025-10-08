import { CalendarEvent, RecurrenceRule } from "@/types/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useState } from "react";
import { describeRecurrence, validateRecurrenceRule } from "@/utils/recurrenceUtils";
import { RepeatIcon } from "lucide-react";

interface NewEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => void;
  defaultDate?: Date;
  defaultHour?: number;
  defaultMinute?: number;
  members: Array<{ id: string; name: string }>;
}

export const NewEventDialog = ({
  isOpen,
  onClose,
  onSave,
  defaultDate,
  defaultHour = 9,
  defaultMinute = 0,
  members,
}: NewEventDialogProps) => {
  const getDefaultStartTime = () => {
    const date = defaultDate || new Date();
    date.setHours(defaultHour, defaultMinute, 0, 0);
    return date.toISOString().slice(0, 16);
  };

  const getDefaultEndTime = () => {
    const date = defaultDate || new Date();
    date.setHours(defaultHour + 1, defaultMinute, 0, 0);
    return date.toISOString().slice(0, 16);
  };

  const [newEvent, setNewEvent] = useState({
    title: '',
    startTime: getDefaultStartTime(),
    endTime: getDefaultEndTime(),
    category: 'work' as CalendarEvent['category'],
    priority: 'medium' as CalendarEvent['priority'],
    memberId: members[0]?.id || '1',
    description: '',
  });

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule>({
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [],
  });
  const [endType, setEndType] = useState<'never' | 'date' | 'count'>('never');

  const handleSave = () => {
    if (!newEvent.title.trim()) return;

    // Validate recurrence if enabled
    if (isRecurring) {
      const error = validateRecurrenceRule(recurrence);
      if (error) {
        alert(error);
        return;
      }
    }

    const eventData: Omit<CalendarEvent, 'id'> = {
      ...newEvent,
      startTime: new Date(newEvent.startTime).toISOString(),
      endTime: new Date(newEvent.endTime).toISOString(),
      recurrence: isRecurring ? recurrence : undefined,
    };

    onSave(eventData);
    
    // Reset form
    setNewEvent({
      title: '',
      startTime: getDefaultStartTime(),
      endTime: getDefaultEndTime(),
      category: 'work',
      priority: 'medium',
      memberId: members[0]?.id || '1',
      description: '',
    });
    setIsRecurring(false);
    setRecurrence({
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [],
    });
    setEndType('never');
    
    onClose();
  };

  const handleDayOfWeekToggle = (day: number) => {
    const current = recurrence.daysOfWeek || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort();
    setRecurrence({ ...recurrence, daysOfWeek: updated });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="Event title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={newEvent.startTime}
                onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={newEvent.endTime}
                onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newEvent.category}
                onValueChange={(value: CalendarEvent['category']) =>
                  setNewEvent({ ...newEvent, category: value })
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
                value={newEvent.priority}
                onValueChange={(value: CalendarEvent['priority']) =>
                  setNewEvent({ ...newEvent, priority: value })
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
            <Label htmlFor="member">Assign To</Label>
            <Select
              value={newEvent.memberId}
              onValueChange={(value) => setNewEvent({ ...newEvent, memberId: value })}
            >
              <SelectTrigger id="member">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="Add event details..."
              rows={3}
            />
          </div>

          {/* Recurring Event Section */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
              />
              <Label htmlFor="recurring" className="flex items-center gap-2 cursor-pointer">
                <RepeatIcon className="h-4 w-4" />
                Recurring Event
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!newEvent.title.trim()}>
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
