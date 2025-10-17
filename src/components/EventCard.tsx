import { CalendarEvent, FamilyMember } from "@/types/calendar";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCategoryMeta, getCategoryEmoji, categoryBadgeClasses, getCategoryName } from "@/config/taskCategories";

interface EventCardProps {
  event: CalendarEvent;
  member?: FamilyMember;
}

/**
 * Category styling now comes from central taskCategories config.
 * For events we reuse the same color scheme to ensure consistent preview.
 * If a lighter variant is desired later we can extend the central config with lightBg/lightBorder.
 */

const getMemberInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
  return cleanName.substring(0, 2).toUpperCase();
};

export const EventCard = ({ event, member }: EventCardProps) => {
  const meta = getCategoryMeta(event.category);
  
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
      meta.bg,
      meta.border
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
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize border",
              categoryBadgeClasses(event.category)
            )}>
              <span className="mr-1">{getCategoryEmoji(event.category)}</span>
              {getCategoryName(event.category)}
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
