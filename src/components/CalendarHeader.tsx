import { ChevronLeft, ChevronRight, Sparkles, Plus, Calendar, ListTodo, Languages, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfile } from "./UserProfile";
import { UserProfile as UserProfileType } from "@/types/user";
import { FamilyMember } from "@/types/calendar";
import { APP_ICON, PRIMARY_COLOR, PRIMARY_COLOR_HOVER } from "@/config/branding";
import { useRTL } from "@/contexts/RTLContext";
import { useTranslation } from "@/i18n/translations";

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: 'day' | 'week' | 'workweek' | 'month';
  onViewModeChange: (mode: 'day' | 'week' | 'workweek' | 'month') => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onNewEvent: () => void;
  onAutoOptimize: () => void;
  user?: UserProfileType;
  familyMembers?: FamilyMember[];
  onAddMember?: (member: Omit<FamilyMember, 'id'>) => void;
  onRemoveMember?: (memberId: string) => void;
  activeTab?: 'calendar' | 'tasks';
  onTabChange?: (tab: 'calendar' | 'tasks') => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const CalendarHeader = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onNavigate,
  onNewEvent,
  onAutoOptimize,
  user,
  familyMembers,
  onAddMember,
  onRemoveMember,
  activeTab = 'calendar',
  onTabChange,
  isDarkMode = false,
  onToggleDarkMode
}: CalendarHeaderProps) => {
  const { language, toggleRTL, isRTL } = useRTL();
  const t = useTranslation(language);
  const formatMonthLabel = () => {
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatRangeLabel = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }

    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    }

    // For week and workweek views
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());

    const end = new Date(start);
    if (viewMode === 'workweek') {
      // Work week: Sunday to Thursday (5 days)
      end.setDate(start.getDate() + 4);
    } else {
      // Regular week: Sunday to Saturday (7 days)
      end.setDate(start.getDate() + 6);
    }

    const startLabel = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const endLabel = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return `${startLabel} – ${endLabel}`;
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
      <div className="max-w-[1920px] mx-auto sm:px-6 lg:px-8">
        {/* Main Header Row */}
        <div className="grid w-full gap-8 md:grid-cols-[auto_1fr_auto_auto] md:items-center">
          {/* Left: Logo + Date Label */}
          <div className="flex items-center ">
            <span className="text-5xl">{APP_ICON}</span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-slate-400 dark:text-slate-500">Schedule</p>
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatMonthLabel()}</h2>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatRangeLabel()}</span>
              </div>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
              <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('day')}
                className={`rounded-md px-3 text-sm font-medium transition ${viewMode === 'day' ? 'text-white hover:opacity-90' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                style={viewMode === 'day' ? { backgroundColor: PRIMARY_COLOR } : {}}
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'workweek' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('workweek')}
                className={`rounded-md px-3 text-sm font-medium transition ${viewMode === 'workweek' ? 'text-white hover:opacity-90' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                style={viewMode === 'workweek' ? { backgroundColor: PRIMARY_COLOR } : {}}
              >
                Work Week
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('week')}
                className={`rounded-md px-3 text-sm font-medium transition ${viewMode === 'week' ? 'text-white hover:opacity-90' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                style={viewMode === 'week' ? { backgroundColor: PRIMARY_COLOR } : {}}
              >
                Week
              </Button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('prev')}
              className="h-9 w-9 rounded-md border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate('today')}
              className="h-9 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('next')}
              className="h-9 w-9 rounded-md border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Action Buttons + User Profile */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAutoOptimize()}
              className="rounded-full border border-slate-200/80 bg-white px-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5 text-blue-500" /> Boost with AI
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onNewEvent}
              className="rounded-full px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus className="mr-2 h-4 w-4" /> New Event
            </Button>
            {onToggleDarkMode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleDarkMode}
                className="rounded-full h-9 w-9"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRTL}
              className="rounded-full h-9 w-9"
            >
              <Languages className="h-4 w-4" />
            </Button>
            {user && (
              <UserProfile 
                user={user}
                familyMembers={familyMembers}
                onAddMember={onAddMember}
                onRemoveMember={onRemoveMember}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
