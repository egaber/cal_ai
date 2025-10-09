import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface RTLContextType {
  isRTL: boolean;
  toggleRTL: () => void;
  language: 'he' | 'en';
  setLanguage: (lang: 'he' | 'en') => void;
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

export const useRTL = () => {
  const context = useContext(RTLContext);
  if (!context) {
    throw new Error('useRTL must be used within RTLProvider');
  }
  return context;
};

interface RTLProviderProps {
  children: ReactNode;
}

export const RTLProvider: React.FC<RTLProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<'he' | 'en'>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as 'he' | 'en') || 'he'; // Hebrew by default
  });

  const isRTL = language === 'he';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('app_language', language);
  }, [isRTL, language]);

  const toggleRTL = () => {
    setLanguageState(prev => prev === 'he' ? 'en' : 'he');
  };

  const setLanguage = (lang: 'he' | 'en') => {
    setLanguageState(lang);
  };

  return (
    <RTLContext.Provider value={{ isRTL, toggleRTL, language, setLanguage }}>
      {children}
    </RTLContext.Provider>
  );
};
