import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useRTL } from '@/contexts/RTLContext';
import { useTranslation } from '@/i18n/translations';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ListTodo, Languages, Sparkles, Sun, Moon } from 'lucide-react';
import Index from '@/pages/Index';
import TaskPlanning from '@/pages/TaskPlanning';

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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="calendar" className="m-0 p-0">
              <Index 
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
              />
            </TabsContent>
            <TabsContent value="tasks" className="m-0 p-0">
              <TaskPlanning 
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isDarkMode={isDarkMode}
                onToggleDarkMode={toggleDarkMode}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
