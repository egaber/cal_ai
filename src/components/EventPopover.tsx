import { CalendarEvent, RecurrenceRule, FamilyMember } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { X, GripVertical, Trash2, RepeatIcon, Sparkles, User, Lightbulb, Tag, AlertCircle, Clock, Wand2, Cloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { describeRecurrence, validateRecurrenceRule } from "@/utils/recurrenceUtils";
import { cn } from "@/lib/utils";

interface EventPopoverProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  position: { x: number; y: number };
  children: React.ReactNode;
  familyMembers?: FamilyMember[];
}

// Category color mapping
const CATEGORY_COLORS: Record<CalendarEvent["category"], { bg: string; border: string; text: string; lightBg: string }> = {
  health: { bg: 'bg-emerald-500', border: 'border-emerald-200', text: 'text-emerald-700', lightBg: 'bg-emerald-50' },
  work: { bg: 'bg-sky-500', border: 'border-sky-200', text: 'text-sky-700', lightBg: 'bg-sky-50' },
  personal: { bg: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-700', lightBg: 'bg-amber-50' },
  family: { bg: 'bg-blue-500', border: 'border-blue-200', text: 'text-blue-700', lightBg: 'bg-blue-50' },
  education: { bg: 'bg-indigo-500', border: 'border-indigo-200', text: 'text-indigo-700', lightBg: 'bg-indigo-50' },
  social: { bg: 'bg-pink-500', border: 'border-pink-200', text: 'text-pink-700', lightBg: 'bg-pink-50' },
  finance: { bg: 'bg-green-600', border: 'border-green-200', text: 'text-green-700', lightBg: 'bg-green-50' },
  home: { bg: 'bg-orange-500', border: 'border-orange-200', text: 'text-orange-700', lightBg: 'bg-orange-50' },
  travel: { bg: 'bg-cyan-500', border: 'border-cyan-200', text: 'text-cyan-700', lightBg: 'bg-cyan-50' },
  fitness: { bg: 'bg-red-500', border: 'border-red-200', text: 'text-red-700', lightBg: 'bg-red-50' },
  food: { bg: 'bg-yellow-500', border: 'border-yellow-200', text: 'text-yellow-700', lightBg: 'bg-yellow-50' },
  shopping: { bg: 'bg-indigo-500', border: 'border-indigo-200', text: 'text-indigo-700', lightBg: 'bg-indigo-50' },
  entertainment: { bg: 'bg-blue-500', border: 'border-blue-200', text: 'text-blue-700', lightBg: 'bg-blue-50' },
  sports: { bg: 'bg-orange-600', border: 'border-orange-200', text: 'text-orange-700', lightBg: 'bg-orange-50' },
  hobby: { bg: 'bg-teal-500', border: 'border-teal-200', text: 'text-teal-700', lightBg: 'bg-teal-50' },
  volunteer: { bg: 'bg-rose-500', border: 'border-rose-200', text: 'text-rose-700', lightBg: 'bg-rose-50' },
  appointment: { bg: 'bg-blue-500', border: 'border-blue-200', text: 'text-blue-700', lightBg: 'bg-blue-50' },
  maintenance: { bg: 'bg-slate-500', border: 'border-slate-200', text: 'text-slate-700', lightBg: 'bg-slate-50' },
  celebration: { bg: 'bg-pink-600', border: 'border-pink-200', text: 'text-pink-700', lightBg: 'bg-pink-50' },
  meeting: { bg: 'bg-indigo-600', border: 'border-indigo-200', text: 'text-indigo-700', lightBg: 'bg-indigo-50' },
  childcare: { bg: 'bg-cyan-600', border: 'border-cyan-200', text: 'text-cyan-700', lightBg: 'bg-cyan-50' },
  pet: { bg: 'bg-amber-600', border: 'border-amber-200', text: 'text-amber-700', lightBg: 'bg-amber-50' },
  errand: { bg: 'bg-lime-500', border: 'border-lime-200', text: 'text-lime-700', lightBg: 'bg-lime-50' },
  transport: { bg: 'bg-gray-500', border: 'border-gray-200', text: 'text-gray-700', lightBg: 'bg-gray-50' },
  project: { bg: 'bg-sky-600', border: 'border-sky-200', text: 'text-sky-700', lightBg: 'bg-sky-50' },
  deadline: { bg: 'bg-red-600', border: 'border-red-200', text: 'text-red-700', lightBg: 'bg-red-50' },
};

// Priority color mapping
const PRIORITY_COLORS: Record<CalendarEvent["priority"], { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Low' },
  medium: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Medium' },
  high: { bg: 'bg-red-100', text: 'text-red-700', label: 'High' },
};

const getMemberInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
  return cleanName.substring(0, 2).toUpperCase();
};

