import { CalendarEvent, FamilyMember } from "@/types/calendar";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EventCardProps {
  event: CalendarEvent;
  member?: FamilyMember;
}

const CATEGORY_COLORS: Record<CalendarEvent["category"], { bg: string; text: string; border: string }> = {
  health: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  work: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  personal: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  family: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  education: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  social: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  finance: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  home: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  travel: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  fitness: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  food: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  shopping: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  entertainment: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  sports: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  hobby: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  volunteer: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  appointment: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  maintenance: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  celebration: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  meeting: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  childcare: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  pet: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  errand: { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
  transport: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  project: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  deadline: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const getMemberInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
  return cleanName.substring(0, 2).toUpperCase();
};

export const EventCard = ({ event, member }: EventCardProps) => {
  const colors = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.work;
  
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
    <div className={cn(
      "rounded-lg border-2 p-3 shadow-sm transition-all hover:shadow-md",
      colors.bg,
      colors.border
    )}>
      <div className="flex items-start gap-3">
        {/* Emoji or Icon */}
        <div className="flex-shrink-0 text-2xl">
          {event.emoji || '📅'}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="font-semibold text-sm text-gray-900 mb-1">
            {event.title}
          </h4>
          
          {/* Time and Date */}
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <Clock className="h-3 w-3" />
            <span>{formatDate(event.startTime)}</span>
            <span>•</span>
            <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
          </div>
          
          {/* Description if available */}
          {event.description && (
            <p className="text-xs text-gray-600 mb-2">
              {event.description}
            </p>
          )}
          
          {/* Category and Member */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
              colors.bg,
              colors.text
            )}>
              {event.category}
            </span>
            
            {member && (
              <div className="flex items-center gap-1">
                <Avatar className="h-4 w-4 border border-white shadow-sm">
                  {member.avatar ? (
                    <AvatarImage src={member.avatar} alt={member.name} />
                  ) : (
                    <AvatarFallback className={cn('text-[8px]', member.color, 'text-white')}>
                      {getMemberInitials(member.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-xs text-gray-600">{member.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
