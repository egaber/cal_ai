import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRTL } from '@/contexts/RTLContext';
import { useTranslation } from '@/i18n/translations';
import { useEvents } from '@/contexts/EventContext';
import { useFamily } from '@/contexts/FamilyContext';
import { Calendar, ListTodo, Sparkles, MessageSquare, Settings, Bot } from 'lucide-react';
import MobileIndex from '@/pages/MobileIndex';
import MobileTasks from '@/pages/MobileTasks';
import MobileSettings from '@/pages/MobileSettings';
import MobileMemory from '@/pages/MobileMemory';
import MobileDailySchedules from '@/pages/MobileDailySchedules';
import MobilePlanningChat from '@/pages/MobilePlanningChat';
import { AIAssistant } from '@/components/AIAssistant';
import { CalendarService } from '@/services/calendarService';
import { CalendarEvent } from '@/types/calendar';

const MobileAppLayout = () => {
  const { language } = useRTL();
  const t = useTranslation(language);
  const location = useLocation();
  const navigate = useNavigate();
  const { events, createEvent, updateEvent, deleteEvent } = useEvents();
  const { family } = useFamily();
  
  // Determine active tab from URL or default to calendar
  const getActiveTab = () => {
    if (location.pathname.includes('/tasks')) return 'tasks';
    if (location.pathname.includes('/settings')) return 'settings';
    if (location.pathname.includes('/memory')) return 'memory';
    if (location.pathname.includes('/schedules')) return 'schedules';
    if (location.pathname.includes('/planning')) return 'planning';
    return 'calendar';
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [targetEventId, setTargetEventId] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  // Handle navigation from location state (e.g., from MobileTasks)
  useEffect(() => {
    const state = location.state as { initialDate?: string; highlightEventId?: string } | null;
    if (state?.initialDate) {
      setCalendarDate(new Date(state.initialDate));
      setActiveTab('calendar');
    }
    if (state?.highlightEventId) {
      setTargetEventId(state.highlightEventId);
    }
  }, [location.state]);

  // Get today's and this week's events
  const currentDate = new Date();
  const todayStart = new Date(currentDate);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(currentDate);
  todayEnd.setHours(23, 59, 59, 999);

  const weekEnd = new Date(currentDate);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const todayEvents = events.filter(event => {
    const eventStart = new Date(event.startTime);
    return eventStart >= todayStart && eventStart <= todayEnd;
  });

  const weekEvents = events.filter(event => {
    const eventStart = new Date(event.startTime);
    return eventStart >= currentDate && eventStart <= weekEnd;
  });

  // Create CalendarService with real operations
  const calendarService = useMemo(() => new CalendarService({
    createEvent: (eventData: Omit<CalendarEvent, 'id'>) => {
      console.log('Creating event via AI:', eventData);
      createEvent(eventData);
    },
    updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => {
      console.log('Updating event via AI:', eventId, updates);
      updateEvent(eventId, updates);
    },
    deleteEvent: (eventId: string) => {
      console.log('Deleting event via AI:', eventId);
      deleteEvent(eventId);
    },
    moveEvent: (eventId: string, newStartTime: string, newEndTime: string) => {
      console.log('Moving event via AI:', eventId, newStartTime, newEndTime);
      updateEvent(eventId, { startTime: newStartTime, endTime: newEndTime });
    },
  }), [createEvent, updateEvent, deleteEvent]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'tasks') {
      navigate('/tasks');
    } else if (tab === 'schedules') {
      navigate('/schedules');
    } else if (tab === 'planning') {
      navigate('/planning');
    } else if (tab === 'calendar') {
      navigate('/');
    } else if (tab === 'settings') {
      navigate('/settings');
    }
    // AI tab stays on same route but shows AI content
  };

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'dark' : ''} overflow-hidden`}>
      {/* Fixed Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 -z-10" />
      
      {/* Main Content Area - Takes remaining space */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'calendar' && (
          <MobileIndex 
            targetEventId={targetEventId}
            onEventTargeted={() => setTargetEventId(null)}
            initialDate={calendarDate}
            onDateChange={setCalendarDate}
          />
        )}
        {activeTab === 'tasks' && <MobileTasks />}
        {activeTab === 'schedules' && <MobileDailySchedules />}
        {activeTab === 'planning' && <MobilePlanningChat />}
        {activeTab === 'settings' && <MobileSettings />}
        {activeTab === 'memory' && <MobileMemory />}
        {activeTab === 'ai' && (
          <AIAssistant
            calendarService={calendarService}
            currentDate={currentDate}
            todayEvents={todayEvents}
            weekEvents={weekEvents}
            familyMembers={family?.members || []}
            onMemoryUpdate={() => {}}
            onNavigateToCalendar={(eventId) => {
              // Find the event to get its date
              const targetEvent = events.find(e => e.id === eventId);
              if (targetEvent) {
                const eventDate = new Date(targetEvent.startTime);
                // Set the calendar date first
                setCalendarDate(eventDate);
              }
              // Set the target event ID for highlighting
              setTargetEventId(eventId);
              // Switch to calendar tab
              setActiveTab('calendar');
              navigate('/');
            }}
          />
        )}
      </main>

      {/* iOS-style Bottom Navigation */}
      <nav className="flex-none ios-bottom-nav">
        <div className="flex items-center justify-around px-4 py-1">
          <button
            onClick={() => handleTabChange('calendar')}
            className={`flex flex-col items-center gap-0.5 py-2 px-6 touch-target transition-all ${
              activeTab === 'calendar'
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Calendar className={`h-6 w-6 ${activeTab === 'calendar' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium">
              {t('nav.calendar')}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('ai')}
            className={`flex flex-col items-center gap-0.5 py-2 px-6 touch-target transition-all ${
              activeTab === 'ai'
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <MessageSquare className={`h-6 w-6 ${activeTab === 'ai' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium">
              💬 שיחה
            </span>
          </button>

          <button
            onClick={() => handleTabChange('tasks')}
            className={`flex flex-col items-center gap-0.5 py-2 px-6 touch-target transition-all ${
              activeTab === 'tasks'
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <ListTodo className={`h-6 w-6 ${activeTab === 'tasks' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium">
              {t('nav.tasks')}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('settings')}
            className={`flex flex-col items-center gap-0.5 py-2 px-6 touch-target transition-all ${
              activeTab === 'settings'
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Settings className={`h-6 w-6 ${activeTab === 'settings' ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium">
              הגדרות
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default MobileAppLayout;
