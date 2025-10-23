import { useState, useEffect, useRef } from 'react';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';

interface ParsedSegment {
  text: string;
  type: 'text' | 'date' | 'time' | 'location' | 'priority';
  value?: Date | { hour: number; minute: number } | string;
  start: number;
  end: number;
}

interface SmartTextInputProps {
  value: string;
  onChange: (value: string, segments: ParsedSegment[]) => void;
  placeholder?: string;
  lang?: 'he' | 'en';
  className?: string;
}

export default function SmartTextInput({
  value,
  onChange,
  placeholder = '',
  lang = 'he',
  className = ''
}: SmartTextInputProps) {
  const [segments, setSegments] = useState<ParsedSegment[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const parseText = (text: string): ParsedSegment[] => {
    if (!text) return [];

    const allMatches: Array<{
      start: number;
      end: number;
      type: 'date' | 'time' | 'location' | 'priority';
      value: Date | { hour: number; minute: number } | string;
    }> = [];

    // Priority patterns (P1, P2, P3)
    const priorityRegex = /\b[Pp][123]\b/g;
    let match;
    while ((match = priorityRegex.exec(text)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'priority',
        value: match[0].toUpperCase()
      });
    }

    if (lang === 'he') {
      // Tomorrow: מחר
      const tomorrowRegex = /\bמחר\b/gi;
      while ((match = tomorrowRegex.exec(text)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'date',
          value: addDays(new Date(), 1)
        });
      }

      // Today: היום, הערב
      const todayRegex = /\b(היום|הערב)\b/gi;
      while ((match = todayRegex.exec(text)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'date',
          value: new Date()
        });
      }

      // Days of week
      const daysOfWeek = [
        { name: 'ראשון', day: 0 },
        { name: 'שני', day: 1 },
        { name: 'שלישי', day: 2 },
        { name: 'רביעי', day: 3 },
        { name: 'חמישי', day: 4 },
        { name: 'שישי', day: 5 },
        { name: 'שבת', day: 6 },
      ];

      daysOfWeek.forEach(({ name, day }) => {
        const regex = new RegExp(`\\b(יום )?${name}\\b`, 'gi');
        while ((match = regex.exec(text)) !== null) {
          const today = new Date();
          const currentDay = today.getDay();
          let daysToAdd = day - currentDay;
          if (daysToAdd <= 0) daysToAdd += 7;
          
          allMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'date',
            value: addDays(today, daysToAdd)
          });
        }
      });

      // Time patterns: בשעה 14:00, ב-15:30
      const timeRegex = /\b(?:בשעה|ב-?)\s*(\d{1,2}):(\d{2})\b/gi;
      while ((match = timeRegex.exec(text)) !== null) {
        const hour = parseInt(match[1]);
        const minute = parseInt(match[2]);
        if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
          allMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'time',
            value: { hour, minute }
          });
        }
      }

      // Location patterns: ב-, בבית, במשרד
      const locationRegex = /\b(?:במקום|בבית|במשרד|ב-)\s*([א-ת]+)/gi;
      while ((match = locationRegex.exec(text)) !== null) {
        if (match[0].length > 2) {
          allMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'location',
            value: match[0]
          });
        }
      }
    } else {
      // English patterns
      const tomorrowRegex = /\btomorrow\b/gi;
      while ((match = tomorrowRegex.exec(text)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'date',
          value: addDays(new Date(), 1)
        });
      }

      const todayRegex = /\btoday\b/gi;
      while ((match = todayRegex.exec(text)) !== null) {
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'date',
          value: new Date()
        });
      }

      // Time patterns: at 2:00 PM, at 14:30
      const timeRegex = /\bat\s*(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\b/gi;
      while ((match = timeRegex.exec(text)) !== null) {
        let hour = parseInt(match[1]);
        const minute = parseInt(match[2]);
        const meridiem = match[3]?.toUpperCase();

        if (meridiem === 'PM' && hour < 12) hour += 12;
        if (meridiem === 'AM' && hour === 12) hour = 0;

        if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
          allMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'time',
            value: { hour, minute }
          });
        }
      }

      // Location patterns
      const locationRegex = /\b(?:at|in)\s+([A-Za-z]+)/gi;
      while ((match = locationRegex.exec(text)) !== null) {
        if (match[0].length > 3) {
          allMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'location',
            value: match[0]
          });
        }
      }
    }

    // Date patterns (DD/MM/YYYY, YYYY-MM-DD)
    const dateRegex = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/g;
    while ((match = dateRegex.exec(text)) !== null) {
      try {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        let year = parseInt(match[3]);
        if (year < 100) year += 2000;

        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          allMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'date',
            value: date
          });
        }
      } catch (e) {
        // Invalid date, skip
      }
    }

    // Sort matches by start position
    allMatches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches (keep first one)
    const filteredMatches = allMatches.filter((match, index) => {
      if (index === 0) return true;
      const prevMatch = allMatches[index - 1];
      return match.start >= prevMatch.end;
    });

    // Build segments
    const result: ParsedSegment[] = [];
    let lastEnd = 0;

    filteredMatches.forEach(match => {
      // Add text segment before this match
      if (match.start > lastEnd) {
        result.push({
          text: text.substring(lastEnd, match.start),
          type: 'text',
          start: lastEnd,
          end: match.start
        });
      }

      // Add matched segment
      result.push({
        text: text.substring(match.start, match.end),
        type: match.type,
        value: match.value,
        start: match.start,
        end: match.end
      });

      lastEnd = match.end;
    });

    // Add remaining text
    if (lastEnd < text.length) {
      result.push({
        text: text.substring(lastEnd),
        type: 'text',
        start: lastEnd,
        end: text.length
      });
    }

    return result;
  };

  useEffect(() => {
    const parsed = parseText(value);
    setSegments(parsed);
    onChange(value, parsed);
  }, [value, lang]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newValue = e.currentTarget.textContent || '';
    onChange(newValue, parseText(newValue));
  };

  const getSegmentStyle = (type: string) => {
    switch (type) {
      case 'date':
        return 'bg-blue-100 text-blue-800 rounded px-1 font-medium';
      case 'time':
        return 'bg-green-100 text-green-800 rounded px-1 font-medium';
      case 'location':
        return 'bg-purple-100 text-purple-800 rounded px-1 font-medium';
      case 'priority':
        return 'bg-red-100 text-red-800 rounded px-1 font-medium';
      default:
        return '';
    }
  };

  const getTooltip = (segment: ParsedSegment) => {
    if (segment.type === 'date' && segment.value instanceof Date) {
      return format(segment.value, 'EEEE, dd/MM/yyyy', { locale: he });
    }
    if (segment.type === 'time' && typeof segment.value === 'object' && 'hour' in segment.value) {
      return `${String(segment.value.hour).padStart(2, '0')}:${String(segment.value.minute).padStart(2, '0')}`;
    }
    return segment.text;
  };


  return (
    <div className="relative">
      <div
        ref={inputRef}
        contentEditable
        onInput={handleInput}
        className={`w-full min-h-[42px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-pre-wrap break-words ${className}`}
        style={{ 
          direction: lang === 'he' ? 'rtl' : 'ltr',
          textAlign: lang === 'he' ? 'right' : 'left',
          unicodeBidi: 'embed'
        }}
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{
          __html: value
            ? segments
                .map((segment) => {
                  const escapedText = segment.text
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
                  
                  if (segment.type === 'text') {
                    return escapedText;
                  }
                  const style = getSegmentStyle(segment.type);
                  const tooltip = getTooltip(segment).replace(/"/g, '&quot;');
                  return `<span class="${style}" title="${tooltip}">${escapedText}</span>`;
                })
                .join('')
            : `<span class="text-gray-400">${placeholder}</span>`,
        }}
      />
      
      {/* Tooltip showing what was detected */}
      {segments.some(s => s.type !== 'text') && (
        <div className="mt-1 flex flex-wrap gap-1 text-xs">
          {segments
            .filter(s => s.type !== 'text')
            .map((segment, index) => (
              <span
                key={index}
                className={`px-2 py-0.5 rounded-full ${
                  segment.type === 'date' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  segment.type === 'time' ? 'bg-green-50 text-green-700 border border-green-200' :
                  segment.type === 'location' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                  'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {segment.type === 'date' && segment.value instanceof Date && (
                  <>📅 {format(segment.value, 'dd/MM/yyyy', { locale: he })}</>
                )}
                {segment.type === 'time' && typeof segment.value === 'object' && 'hour' in segment.value && (
                  <>🕐 {String(segment.value.hour).padStart(2, '0')}:{String(segment.value.minute).padStart(2, '0')}</>
                )}
                {segment.type === 'location' && (
                  <>📍 {segment.text}</>
                )}
                {segment.type === 'priority' && (
                  <>🔥 {segment.text}</>
                )}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
