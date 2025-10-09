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

  const [activeTab, setActiveTab] = useState(getActiveTab());
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Modern Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900" />
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Top Navigation Bar */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Brand */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-lg opacity-75 animate-pulse" />
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl shadow-xl">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {'AI Cal'}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {language === 'he' ? 'תכנון חכם למשפחה' : 'Smart Family Planning'}
                  </p>
                </div>
              </div>

              {/* Center Tabs */}
              <div className="hidden md:block">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm p-1 rounded-xl shadow-inner">
                    <TabsTrigger 
                      value="calendar" 
                      className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg rounded-lg px-6 py-2.5 transition-all"
                    >
                      <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('nav.calendar')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="tasks" 
                      className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg rounded-lg px-6 py-2.5 transition-all"
                    >
                      <ListTodo className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('nav.tasks')}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleRTL}
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Languages className="h-5 w-5" />
                </Button>
                <div className="hidden sm:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRTL}
                    className="rounded-full px-4 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {language === 'he' ? 'EN' : 'עב'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Tabs */}
            <div className="md:hidden pb-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm p-1 rounded-xl shadow-inner">
                  <TabsTrigger 
                    value="calendar" 
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg rounded-lg"
                  >
                    <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('nav.calendar')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tasks" 
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg rounded-lg"
                  >
                    <ListTodo className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('nav.tasks')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <main className="transition-all duration-300">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="calendar" className="m-0 p-0">
              <Index />
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
