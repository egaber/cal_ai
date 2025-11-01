import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, Check } from "lucide-react";

/**
 * Inline (in-grid) event creation editor.
 * Render this INSIDE a positioned wrapper that calculates top/height based on hour+minute.
 * This component now only renders the editing controls (no absolute/fixed positioning).
 * Parent supplies placement and sizing so it visually appears as an inline editable event block.
 */
interface InlineEventCreatorProps {
  date: Date;
  hour: number;
  minute: number;
  onSave: (title: string, isAllDay?: boolean) => void;
  onCancel: () => void;
}

export const InlineEventCreator = ({
  date,
  hour,
  minute,
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
    if (isAllDay) return "All Day";
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 || 12;
    return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <div className="flex h-full flex-col gap-2 p-2">
      {/* Header Row (Date / Time + Cancel) */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}{" "}
          • {formatTime(hour, minute)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onCancel}
          aria-label="Cancel creation"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Title input */}
      <Input
        autoFocus
        placeholder="Event title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className="text-sm font-medium"
      />

      {/* All-day toggle */}
      <div className="flex items-center space-x-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2">
        <Checkbox
          id="inline-allday"
          checked={isAllDay}
          onCheckedChange={(checked) => setIsAllDay(!!checked)}
        />
        <Label
          htmlFor="inline-allday"
          className="text-xs font-medium cursor-pointer"
        >
          All-day event
        </Label>
      </div>

      {/* Large Save Button */}
      <Button
        onClick={handleSave}
        disabled={!title.trim()}
        className="w-full h-10 text-sm font-semibold bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Check className="h-4 w-4 mr-2" />
        Save Event
      </Button>
    </div>
  );
};
