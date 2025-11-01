import { useState, useRef, useEffect, useMemo } from "react";
import { CalendarEvent, FamilyMember } from "@/types/calendar";
import { EventLayout } from "@/utils/eventLayoutUtils";
import { useRTL } from "@/contexts/RTLContext";
import {
  GripVertical, 
  RepeatIcon,
  Stethoscope,
  Briefcase,
  User,
  Users,
  GraduationCap,
  PartyPopper,
  DollarSign,
  Home,
  Plane,
  Dumbbell,
  UtensilsCrossed,
  ShoppingBag,
  Film,
  Trophy,
  Palette,
  Heart,
  Calendar,
  Wrench,
  Cake,
  Users2,
  Baby,
  PawPrint,
  Package,
  Car,
  FolderKanban,
  Clock,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DraggableEventCardProps {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
  onMove: (eventId: string, newStartTime: string, newEndTime: string) => void;
  gridHeight: number;
  columnWidth: number;
  timeSlotHeight: number;
  columnIndex: number;
  dates: Date[];
  member?: FamilyMember;
  familyMembers?: FamilyMember[]; // All family members to lookup multiple attendees
  layout?: EventLayout; // Layout information for handling overlaps
  onDragStateChange?: (isDragging: boolean) => void; // Callback to notify parent of drag state
}

const CATEGORY_STYLES: Record<CalendarEvent["category"], {
  card: string;
  bar: string;
  badge: string;
  icon: LucideIcon;
}> = {
  health: {
    card: 'border-emerald-100/80 hover:border-emerald-200 shadow-emerald-100/70',
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: Stethoscope,
  },
  work: {
    card: 'border-sky-100/80 hover:border-sky-200 shadow-sky-100/70',
    bar: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700',
    icon: Briefcase,
  },
  personal: {
    card: 'border-amber-100/80 hover:border-amber-200 shadow-amber-100/70',
    bar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    icon: User,
  },
  family: {
    card: 'border-blue-100/80 hover:border-blue-200 shadow-blue-100/70',
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    icon: Users,
  },
  education: {
    card: 'border-indigo-100/80 hover:border-indigo-200 shadow-indigo-100/70',
    bar: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-700',
    icon: GraduationCap,
  },
  social: {
    card: 'border-pink-100/80 hover:border-pink-200 shadow-pink-100/70',
    bar: 'bg-pink-500',
    badge: 'bg-pink-100 text-pink-700',
    icon: PartyPopper,
  },
  finance: {
    card: 'border-green-100/80 hover:border-green-200 shadow-green-100/70',
    bar: 'bg-green-600',
    badge: 'bg-green-100 text-green-700',
    icon: DollarSign,
  },
  home: {
    card: 'border-orange-100/80 hover:border-orange-200 shadow-orange-100/70',
    bar: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-700',
    icon: Home,
  },
  travel: {
    card: 'border-cyan-100/80 hover:border-cyan-200 shadow-cyan-100/70',
    bar: 'bg-cyan-500',
    badge: 'bg-cyan-100 text-cyan-700',
    icon: Car,
  },
  fitness: {
    card: 'border-red-100/80 hover:border-red-200 shadow-red-100/70',
    bar: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    icon: Dumbbell,
  },
  food: {
    card: 'border-yellow-100/80 hover:border-yellow-200 shadow-yellow-100/70',
    bar: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700',
    icon: UtensilsCrossed,
  },
  shopping: {
    card: 'border-indigo-100/80 hover:border-indigo-200 shadow-indigo-100/70',
    bar: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-700',
    icon: ShoppingBag,
  },
  entertainment: {
    card: 'border-blue-100/80 hover:border-blue-200 shadow-blue-100/70',
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    icon: Film,
  },
  sports: {
    card: 'border-orange-100/80 hover:border-orange-200 shadow-orange-100/70',
    bar: 'bg-orange-600',
    badge: 'bg-orange-100 text-orange-700',
    icon: Trophy,
  },
  hobby: {
    card: 'border-teal-100/80 hover:border-teal-200 shadow-teal-100/70',
    bar: 'bg-teal-500',
    badge: 'bg-teal-100 text-teal-700',
    icon: Palette,
  },
  volunteer: {
    card: 'border-rose-100/80 hover:border-rose-200 shadow-rose-100/70',
    bar: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700',
    icon: Heart,
  },
  appointment: {
    card: 'border-blue-100/80 hover:border-blue-200 shadow-blue-100/70',
    bar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    icon: Calendar,
  },
  maintenance: {
    card: 'border-slate-100/80 hover:border-slate-200 shadow-slate-100/70',
    bar: 'bg-slate-500',
    badge: 'bg-slate-100 text-slate-700',
    icon: Wrench,
  },
  celebration: {
    card: 'border-pink-100/80 hover:border-pink-200 shadow-pink-100/70',
    bar: 'bg-pink-600',
    badge: 'bg-pink-100 text-pink-700',
    icon: Cake,
  },
  meeting: {
    card: 'border-indigo-100/80 hover:border-indigo-200 shadow-indigo-100/70',
    bar: 'bg-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700',
    icon: Users2,
  },
  childcare: {
    card: 'border-cyan-100/80 hover:border-cyan-200 shadow-cyan-100/70',
    bar: 'bg-cyan-600',
    badge: 'bg-cyan-100 text-cyan-700',
    icon: Baby,
  },
  pet: {
    card: 'border-amber-100/80 hover:border-amber-200 shadow-amber-100/70',
    bar: 'bg-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    icon: PawPrint,
  },
  errand: {
    card: 'border-lime-100/80 hover:border-lime-200 shadow-lime-100/70',
    bar: 'bg-lime-500',
    badge: 'bg-lime-100 text-lime-700',
    icon: Package,
  },
  transport: {
    card: 'border-gray-100/80 hover:border-gray-200 shadow-gray-100/70',
    bar: 'bg-gray-500',
    badge: 'bg-gray-100 text-gray-700',
    icon: Plane,
  },
  project: {
    card: 'border-sky-100/80 hover:border-sky-200 shadow-sky-100/70',
    bar: 'bg-sky-600',
    badge: 'bg-sky-100 text-sky-700',
    icon: FolderKanban,
  },
  deadline: {
    card: 'border-red-100/80 hover:border-red-200 shadow-red-100/70',
    bar: 'bg-red-600',
    badge: 'bg-red-100 text-red-700',
    icon: Clock,
  },
};

// Smart icon matching based on event content
const getEventIcon = (event: CalendarEvent): LucideIcon => {
  const text = `${event.title} ${event.description || ''}`.toLowerCase();
  
  // Fitness keywords
  if (text.match(/\b(gym|workout|exercise|run|jog|yoga|pilates|training|crossfit|swim|bike|cycling)\b/)) {
    return Dumbbell;
  }
  
  // Health keywords
  if (text.match(/\b(doctor|dentist|appointment|medical|clinic|hospital|checkup|therapy|prescription|surgery)\b/)) {
    return Stethoscope;
  }
  
  // Food keywords
  if (text.match(/\b(lunch|dinner|breakfast|brunch|meal|restaurant|cook|recipe|eat|food|cafe|coffee)\b/)) {
    return UtensilsCrossed;
  }
  
  // Shopping keywords
  if (text.match(/\b(shop|shopping|buy|purchase|store|mall|grocery|groceries|market)\b/)) {
    return ShoppingBag;
  }
  
  // Travel keywords (נסיעות - רכב)
  if (text.match(/\b(travel|trip|drive|driving|road trip|car ride|vacation|hotel|tour|destination)\b/)) {
    return Car;
  }
  
  // Transport/Flight keywords (טיסות - מטוס)
  if (text.match(/\b(flight|fly|flying|airport|plane|airline|boarding)\b/)) {
    return Plane;
  }
  
  // Education keywords
  if (text.match(/\b(class|course|lecture|study|exam|test|homework|assignment|school|college|university|learn|training)\b/)) {
    return GraduationCap;
  }
  
  // Social keywords
  if (text.match(/\b(party|celebration|birthday|wedding|event|gathering|meetup|hangout|drinks|friends)\b/)) {
    return PartyPopper;
  }
  
  // Finance keywords
  if (text.match(/\b(payment|bill|invoice|tax|budget|bank|financial|investment|money|salary|expense)\b/)) {
    return DollarSign;
  }
  
  // Home/household keywords
  if (text.match(/\b(clean|cleaning|repair|maintenance|chore|laundry|organize|home improvement|garden|yard)\b/)) {
    return Home;
  }
  
  // Work keywords
  if (text.match(/\b(meeting|work|office|project|deadline|presentation|conference|call|client|team)\b/)) {
    return Briefcase;
  }
  
  // Family keywords
  if (text.match(/\b(family|kids|children|parents|relatives|mom|dad|son|daughter|sibling)\b/)) {
    return Users;
  }
  
  // Default to category icon
  return CATEGORY_STYLES[event.category]?.icon || User;
};

const getMemberInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  // Handle names with age in parentheses like "Hilly (11)"
  const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
  return cleanName.substring(0, 2).toUpperCase();
};

