// Event Layout Utils - Calculate positioning for overlapping events
// Implements an algorithm similar to Outlook calendar for handling multiple overlapping events

import { CalendarEvent } from '@/types/calendar';

export interface EventLayout {
  column: number;
  columnCount: number;
  width: number;
  left: number;
}

interface EventWithTimes {
  event: CalendarEvent;
  start: number; // minutes since midnight
  end: number;   // minutes since midnight
}

/**
 * Calculate layout positions for overlapping events
 * Returns a map of event IDs to their layout information
 */
export function calculateEventLayouts(
  events: CalendarEvent[],
  date: Date
): Map<string, EventLayout> {
  const layouts = new Map<string, EventLayout>();
  
  // Filter events for this specific date and convert to minutes
  const dayEvents: EventWithTimes[] = events
    .filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    })
    .map(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return {
        event,
        start: start.getHours() * 60 + start.getMinutes(),
        end: end.getHours() * 60 + end.getMinutes(),
      };
    })
    .sort((a, b) => {
      // Sort by start time, then by duration (longer first)
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });

  if (dayEvents.length === 0) {
    return layouts;
  }

  // Group overlapping events
  const groups = groupOverlappingEvents(dayEvents);

  // Calculate layout for each group
  groups.forEach(group => {
    const groupLayouts = calculateGroupLayout(group);
    groupLayouts.forEach((layout, eventId) => {
      layouts.set(eventId, layout);
    });
  });

  return layouts;
}

/**
 * Group events that overlap with each other
 */
function groupOverlappingEvents(events: EventWithTimes[]): EventWithTimes[][] {
  const groups: EventWithTimes[][] = [];
  
  events.forEach(event => {
    // Find a group this event overlaps with
    let foundGroup = false;
    
    for (const group of groups) {
      // Check if event overlaps with any event in the group
      const overlaps = group.some(groupEvent => 
        eventsOverlap(event, groupEvent)
      );
      
      if (overlaps) {
        group.push(event);
        foundGroup = true;
        break;
      }
    }
    
    // If no overlapping group found, create a new group
    if (!foundGroup) {
      groups.push([event]);
    }
  });
  
  return groups;
}

/**
 * Check if two events overlap in time
 */
function eventsOverlap(a: EventWithTimes, b: EventWithTimes): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Calculate layout for a group of overlapping events
 * Uses a column-based algorithm similar to Outlook
 */
function calculateGroupLayout(group: EventWithTimes[]): Map<string, EventLayout> {
  const layouts = new Map<string, EventLayout>();
  
  if (group.length === 0) return layouts;
  
  // If only one event, it takes full width
  if (group.length === 1) {
    layouts.set(group[0].event.id, {
      column: 0,
      columnCount: 1,
      width: 100,
      left: 0,
    });
    return layouts;
  }

  // Build a column structure
  // Each column contains events that don't overlap with each other
  const columns: EventWithTimes[][] = [];
  
  // Place each event in the leftmost available column
  for (const event of group) {
    let placedInColumn = false;
    
    // Try to place in existing columns
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      
      // Check if this event overlaps with any event in this column
      const overlapsInColumn = column.some(colEvent => 
        eventsOverlap(event, colEvent)
      );
      
      if (!overlapsInColumn) {
        column.push(event);
        placedInColumn = true;
        break;
      }
    }
    
    // If couldn't place in any existing column, create new column
    if (!placedInColumn) {
      columns.push([event]);
    }
  }

  const totalColumns = columns.length;
  
  // For each event, find its column and calculate layout
  group.forEach(event => {
    // Find which column this event is in
    let eventColumn = 0;
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].some(e => e.event.id === event.event.id)) {
        eventColumn = i;
        break;
      }
    }
    
    // Calculate how many columns this event can expand into
    // An event can expand into adjacent columns if no other events in those columns overlap with it
    let columnSpan = 1;
    
    // Check columns to the right
    for (let col = eventColumn + 1; col < totalColumns; col++) {
      const canExpand = !columns[col].some(colEvent => 
        eventsOverlap(event, colEvent)
      );
      
      if (canExpand) {
        columnSpan++;
      } else {
        break; // Can't expand further
      }
    }
    
    // Calculate width and position
    const widthPercent = (100 / totalColumns) * columnSpan;
    const leftPercent = (100 / totalColumns) * eventColumn;
    
    layouts.set(event.event.id, {
      column: eventColumn,
      columnCount: totalColumns,
      width: widthPercent,
      left: leftPercent,
    });
  });
  
  return layouts;
}

/**
 * Helper to get layout for a specific event, with fallback to full width
 */
export function getEventLayout(
  eventId: string,
  layouts: Map<string, EventLayout>
): EventLayout {
  return layouts.get(eventId) || {
    column: 0,
    columnCount: 1,
    width: 100,
    left: 0,
  };
}
