import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FamilyMember } from "@/types/calendar";
import { CalendarEvent } from "@/types/calendar";
import { X, Clock, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCreationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  hour: number;
  minute: number;
  familyMembers: FamilyMember[];
  onSave: (eventData: Omit<CalendarEvent, "id">) => void;
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
  const [endHour, setEndHour] = useState(Math.min(hour + 1, 23));
  const [endMinute, setEndMinute] = useState(minute);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!familyMembers.length) {
      setSelectedMemberId("");
      return;
    }

    if (!familyMembers.some((member) => member.id === selectedMemberId)) {
      setSelectedMemberId(familyMembers[0].id);
    }
  }, [familyMembers, selectedMemberId]);

  const formatTimeForInput = (h: number, m: number) => {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const formatTimeForDisplay = (h: number, m: number) => {
    const localDate = new Date(date);
    localDate.setHours(h, m, 0, 0);
    return localDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const formattedDateLabel = useMemo(
    () =>
      date.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [date],
  );

  const startTimeLabel = useMemo(
    () => formatTimeForDisplay(startHour, startMinute),
    [date, startHour, startMinute],
  );

  const endTimeLabel = useMemo(
    () => formatTimeForDisplay(endHour, endMinute),
    [date, endHour, endMinute],
  );

  const timeRangeLabel = useMemo(() => {
    if (isAllDay) {
      return "All day";
    }
    return `${startTimeLabel} – ${endTimeLabel}`;
  }, [endTimeLabel, isAllDay, startTimeLabel]);

  const durationLabel = useMemo(() => {
    if (isAllDay) {
      return "All day coverage";
    }
    const startTotal = startHour * 60 + startMinute;
    const endTotal = endHour * 60 + endMinute;
    const diff = Math.max(endTotal - startTotal, 0);
    if (diff === 0) {
      return "0 minutes";
    }
    const hoursAmount = Math.floor(diff / 60);
    const minutesAmount = diff % 60;
    const parts: string[] = [];
    if (hoursAmount > 0) {
      parts.push(`${hoursAmount} hr${hoursAmount > 1 ? "s" : ""}`);
    }
    if (minutesAmount > 0) {
      parts.push(`${minutesAmount} min`);
    }
    return parts.join(" ");
  }, [endHour, endMinute, isAllDay, startHour, startMinute]);

  const selectedMember = useMemo(
    () => familyMembers.find((member) => member.id === selectedMemberId),
    [familyMembers, selectedMemberId],
  );

  const handleTimeChange = (timeString: string, isStart: boolean) => {
    const [h, m] = timeString.split(":").map(Number);
    if (isStart) {
      setStartHour(h);
      setStartMinute(m);
      if (h + 1 < 24) {
        setEndHour(h + 1);
        setEndMinute(m);
      } else {
        setEndHour(23);
        setEndMinute(m);
      }
    } else {
      setEndHour(h);
      setEndMinute(m);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    const startDate = new Date(date);
    const endDate = new Date(date);

    if (isAllDay) {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate.setHours(startHour, startMinute, 0, 0);
      endDate.setHours(endHour, endMinute, 0, 0);
    }

    let metadata: { emoji: string; category: CalendarEvent["category"] };

    try {
      const { llmService } = await import("@/services/llmService");
      const aiMetadata = await llmService.generateEventMetadata(title, notes);
      metadata = {
        emoji: aiMetadata.emoji,
        category: aiMetadata.category as CalendarEvent["category"],
      };
    } catch (error) {
      const { generateEventMetadataLocal } = await import("@/utils/eventMetadataUtils");
      metadata = generateEventMetadataLocal(title, notes);
    }

    onSave({
      title,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      category: metadata.category,
      priority: "medium",
      memberId: selectedMemberId || familyMembers[0]?.id || "",
      emoji: metadata.emoji,
      isAllDay,
      description: notes || undefined,
    });

    setTitle("");
    setNotes("");
    setIsAllDay(false);
    setStartHour(hour);
    setStartMinute(minute);
    setEndHour(Math.min(hour + 1, 23));
    setEndMinute(minute);
    setSelectedMemberId(familyMembers[0]?.id || "");
    onClose();
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="h-[88vh] max-w-[520px] rounded-t-[32px] border border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-gray-900 p-0 text-slate-900 dark:text-slate-100 shadow-[0_-40px_120px_-40px_rgba(15,23,42,0.35)] dark:shadow-[0_-40px_120px_-40px_rgba(0,0,0,0.75)]"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="px-6 pb-4 pt-6">
            <div className="flex items-start justify-between">
              <SheetTitle className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                New Event
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-500 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-gray-700 hover:text-slate-700 dark:hover:text-slate-300"
                aria-label="Close event creation drawer"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Plan your next moment with a clear overview before it lands on the calendar.
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-36">
            <section className="mb-7">
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-800 p-5 shadow-[0_24px_48px_-32px_rgba(15,23,42,0.4)] dark:shadow-[0_24px_48px_-32px_rgba(0,0,0,0.6)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-primary dark:bg-primary-600 text-white shadow-lg shadow-primary/30 dark:shadow-primary/50">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {formattedDateLabel}
                    </p>
                    <p className="text-2xl font-semibold leading-tight text-slate-900 dark:text-slate-100">{timeRangeLabel}</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{durationLabel}</p>
                  </div>
                </div>
                {selectedMember && (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    <div
                      className={cn(
                        "flex h-9 w-9 flex-none items-center justify-center rounded-full font-semibold text-white shadow-inner shadow-black/10",
                        selectedMember.color,
                      )}
                    >
                      {selectedMember.name.charAt(0)}
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedMember.name}</span>
                      <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Organizer</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="title"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400"
                >
                  Event Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give this event a headline..."
                  className="h-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-800 px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">All-day scheduling</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Toggle on to block the entire day.</p>
                  </div>
                </div>
                <Switch
                  id="all-day"
                  checked={isAllDay}
                  onCheckedChange={(checked) => setIsAllDay(Boolean(checked))}
                  aria-label="Toggle all day event"
                />
              </div>

              {!isAllDay && (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      Time
                    </Label>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Local timezone</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-time" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Start
                      </Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={formatTimeForInput(startHour, startMinute)}
                        onChange={(e) => handleTimeChange(e.target.value, true)}
                        className="h-11 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-time" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        End
                      </Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={formatTimeForInput(endHour, endMinute)}
                        onChange={(e) => handleTimeChange(e.target.value, false)}
                        className="h-11 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-900 text-sm text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">Assign To</Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Choose who will own this event.
                    </p>
                  </div>
                </div>
                {familyMembers.length ? (
                  <div className="grid grid-cols-2 gap-3">
                    {familyMembers.map((member) => {
                      const isSelected = selectedMemberId === member.id;
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setSelectedMemberId(member.id)}
                          aria-pressed={isSelected}
                            className={cn(
                              "group flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                              isSelected
                                ? "border-primary dark:border-primary-500 bg-primary/10 dark:bg-primary/20 shadow-[0_18px_30px_-18px_rgba(59,130,246,0.45)]"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 hover:border-primary/40 dark:hover:border-primary/60 hover:bg-primary/5 dark:hover:bg-primary/10",
                            )}
                        >
                          <div
                            className={cn(
                              "flex h-11 w-11 flex-none items-center justify-center rounded-full font-semibold text-white shadow-inner shadow-black/10",
                              member.color,
                            )}
                          >
                            {member.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{member.name}</div>
                            {isSelected ? (
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-primary dark:text-primary-400">
                                Selected
                              </div>
                            ) : (
                              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Tap to assign
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-800 px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                    Add family members in settings to assign events.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <Label htmlFor="notes" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Notes
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Share details, agenda, or links for the event.</p>
                  </div>
                </div>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add supporting details to keep everyone aligned..."
                  className="w-full min-h-[120px] resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </section>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-gray-900 px-6 pb-8 pt-5 shadow-[0_-28px_40px_-30px_rgba(15,23,42,0.25)] dark:shadow-[0_-28px_40px_-30px_rgba(0,0,0,0.45)]">
            <Button
              onClick={handleSave}
              disabled={!title.trim()}
              className="h-14 w-full rounded-2xl border border-primary/50 dark:border-primary/60 bg-primary dark:bg-primary-600 text-lg font-semibold text-white shadow-[0_18px_36px_-16px_rgba(59,130,246,0.45)] dark:shadow-[0_18px_36px_-16px_rgba(139,92,246,0.45)] transition-all hover:bg-primary/90 dark:hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 disabled:opacity-60"
            >
              Create Event
            </Button>
            <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              AI metadata will be generated instantly to keep your calendar organized.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
