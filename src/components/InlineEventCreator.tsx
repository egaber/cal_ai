import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, Check } from "lucide-react";

interface InlineEventCreatorProps {
  date: Date;
  hour: number;
  minute: number;
  position: { x: number; y: number };
  onSave: (title: string, isAllDay?: boolean) => void;
  onCancel: () => void;
}

export const InlineEventCreator = ({
  date,
  hour,
  minute,
  position,
  onSave,
  onCancel,
}: InlineEventCreatorProps) => {
  const [title, setTitle] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim(), isAllDay);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 || 12;
    return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <div
      className="fixed z-[9999] w-80 rounded-lg border border-border bg-white shadow-xl"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        transform: "translate(-50%, -100%) translateY(-12px)",
      }}
    >
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            {!isAllDay && `• ${formatTime(hour, minute)}`}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mb-3 flex items-center space-x-2">
          <Checkbox
            id="inline-allday"
            checked={isAllDay}
            onCheckedChange={(checked) => setIsAllDay(checked as boolean)}
          />
          <Label 
            htmlFor="inline-allday" 
            className="text-sm font-medium cursor-pointer"
          >
            All-day event
          </Label>
        </div>
        
        <div className="flex gap-2">
          <Input
            autoFocus
            placeholder="Event title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-shrink-0"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
