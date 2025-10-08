import { CalendarEvent } from "@/types/calendar";
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
import { useState } from "react";

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

  const handleSave = () => {
    if (!newEvent.title.trim()) return;

    onSave({
      ...newEvent,
      startTime: new Date(newEvent.startTime).toISOString(),
      endTime: new Date(newEvent.endTime).toISOString(),
    });
    
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
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
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
