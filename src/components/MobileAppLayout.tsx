import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRTL } from '@/contexts/RTLContext';
import { useTranslation } from '@/i18n/translations';
import { Calendar, ListTodo, Sparkles, MessageSquare } from 'lucide-react';
import MobileIndex from '@/pages/MobileIndex';
import MobileTasks from '@/pages/MobileTasks';
import { AIAssistant } from '@/components/AIAssistant';
import { CalendarService } from '@/services/calendarService';

const MobileAppLayout = () => {
  const { language } = useRTL();
  const t = useTranslation(language);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab from URL or default to calendar
  const getActiveTab = () => {
    if (location.pathname.includes('/tasks')) return 'tasks';
    return 'calendar';
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'tasks') {
      navigate('/tasks');
    } else if (tab === 'calendar') {
      navigate('/');
    }
    // AI tab stays on same route but shows AI content
  };

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'dark' : ''} overflow-hidden`}>
      {/* Fixed Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 -z-10" />
      
      {/* Main Content Area - Takes remaining space */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'calendar' && <MobileIndex />}
        {activeTab === 'tasks' && <MobileTasks />}
        {activeTab === 'ai' && (
          <AIAssistant
            calendarService={new CalendarService({
              createEvent: () => {},
              updateEvent: () => {},
              deleteEvent: () => {},
              moveEvent: () => {},
            })}
            currentDate={new Date()}
            todayEvents={[]}
            weekEvents={[]}
            familyMembers={[]}
            onMemoryUpdate={() => {}}
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
              AI
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
        </div>
      </nav>
    </div>
  );
};

export default MobileAppLayout;