export const DraggableEventCard = ({
  event,
  onClick,
  onMove,
  gridHeight,
  columnWidth,
  timeSlotHeight,
  columnIndex,
  dates,
  member,
  familyMembers = [],
  layout,
  onDragStateChange,
}: DraggableEventCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDragReady, setIsDragReady] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { isRTL } = useRTL();
  const isMobile = 'ontouchstart' in window;
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const startDate = useMemo(() => new Date(event.startTime), [event.startTime]);
  const endDate = useMemo(() => new Date(event.endTime), [event.endTime]);
  const durationMinutes = useMemo(
    () => (endDate.getTime() - startDate.getTime()) / (1000 * 60),
    [endDate, startDate]
  );
  
  const startHour = startDate.getHours();
  const startMinutes = startDate.getMinutes();
  const topPosition = (startHour * 60 + startMinutes) * (timeSlotHeight / 60);
  const height = (durationMinutes / 60) * timeSlotHeight;

  const styles = CATEGORY_STYLES[event.category] ?? CATEGORY_STYLES.work;
  const EventIcon = useMemo(() => getEventIcon(event), [event]);
  
  // Use emoji if available, otherwise use icon
  const displayEmoji = event.emoji;

  const now = new Date();
  const isHappening = now >= startDate && now <= endDate;
  const isUpcoming = now < startDate;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (start: Date, end: Date) => {
    const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (remainder === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainder}m`;
  };

  const snapToGrid = (minutes: number) => {
    const snapInterval = 15; // 15-minute intervals
    return Math.round(minutes / snapInterval) * snapInterval;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.classList.contains('resize-handle')) {
      return;
    }
    
    e.stopPropagation();
    setIsDragging(true);
    setHasDragged(false); // Reset drag flag on mouse down
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only trigger onClick if we didn't actually drag
    if (!hasDragged && cardRef.current) {
      // Pass the actual card position instead of mouse position
      const rect = cardRef.current.getBoundingClientRect();
      // Create a synthetic event with the card's right edge and vertical center
      const syntheticEvent = {
        ...e,
        clientX: rect.right,
        clientY: rect.top + rect.height / 2,
      } as React.MouseEvent;
      onClick(syntheticEvent);
    }
  };

  // Touch handlers for mobile drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    // CRITICAL: Stop propagation immediately to prevent calendar's touch handlers
    e.stopPropagation();
    
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    // Start long-press timer for drag
    const timer = setTimeout(() => {
      setIsDragReady(true);
      setIsDragging(true);
      setHasDragged(false);
      
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        });
      }
      
      // Notify parent that drag started
      onDragStateChange?.(true);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long-press threshold
    
    setLongPressTimer(timer);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    
    // Cancel long-press if user moves finger before threshold
    if (longPressTimer && touchStartPos.current) {
      const moveDistance = Math.sqrt(
        Math.pow(touch.clientX - touchStartPos.current.x, 2) +
        Math.pow(touch.clientY - touchStartPos.current.y, 2)
      );
      
      if (moveDistance > 10 && !isDragReady) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
        return;
      }
    }
    
    // Handle dragging if ready
    if (isDragging && isDragReady && cardRef.current) {
      e.preventDefault();
      e.stopPropagation();
      setHasDragged(true);
      
      // For mobile, get the parent container (could be scroll container or events layer)
      const eventsContainer = cardRef.current.parentElement;
      if (!eventsContainer) return;
      
      const containerRect = eventsContainer.getBoundingClientRect();
      
      // Calculate position relative to the events container (which spans 24 hours)
      const newY = touch.clientY - containerRect.top;
      
      // Calculate new time based on position
      const totalMinutes = snapToGrid((newY / timeSlotHeight) * 60);
      const newHour = Math.floor(totalMinutes / 60);
      const newMinute = totalMinutes % 60;

      if (newHour >= 0 && newHour < 24) {
        // On mobile, we're always in the same column (single day view)
        const targetDate = dates[columnIndex] || dates[0];
        const newStartDate = new Date(targetDate);
        newStartDate.setHours(newHour, newMinute, 0, 0);
        
        const newEndDate = new Date(newStartDate);
        newEndDate.setTime(newStartDate.getTime() + durationMinutes * 60000);

        onMove(event.id, newStartDate.toISOString(), newEndDate.toISOString());
      }
      
      // Additional haptic feedback during drag
      if (navigator.vibrate && Math.abs(newY - topPosition) > 20) {
        navigator.vibrate(10);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // If we were dragging, don't trigger click
    if (isDragging && isDragReady) {
      e.preventDefault();
      e.stopPropagation();
      
      // Notify parent that drag ended
      onDragStateChange?.(false);
    }
    
    setIsDragging(false);
    setIsDragReady(false);
    touchStartPos.current = null;
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: 'top' | 'bottom') => {
    e.stopPropagation();
    setIsResizing(direction);
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && cardRef.current) {
        setHasDragged(true); // Mark that we've moved during this drag
        
        const gridContainer = cardRef.current.closest('.calendar-grid');
        if (!gridContainer) return;

        const gridRect = gridContainer.getBoundingClientRect();
        const newY = e.clientY - gridRect.top - dragOffset.y;
        const newX = e.clientX - gridRect.left;
        
        // Calculate which column/day we're over
        const timeColumnWidth = 80; // matches w-20 time label width
        const availableWidth = gridRect.width - timeColumnWidth;
        const columnWidthPx = availableWidth / dates.length;
        const newColumnIndex = Math.floor((newX - timeColumnWidth) / columnWidthPx);
        
        // Calculate new time based on position
        const totalMinutes = snapToGrid((newY / timeSlotHeight) * 60);
        const newHour = Math.floor(totalMinutes / 60);
        const newMinute = totalMinutes % 60;

        if (newHour >= 0 && newHour < 24 && newColumnIndex >= 0 && newColumnIndex < dates.length) {
          const targetDate = dates[newColumnIndex];
          const newStartDate = new Date(targetDate);
          newStartDate.setHours(newHour, newMinute, 0, 0);
          
          const newEndDate = new Date(newStartDate);
          newEndDate.setTime(newStartDate.getTime() + durationMinutes * 60000);

          onMove(event.id, newStartDate.toISOString(), newEndDate.toISOString());
        }
      } else if (isResizing && cardRef.current) {
        const gridContainer = cardRef.current.closest('.calendar-grid');
        if (!gridContainer) return;

        const gridRect = gridContainer.getBoundingClientRect();
        const mouseY = e.clientY - gridRect.top;

        if (isResizing === 'bottom') {
          const newHeight = mouseY - topPosition;
          const newDurationMinutes = snapToGrid((newHeight / timeSlotHeight) * 60);
          
          if (newDurationMinutes >= 15) {
            const newEndDate = new Date(startDate);
            newEndDate.setTime(startDate.getTime() + newDurationMinutes * 60000);
            onMove(event.id, event.startTime, newEndDate.toISOString());
          }
        } else if (isResizing === 'top') {
          const newTopMinutes = snapToGrid((mouseY / timeSlotHeight) * 60);
          const newStartHour = Math.floor(newTopMinutes / 60);
          const newStartMinute = newTopMinutes % 60;
          
          const newStartDate = new Date(startDate);
          newStartDate.setHours(newStartHour, newStartMinute, 0, 0);
          
          if (newStartDate < endDate && newStartHour >= 0) {
            onMove(event.id, newStartDate.toISOString(), event.endTime);
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, event, onMove, startDate, endDate, durationMinutes, timeSlotHeight, topPosition, dates]);

  // Calculate horizontal position and width based on layout
  const horizontalStyle = layout ? {
    left: `${layout.left}%`,
    width: `${layout.width}%`,
  } : {
    left: '4px',
    right: '4px',
    width: 'auto',
  };

  return (
    <div
      ref={cardRef}
      data-event-card="true"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'absolute select-none overflow-hidden rounded-sm border bg-white/90 shadow-sm transition-all hover:shadow-md',
        'ontouchstart' in window ? 'cursor-pointer' : 'cursor-move',
        styles.card,
        (isDragging || isDragReady) && 'scale-105 shadow-2xl border-primary/60 z-50',
        isResizing && 'scale-[1.01] border-primary/40',
        isHappening && !isDragging && 'scale-[1.01] border-primary/40',
        isUpcoming && !isDragging && 'ring-1 ring-primary/20',
        (isDragging || isResizing) && !isDragReady ? 'z-50' : isDragReady ? 'z-50' : 'z-20',
      )}
      style={{
        top: `${topPosition}px`,
        height: `${height}px`,
        minHeight: '30px',
        ...horizontalStyle,
        paddingLeft: layout ? '6px' : undefined,
        paddingRight: layout ? '6px' : undefined,
      }}
    >
      {/* Vertical color bar on the left - full height and positioned slightly to the right */}
      <div className={cn('absolute left-1.5 top-1 bottom-1 w-1', styles.bar, 'rounded-full')} />

      {/* Top resize handle - hidden on mobile */}
      {'ontouchstart' in window ? null : (
        <div
          className="resize-handle absolute left-4 right-4 top-1 h-1 rounded-full bg-gray-300/50 opacity-0 transition-opacity cursor-ns-resize hover:opacity-100"
          onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
        />
      )}

      <div className="flex h-full flex-col gap-0.5 pl-2 pr-2 py-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {displayEmoji ? (
            <span className="text-base flex-shrink-0">{displayEmoji}</span>
          ) : (
            <EventIcon className="h-3.5 w-3.5 flex-shrink-0 text-foreground/70" />
          )}
          {(event.recurrence || event.recurringEventId) && (
            <RepeatIcon className="h-3 w-3 flex-shrink-0 text-primary" />
          )}
          <h4 
            className="text-sm font-semibold text-foreground leading-tight flex-1 truncate min-w-0" 
            title={event.title}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {event.title}
          </h4>
        </div>

        <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {formatTime(startDate)} – {formatTime(endDate)}
        </p>

        {event.description && height > 80 && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {event.description}
          </p>
        )}

        {height > 60 && (
          <div className="mt-auto flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            {/* Show all attending members */}
            {(event.memberIds || [event.memberId]).map((mId) => {
              const attendee = familyMembers.find(m => m.id === mId) || (mId === event.memberId ? member : null);
              if (!attendee) return null;
              
              return (
                <div key={mId} className="flex items-center gap-1">
                  <Avatar className="h-4 w-4 border border-white shadow-sm">
                    {attendee.avatar ? (
                      <AvatarImage src={attendee.avatar} alt={attendee.name} />
                    ) : (
                      <AvatarFallback className={cn('text-[8px]', attendee.color, 'text-white')}>
                        {getMemberInitials(attendee.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className={cn('h-1.5 w-1.5 rounded-full', attendee.color)} />
                </div>
              );
            })}
            <span className="uppercase tracking-[0.25em]">{formatDuration(startDate, endDate)}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em]', styles.badge)}>
              {event.category}
            </span>
            {isHappening && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-primary-foreground">
                <span className="h-1 w-1 animate-pulse rounded-full bg-white" />
                Now
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom resize handle - hidden on mobile */}
      {'ontouchstart' in window ? null : (
        <div
          className="resize-handle absolute bottom-1 left-4 right-4 h-1 rounded-full bg-gray-300/50 opacity-0 transition-opacity cursor-ns-resize hover:opacity-100"
          onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
        />
      )}
    </div>
  );
};