export const EventPopover = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  position,
  children,
  familyMembers = [],
}: EventPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [editedEvent, setEditedEvent] = useState<CalendarEvent | null>(null);
  const [showRecurrenceEditor, setShowRecurrenceEditor] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [popoverPosition, setPopoverPosition] = useState(position);
  const [isGeneratingTip, setIsGeneratingTip] = useState(false);

  // Initialize editing state when event changes
  useEffect(() => {
    if (event) {
      setEditedEvent({ ...event });
      setIsRecurring(!!(event.recurrence || event.recurringEventId));
      setShowRecurrenceEditor(false);
    }
  }, [event]);

  // Smart positioning - ensure popover is fully visible and doesn't block the event
  useEffect(() => {
    if (!isOpen || !popoverRef.current) return;

    const popoverWidth = 500;
    const popoverHeight = 650;
    const padding = 20;
    const eventOffset = 100; // Offset from clicked event
    
    let left = position.x + eventOffset;
    let top = position.y;
    
    // Ensure popover doesn't go off right edge
    if (left + popoverWidth > window.innerWidth - padding) {
      left = position.x - popoverWidth - eventOffset;
    }
    
    // Ensure popover doesn't go off left edge
    if (left < padding) {
      left = padding;
    }
    
    // Center vertically around click position, but keep fully visible
    top = position.y - popoverHeight / 2;
    
    // Ensure popover doesn't go off top
    if (top < padding) {
      top = padding;
    }
    
    // Ensure popover doesn't go off bottom
    if (top + popoverHeight > window.innerHeight - padding) {
      top = window.innerHeight - popoverHeight - padding;
    }
    
    setPopoverPosition({ x: left, y: top });
  }, [isOpen, position]);

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPopoverPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!event || !editedEvent) return <>{children}</>;

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const minutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (remainder === 0) return `${hours}h`;
    return `${hours}h ${remainder}m`;
  };

  const handleSave = () => {
    if (!editedEvent.title.trim()) return;
    
    // Handle recurrence
    if (isRecurring && editedEvent.recurrence) {
      const error = validateRecurrenceRule(editedEvent.recurrence);
      if (error) {
        alert(error);
        return;
      }
    } else if (!isRecurring) {
      // Remove recurrence if unchecked
      editedEvent.recurrence = undefined;
    }
    
    onEdit(editedEvent);
    onClose();
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (!dragHandleRef.current?.contains(e.target as Node)) return;
    
    setIsDragging(true);
    const rect = popoverRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleRecurringToggle = (checked: boolean) => {
    setIsRecurring(checked);
    if (checked && !editedEvent.recurrence) {
      // Initialize with default weekly recurrence
      setEditedEvent({
        ...editedEvent,
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [new Date(editedEvent.startTime).getDay()],
        }
      });
      setShowRecurrenceEditor(true);
    }
  };

  const currentMember = familyMembers.find(m => m.id === editedEvent.memberId);
  const categoryColor = CATEGORY_COLORS[editedEvent.category];
  const priorityColor = PRIORITY_COLORS[editedEvent.priority];

  const popoverContent = isOpen ? (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={popoverRef}
          className="fixed z-[9999] w-[500px] animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            left: `${popoverPosition.x}px`,
            top: `${popoverPosition.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative rounded-xl border-2 bg-white shadow-2xl shadow-black/20 overflow-hidden">
            {/* Draggable Header with Category Color */}
            <div
              ref={dragHandleRef}
              onMouseDown={handleDragStart}
              className={cn('h-3 cursor-move', categoryColor.bg, isDragging && 'cursor-grabbing')}
            />
            
            {/* Header */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="text-4xl leading-none">{editedEvent.emoji || '📅'}</div>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <Input
                    value={editedEvent.title}
                    onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                    className="font-bold text-lg border-0 px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Event title"
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Family Members - Multi-select with avatars */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {(editedEvent.memberIds || [editedEvent.memberId]).map((mId) => {
                        const member = familyMembers.find(m => m.id === mId);
                        if (!member) return null;
                        
                        return (
                          <div
                            key={mId}
                            className="flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full bg-muted/50 hover:bg-muted transition-colors group"
                          >
                            <Avatar className="h-5 w-5 border border-white shadow-sm">
                              {member.avatar ? (
                                <AvatarImage src={member.avatar} alt={member.name} />
                              ) : (
                                <AvatarFallback className={cn('text-[8px]', member.color, 'text-white')}>
                                  {getMemberInitials(member.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <span className="text-xs font-medium">{member.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentIds = editedEvent.memberIds || [editedEvent.memberId];
                                const updatedIds = currentIds.filter(id => id !== mId);
                                if (updatedIds.length === 0) return; // Keep at least one member
                                setEditedEvent({
                                  ...editedEvent,
                                  memberId: updatedIds[0],
                                  memberIds: updatedIds.length > 1 ? updatedIds : undefined
                                });
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                      
                      {/* Add member button */}
                      <Select
                        value=""
                        onValueChange={(value) => {
                          const currentIds = editedEvent.memberIds || [editedEvent.memberId];
                          if (!currentIds.includes(value)) {
                            const updatedIds = [...currentIds, value];
                            setEditedEvent({
                              ...editedEvent,
                              memberId: updatedIds[0],
                              memberIds: updatedIds
                            });
                          }
                        }}
                      >
                        <SelectTrigger 
                          className="h-7 w-7 border-0 px-0 focus:ring-0 hover:bg-muted/50 rounded-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]" onClick={(e) => e.stopPropagation()}>
                          {familyMembers
                            .filter(m => !(editedEvent.memberIds || [editedEvent.memberId]).includes(m.id))
                            .map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    {member.avatar ? (
                                      <AvatarImage src={member.avatar} alt={member.name} />
                                    ) : (
                                      <AvatarFallback className={cn('text-[8px]', member.color, 'text-white')}>
                                        {getMemberInitials(member.name)}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  {member.name}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Category Badge Selector */}
                    <Select
                      value={editedEvent.category}
                      onValueChange={(value: CalendarEvent['category']) => 
                        setEditedEvent({ ...editedEvent, category: value })
                      }
                    >
                      <SelectTrigger 
                        className="h-7 w-auto border-0 px-0 gap-1 focus:ring-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Badge className={cn(categoryColor.lightBg, categoryColor.text, 'text-xs font-semibold capitalize border', categoryColor.border)}>
                          {editedEvent.category}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent className="max-h-60 z-[10000]" onClick={(e) => e.stopPropagation()}>
                        {Object.keys(CATEGORY_COLORS).map((cat) => {
                          const colors = CATEGORY_COLORS[cat as CalendarEvent['category']];
                          return (
                            <SelectItem key={cat} value={cat}>
                              <div className="flex items-center gap-2">
                                <div className={cn('w-3 h-3 rounded-full', colors.bg)} />
                                <span className="capitalize">{cat}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {/* Priority Badge Selector */}
                    <Select
                      value={editedEvent.priority}
                      onValueChange={(value: CalendarEvent['priority']) => 
                        setEditedEvent({ ...editedEvent, priority: value })
                      }
                    >
                      <SelectTrigger 
                        className="h-7 w-auto border-0 px-0 gap-1 focus:ring-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Badge className={cn(priorityColor.bg, priorityColor.text, 'text-xs font-semibold')}>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {priorityColor.label}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent className="z-[10000]" onClick={(e) => e.stopPropagation()}>
                        {Object.entries(PRIORITY_COLORS).map(([priority, colors]) => (
                          <SelectItem key={priority} value={priority}>
                            <div className="flex items-center gap-2">
                              <AlertCircle className={cn('h-3 w-3', colors.text)} />
                              <span>{colors.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Duration Display */}
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(editedEvent.startTime, editedEvent.endTime)}
                    </Badge>
                    
                    {/* Google Calendar Source Badge */}
                    {editedEvent.source === 'google' && editedEvent.sourceCalendarEmail && (
                      <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                        <Cloud className="h-3 w-3 mr-1" />
                        {editedEvent.sourceCalendarEmail}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 hover:bg-muted/80"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 pb-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* All-day event toggle */}
              <div className="flex items-center space-x-2 py-2 px-3 bg-primary/5 rounded-md border border-primary/20">
                <Checkbox
                  id="popover-allday"
                  checked={editedEvent.isAllDay || false}
                  onCheckedChange={(checked) => {
                    const isAllDay = checked as boolean;
                    if (isAllDay) {
                      // Set to start and end of day
                      const start = new Date(editedEvent.startTime);
                      start.setHours(0, 0, 0, 0);
                      const end = new Date(editedEvent.endTime);
                      end.setHours(23, 59, 59, 999);
                      setEditedEvent({
                        ...editedEvent,
                        startTime: start.toISOString(),
                        endTime: end.toISOString(),
                        isAllDay: true
                      });
                    } else {
                      // Set to default times
                      const start = new Date(editedEvent.startTime);
                      start.setHours(9, 0, 0, 0);
                      const end = new Date(editedEvent.endTime);
                      end.setHours(10, 0, 0, 0);
                      setEditedEvent({
                        ...editedEvent,
                        startTime: start.toISOString(),
                        endTime: end.toISOString(),
                        isAllDay: false
                      });
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Label htmlFor="popover-allday" className="cursor-pointer font-medium text-sm flex items-center gap-2">
                  <span>All-day event</span>
                  {editedEvent.isAllDay && <Badge className="text-xs bg-primary text-primary-foreground px-2 py-0.5">Active</Badge>}
                </Label>
              </div>

              {/* Time & Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {editedEvent.isAllDay ? 'Start Date' : 'Date'}
                  </Label>
                  <Input
                    type="date"
                    value={new Date(editedEvent.startTime).toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      const currentStart = new Date(editedEvent.startTime);
                      const currentEnd = new Date(editedEvent.endTime);
                      
                      if (editedEvent.isAllDay) {
                        newDate.setHours(0, 0, 0, 0);
                        const newEnd = new Date(editedEvent.endTime);
                        newEnd.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
                        setEditedEvent({
                          ...editedEvent,
                          startTime: newDate.toISOString(),
                          endTime: newEnd.toISOString()
                        });
                      } else {
                        newDate.setHours(currentStart.getHours(), currentStart.getMinutes());
                        const duration = currentEnd.getTime() - currentStart.getTime();
                        const newEnd = new Date(newDate.getTime() + duration);
                        setEditedEvent({
                          ...editedEvent,
                          startTime: newDate.toISOString(),
                          endTime: newEnd.toISOString()
                        });
                      }
                    }}
                    className="h-8 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {editedEvent.isAllDay ? (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">End Date</Label>
                    <Input
                      type="date"
                      value={new Date(editedEvent.endTime).toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newEnd = new Date(e.target.value);
                        newEnd.setHours(23, 59, 59, 999);
                        setEditedEvent({
                          ...editedEvent,
                          endTime: newEnd.toISOString()
                        });
                      }}
                      className="h-8 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Time</Label>
                    <div className="flex gap-1">
                      <Input
                        type="time"
                        value={new Date(editedEvent.startTime).toTimeString().slice(0, 5)}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newStart = new Date(editedEvent.startTime);
                          newStart.setHours(parseInt(hours), parseInt(minutes));
                          const duration = new Date(editedEvent.endTime).getTime() - new Date(editedEvent.startTime).getTime();
                          const newEnd = new Date(newStart.getTime() + duration);
                          setEditedEvent({
                            ...editedEvent,
                            startTime: newStart.toISOString(),
                            endTime: newEnd.toISOString()
                          });
                        }}
                        className="h-8 text-xs flex-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Input
                        type="time"
                        value={new Date(editedEvent.endTime).toTimeString().slice(0, 5)}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newEnd = new Date(editedEvent.endTime);
                          newEnd.setHours(parseInt(hours), parseInt(minutes));
                          setEditedEvent({
                            ...editedEvent,
                            endTime: newEnd.toISOString()
                          });
                        }}
                        className="h-8 text-xs flex-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Recurring Event Section */}
              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={handleRecurringToggle}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label htmlFor="recurring" className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <RepeatIcon className="h-4 w-4" />
                    Recurring Event
                  </Label>
                </div>
                
                {isRecurring && editedEvent.recurrence && (
                  <div className="space-y-3 p-3 rounded-lg bg-muted/30 border ml-6">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Frequency</Label>
                        <Select
                          value={editedEvent.recurrence.frequency}
                          onValueChange={(value: RecurrenceRule['frequency']) =>
                            setEditedEvent({
                              ...editedEvent,
                              recurrence: { ...editedEvent.recurrence!, frequency: value }
                            })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs mt-1" onClick={(e) => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[10001]" onClick={(e) => e.stopPropagation()}>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Every</Label>
                        <Input
                          type="number"
                          min="1"
                          value={editedEvent.recurrence.interval}
                          onChange={(e) =>
                            setEditedEvent({
                              ...editedEvent,
                              recurrence: {
                                ...editedEvent.recurrence!,
                                interval: parseInt(e.target.value) || 1
                              }
                            })
                          }
                          className="h-8 text-xs mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    
                    {editedEvent.recurrence.frequency === 'weekly' && (
                      <div>
                        <Label className="text-xs mb-2 block">Days of Week</Label>
                        <div className="flex gap-1">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                            const isSelected = editedEvent.recurrence?.daysOfWeek?.includes(index);
                            return (
                              <Button
                                key={index}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const current = editedEvent.recurrence?.daysOfWeek || [];
                                  const updated = current.includes(index)
                                    ? current.filter(d => d !== index)
                                    : [...current, index].sort();
                                  setEditedEvent({
                                    ...editedEvent,
                                    recurrence: {
                                      ...editedEvent.recurrence!,
                                      daysOfWeek: updated
                                    }
                                  });
                                }}
                                className="w-8 h-8 p-0 text-xs"
                              >
                                {day}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      {describeRecurrence(editedEvent.recurrence)}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
                <Textarea
                  value={editedEvent.description || ''}
                  onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                  className="text-sm min-h-[60px] resize-none"
                  placeholder="Add description..."
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* AI Tip */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="h-3 w-3 text-amber-600" />
                    AI Tip / Suggestion
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setIsGeneratingTip(true);
                      try {
                        const { llmService } = await import('@/services/llmService');
                        
                        // Get surrounding events (2 hours before and after) - we'd need to pass this as a prop
                        // For now, use empty array as placeholder
                        const surroundingEvents: Array<{ title: string; startTime: string; endTime: string; category: string }> = [];
                        
                        const tip = await llmService.generateEventTip(
                          editedEvent.title,
                          editedEvent.description || '',
                          editedEvent.category,
                          editedEvent.startTime,
                          editedEvent.endTime,
                          surroundingEvents
                        );
                        
                        if (tip) {
                          setEditedEvent({ ...editedEvent, aiTip: tip });
                        }
                      } catch (error) {
                        console.error('Failed to generate tip:', error);
                      } finally {
                        setIsGeneratingTip(false);
                      }
                    }}
                    disabled={isGeneratingTip}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    {isGeneratingTip ? 'Generating...' : 'Generate Tip'}
                  </Button>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                  <Textarea
                    value={editedEvent.aiTip || ''}
                    onChange={(e) => setEditedEvent({ ...editedEvent, aiTip: e.target.value })}
                    className="text-xs min-h-[50px] resize-none bg-white/50 border-amber-200 focus-visible:ring-amber-500"
                    placeholder="AI will add scheduling tips here, or you can add your own notes..."
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-muted/30 p-4 flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={handleSave}
              >
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Save
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(event.id);
                  onClose();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="z-[10001]">
        <ContextMenuItem onClick={handleSave}>
          <Sparkles className="h-4 w-4 mr-2" />
          Save Changes
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => {
            onDelete(event.id);
            onClose();
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Event
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ) : null;

  return (
    <>
      {children}
      {popoverContent && createPortal(popoverContent, document.body)}
    </>
  );
};
