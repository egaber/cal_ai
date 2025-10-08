import { CalendarEvent } from "@/types/calendar";
import { Button } from "@/components/ui/button";
import { X, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

interface EventPopoverProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  position: { x: number; y: number };
  children: React.ReactNode;
}

const CATEGORY_COLORS = {
  health: '🏃',
  work: '💼',
  personal: '🏠',
  family: '👨‍👩‍👧‍👦',
};

const PRIORITY_LABELS = {
  low: 'Level 1',
  medium: 'Level 3',
  high: 'Level 5',
};

export const EventPopover = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  position,
  children,
}: EventPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {children}
      {isOpen && (
        <div
          ref={popoverRef}
          className="fixed z-[9999] w-96 rounded-lg border border-border bg-white shadow-xl"
          style={{
            top: `${position.y}px`,
            left: `${position.x}px`,
            transform: "translate(12px, -50%)",
          }}
        >
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border p-4">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl">{CATEGORY_COLORS[event.category]}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-base leading-tight">{event.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(event.startTime)} • {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1 -mr-1"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
            {event.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Category</h4>
                <p className="text-sm text-muted-foreground capitalize">{event.category}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Priority</h4>
                <p className="text-sm text-muted-foreground">
                  {PRIORITY_LABELS[event.priority]}
                </p>
              </div>
            </div>

            {event.type && (
              <div>
                <h4 className="text-sm font-medium mb-1">Type</h4>
                <p className="text-sm text-muted-foreground capitalize">{event.type}</p>
              </div>
            )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 border-t border-border p-4">
            <Button
              variant="default"
              className="flex-1 gap-2"
              onClick={() => {
                // TODO: Connect to AI assistant
                onClose();
              }}
            >
              <Sparkles className="h-4 w-4" />
              Get AI Suggestions
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(event)}
            >
              Edit Details
            </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
