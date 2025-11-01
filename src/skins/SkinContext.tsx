import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Skin, ThemeMode } from './types';
import { skins, SkinName } from './index';

interface SkinContextType {
  skin: Skin;
  skinName: SkinName;
  setSkin: (skinName: SkinName) => void;
  toggleTheme: () => void;
}

const SkinContext = createContext<SkinContextType | undefined>(undefined);

interface SkinProviderProps {
  children: ReactNode;
  defaultSkin?: SkinName;
}

export const SkinProvider: React.FC<SkinProviderProps> = ({ children, defaultSkin = 'light' }) => {
  const [skinName, setSkinName] = useState<SkinName>(() => {
    // Check localStorage for saved theme preference
    const saved = localStorage.getItem('theme') as SkinName;
    if (saved && (saved === 'light' || saved === 'dark')) {
      return saved;
    }
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return defaultSkin;
  });

  const skin = skins[skinName];

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('theme', skinName);
    
    // Update document class for Tailwind dark mode
    if (skinName === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [skinName]);

  const toggleTheme = () => {
    setSkinName(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value: SkinContextType = {
    skin,
    skinName,
    setSkin: setSkinName,
    toggleTheme,
  };

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
};

export const useSkin = (): SkinContextType => {
  const context = useContext(SkinContext);
  if (!context) {
    throw new Error('useSkin must be used within a SkinProvider');
  }
  return context;
};

// Utility hooks for specific color access
export const useSemanticColors = () => {
  const { skin } = useSkin();
  return skin.semantic;
};

export const useCategoryColors = () => {
  const { skin } = useSkin();
  return skin.categories;
};

export const usePriorityColors = () => {
  const { skin } = useSkin();
  return skin.priorities;
};

export const useStatusColors = () => {
  const { skin } = useSkin();
  return skin.status;
};

export const useTimeBucketColors = () => {
  const { skin } = useSkin();
  return skin.timeBuckets;
};

export const useDateBucketColors = () => {
  const { skin } = useSkin();
  return skin.dateBuckets;
};
