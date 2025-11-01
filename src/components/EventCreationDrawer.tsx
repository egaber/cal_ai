import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FamilyMember } from "@/types/calendar";
import { CalendarEvent } from "@/types/calendar";
import { X, Clock, User, Tag, FileText } from "lucide-react";

interface EventCreationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  hour: number;
  minute: number;
  familyMembers: FamilyMember[];
  onSave: (eventData: Omit<CalendarEvent, 'id'>) => void;
}

export const EventCreationDrawer = ({
  isOpen,
  onClose,
  date,
  hour,
  minute,
  familyMembers,
  onSave,
}: EventCreationDrawerProps) => {
  const [title, setTitle] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(familyMembers[0]?.id || "");
  const [startHour, setStartHour] = useState(hour);
  const [startMinute, setStartMinute] = useState(minute);
  const [endHour, setEndHour] = useState(hour + 1);
  const [endMinute, setEndMinute] = useState(minute);
  const [notes, setNotes] = useState("");

  const formatTimeForInput = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const handleTimeChange = (timeString: string, isStart: boolean) => {
    const [h, m] = timeString.split(':').map(Number);
    if (isStart) {
      setStartHour(h);
      setStartMinute(m);
      // Auto-adjust end time to be 1 hour later
      if (h + 1 < 24) {
        setEndHour(h + 1);
        setEndMinute(m);
      }
    } else {
      setEndHour(h);
      setEndMinute(m);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    const startDate = new Date(date);
    const endDate = new Date(date);

    if (isAllDay) {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate.setHours(startHour, startMinute, 0, 0);
      endDate.setHours(endHour, endMinute, 0, 0);
    }

    // Generate metadata (emoji and category)
    let metadata: { emoji: string; category: CalendarEvent['category'] };
    
    try {
      const { llmService } = await import('@/services/llmService');
      const aiMetadata = await llmService.generateEventMetadata(title, notes);
      metadata = {
        emoji: aiMetadata.emoji,
        category: aiMetadata.category as CalendarEvent['category']
      };
    } catch (error) {
      const { generateEventMetadataLocal } = await import('@/utils/eventMetadataUtils');
      metadata = generateEventMetadataLocal(title, notes);
    }

    onSave({
      title,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      category: metadata.category,
      priority: 'medium',
      memberId: selectedMemberId,
      emoji: metadata.emoji,
      isAllDay,
      description: notes || undefined,
    });

    // Reset form
    setTitle("");
    setNotes("");
    setIsAllDay(false);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold">New Event</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-24">
          {/* Title Input - Autofocus */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">Event Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's happening?"
              className="text-lg h-12"
              autoFocus
            />
          </div>

          {/* All-Day Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <Label htmlFor="all-day" className="text-base font-medium cursor-pointer">
                All Day Event
              </Label>
            </div>
            <Switch
              id="all-day"
              checked={isAllDay}
              onCheckedChange={setIsAllDay}
            />
          </div>

          {/* Time Selection */}
          {!isAllDay && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Time</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time" className="text-sm text-gray-600">Start</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={formatTimeForInput(startHour, startMinute)}
                    onChange={(e) => handleTimeChange(e.target.value, true)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time" className="text-sm text-gray-600">End</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={formatTimeForInput(endHour, endMinute)}
                    onChange={(e) => handleTimeChange(e.target.value, false)}
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Member Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Assign To</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {familyMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedMemberId === member.id
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${member.color} flex items-center justify-center text-white font-bold`}>
                    {member.name[0]}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{member.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes/Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <Label htmlFor="notes" className="text-base font-semibold">Notes</Label>
            </div>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              className="w-full min-h-[100px] p-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* Fixed Bottom Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Create Event
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
