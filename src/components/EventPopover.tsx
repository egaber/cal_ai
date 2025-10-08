import { CalendarEvent } from "@/types/calendar";
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
import { X, Calendar, Clock, Tag, MessageSquare, Trash2, RepeatIcon, Edit2, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { describeRecurrence } from "@/utils/recurrenceUtils";

interface EventPopoverProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onTalkToChat?: (event: CalendarEvent) => void;
  position: { x: number; y: number };
  children: React.ReactNode;
}

const CATEGORY_COLORS = {
  health: { icon: '🏃', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  work: { icon: '💼', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
  personal: { icon: '🏠', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  family: { icon: '👨‍👩‍👧‍👦', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-700' },
};

const PRIORITY_LABELS = {
  low: 'Low Priority',
  medium: 'Medium Priority',
  high: 'High Priority',
};

export const EventPopover = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onTalkToChat,
  position,
  children,
}: EventPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedCategory, setEditedCategory] = useState<CalendarEvent['category']>("personal");
  const [editedPriority, setEditedPriority] = useState<CalendarEvent['priority']>("medium");

  // Reset editing state when event changes
  useEffect(() => {
    if (event) {
      setEditedTitle(event.title);
      setEditedDescription(event.description || "");
      setEditedCategory(event.category);
      setEditedPriority(event.priority);
      setIsEditing(false);
    }
  }, [event]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!event) return <>{children}</>;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const minutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (remainder === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainder}m`;
  };

  const categoryStyle = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.work;

  // Calculate position - default to right of click, but flip if too close to edge
  const popoverWidth = 380;
  const viewportWidth = window.innerWidth;
  const padding = 20;
  
  let left = position.x + padding;
  let top = position.y;
  
  // If popover would go off right edge, position it to the left
  if (left + popoverWidth > viewportWidth - padding) {
    left = position.x - popoverWidth - padding;
  }
  
  // Ensure popover doesn't go off top or bottom
  const popoverHeight = 400; // approximate
  if (top + popoverHeight / 2 > window.innerHeight - padding) {
    top = window.innerHeight - popoverHeight - padding;
  } else if (top < padding + popoverHeight / 2) {
    top = padding;
  } else {
    top = top - popoverHeight / 2;
  }

  const popoverContent = isOpen ? (
    <div
      ref={popoverRef}
      className="fixed z-[9999] w-[380px] animate-in fade-in zoom-in-95 duration-200"
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
    >
      <div className="relative rounded-2xl border-2 border-border bg-white shadow-2xl shadow-black/10 overflow-hidden">
        {/* Color accent bar */}
        <div className={`h-2 ${categoryStyle.bg} ${categoryStyle.border} border-b-2`} />
        
        {/* Header */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-3xl flex-shrink-0 leading-none">{categoryStyle.icon}</span>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="font-bold text-lg"
                    placeholder="Event title"
                    autoFocus
                  />
                ) : (
                  <h3 className="font-bold text-lg leading-tight text-foreground pr-2">{event.title}</h3>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 hover:bg-muted/80"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 hover:bg-muted/80"
                  onClick={() => {
                    onEdit({
                      ...event,
                      title: editedTitle,
                      description: editedDescription,
                      category: editedCategory,
                      priority: editedPriority,
                    });
                    setIsEditing(false);
                    onClose();
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
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
        </div>

        {/* Body */}
        <div className="px-5 pb-5 space-y-4">
          {/* Time & Date Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground font-medium">{formatDate(event.startTime)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </span>
                <span className="text-muted-foreground">
                  ({formatDuration(event.startTime, event.endTime)})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {isEditing ? (
                <div className="flex gap-2 flex-1">
                  <Select value={editedCategory} onValueChange={(value: CalendarEvent['category']) => setEditedCategory(value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health">🏃 Health</SelectItem>
                      <SelectItem value="work">💼 Work</SelectItem>
                      <SelectItem value="personal">🏠 Personal</SelectItem>
                      <SelectItem value="family">👨‍👩‍👧‍👦 Family</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={editedPriority} onValueChange={(value: CalendarEvent['priority']) => setEditedPriority(value)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryStyle.bg} ${categoryStyle.text} capitalize`}>
                    {event.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {PRIORITY_LABELS[event.priority]}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recurring Event Info */}
          {(event.recurrence || event.recurringEventId) && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 border border-primary/20">
                <RepeatIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">Recurring Event</p>
                  {event.recurrence && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {describeRecurrence(event.recurrence)}
                    </p>
                  )}
                  {event.recurringEventId && !event.recurrence && (
                    <p className="text-xs text-muted-foreground mt-1">
                      This is an occurrence of a recurring event
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {(event.description || isEditing) && (
            <div className="pt-2 border-t border-border">
              {isEditing ? (
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="text-sm min-h-[60px]"
                  placeholder="Add description..."
                />
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
              )}
            </div>
          )}

          {event.type && (
            <div className="text-xs text-muted-foreground">
              Type: <span className="font-medium capitalize">{event.type}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border bg-muted/30 p-4 space-y-2">
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1 gap-2 shadow-sm"
              onClick={() => {
                if (onTalkToChat) {
                  onTalkToChat(event);
                }
                onClose();
              }}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Talk to Chat
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(event)}
            >
              Edit Details
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={() => {
              onDelete(event.id);
              onClose();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Event
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {children}
      {popoverContent && createPortal(popoverContent, document.body)}
    </>
  );
};
