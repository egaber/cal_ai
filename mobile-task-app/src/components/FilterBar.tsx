/**
 * FilterBar Component
 * 
 * Horizontal scrollable filter chips for task filtering.
 * Hebrew RTL support with smooth animations.
 */

import React from 'react';
import { TaskFilter, FilterType, FamilyMemberName, PriorityLevel } from '../types/mobileTask';
import { FAMILY_MEMBERS } from '../utils/patterns';

interface FilterBarProps {
  activeFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
}

interface FilterOption {
  type: FilterType;
  label: string;
  emoji: string;
  familyMember?: FamilyMemberName;
  priority?: PriorityLevel;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const [showFamilyMenu, setShowFamilyMenu] = React.useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = React.useState(false);

  // Base filters
  const baseFilters: FilterOption[] = [
    { type: 'all', label: 'הכל', emoji: '📋' },
    { type: 'my-tasks', label: 'המשימות שלי', emoji: '👤' },
    { type: 'today', label: 'היום', emoji: '📅' },
    { type: 'this-week', label: 'השבוע', emoji: '📆' },
  ];

  // Family member filters
  const familyFilters: FilterOption[] = FAMILY_MEMBERS.map(member => ({
    type: 'by-family' as FilterType,
    label: member.displayNameHebrew,
    emoji: member.isChild ? '👶' : '👤',
    familyMember: member.name,
  }));

  // Priority filters
  const priorityFilters: FilterOption[] = [
    { type: 'by-priority', label: 'P1 - דחוף', emoji: '🔴', priority: 'P1' },
    { type: 'by-priority', label: 'P2 - חשוב', emoji: '🟠', priority: 'P2' },
    { type: 'by-priority', label: 'P3 - רגיל', emoji: '🟡', priority: 'P3' },
  ];

  const isFilterActive = (filter: FilterOption): boolean => {
    if (filter.type !== activeFilter.type) return false;
    if (filter.familyMember) {
      return activeFilter.familyMember === filter.familyMember;
    }
    if (filter.priority) {
      return activeFilter.priority === filter.priority;
    }
    return true;
  };

  const handleFilterClick = (filter: FilterOption) => {
    onFilterChange({
      type: filter.type,
      familyMember: filter.familyMember,
      priority: filter.priority,
    });
    setShowFamilyMenu(false);
    setShowPriorityMenu(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-2 py-2" dir="rtl">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Base filters */}
        {baseFilters.map((filter, idx) => (
          <button
            key={idx}
            onClick={() => handleFilterClick(filter)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isFilterActive(filter)
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{filter.emoji}</span>
            <span>{filter.label}</span>
          </button>
        ))}

        {/* Family filter dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => {
              setShowFamilyMenu(!showFamilyMenu);
              setShowPriorityMenu(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeFilter.type === 'by-family'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>👥</span>
            <span>
              {activeFilter.type === 'by-family' && activeFilter.familyMember
                ? FAMILY_MEMBERS.find(m => m.name === activeFilter.familyMember)?.displayNameHebrew
                : 'בן משפחה'}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showFamilyMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Family dropdown menu */}
          {showFamilyMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[150px]">
              {familyFilters.map((filter, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFilterClick(filter)}
                  className="w-full text-right px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <span>{filter.emoji}</span>
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority filter dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => {
              setShowPriorityMenu(!showPriorityMenu);
              setShowFamilyMenu(false);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeFilter.type === 'by-priority'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>🚩</span>
            <span>
              {activeFilter.type === 'by-priority' && activeFilter.priority
                ? activeFilter.priority
                : 'עדיפות'}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showPriorityMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Priority dropdown menu */}
          {showPriorityMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[150px]">
              {priorityFilters.map((filter, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFilterClick(filter)}
                  className="w-full text-right px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <span>{filter.emoji}</span>
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hide scrollbar - CSS handled in global styles or inline */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
