import { useState } from 'react';
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { useRTL } from '@/contexts/RTLContext';
import { useTranslation } from '@/i18n/translations';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ListTodo, Languages, Sparkles, Sun, Moon } from 'lucide-react';
import Index from '@/pages/Index';
import TaskPlanning from '@/pages/TaskPlanning';
import MobileTaskDemo from '@/pages/MobileTaskDemo';

const AppLayout = () => {
  const { language, toggleRTL, isRTL } = useRTL();
  const t = useTranslation(language);
  const location = useLocation();
  
  // Determine active tab from URL or default to calendar
  const getActiveTab = () => {
    if (location.pathname.includes('/tasks')) return 'tasks';
    return 'calendar';
  };

  const [activeTab, setActiveTab] = useState<'calendar' | 'tasks'>(getActiveTab());
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Check if we're on the demo page (after hooks)
  if (location.pathname === '/demo' || location.pathname === '/mobile-task-demo') {
    return <MobileTaskDemo />;
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Professional Blue Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Content Area - Header is now inside Index/TaskPlanning pages */}
        <main className="transition-all duration-300">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'calendar' | 'tasks')}>
            <TabsContent value="calendar" className="m-0 p-0">
              <Index 
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
              />
            </TabsContent>
            <TabsContent value="tasks" className="m-0 p-0">
              <TaskPlanning />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
