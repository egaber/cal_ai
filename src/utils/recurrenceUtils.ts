import { CalendarEvent, RecurrenceRule } from '@/types/calendar';

/**
 * Generate recurring event instances based on a recurrence rule
 */
export function generateRecurringEvents(
  baseEvent: Omit<CalendarEvent, 'id'>,
  recurrenceRule: RecurrenceRule,
  viewStartDate: Date,
  viewEndDate: Date
): Omit<CalendarEvent, 'id'>[] {
  const events: Omit<CalendarEvent, 'id'>[] = [];
  const startDate = new Date(baseEvent.startTime);
  const endDate = new Date(baseEvent.endTime);
  const duration = endDate.getTime() - startDate.getTime();

  // Calculate the rule's end date
  let ruleEndDate: Date;
  if (recurrenceRule.endDate) {
    ruleEndDate = new Date(recurrenceRule.endDate);
  } else if (recurrenceRule.count) {
    // Calculate end date based on count
    ruleEndDate = calculateEndDateFromCount(startDate, recurrenceRule);
  } else {
    // Default to 2 years if no end specified
    ruleEndDate = new Date(startDate);
    ruleEndDate.setFullYear(ruleEndDate.getFullYear() + 2);
  }

  // Don't generate events beyond the rule's end date
  const effectiveEndDate = new Date(Math.min(viewEndDate.getTime(), ruleEndDate.getTime()));

  let currentDate = new Date(startDate);
  let occurrenceCount = 0;
  const maxOccurrences = recurrenceRule.count || Infinity;

  while (
    currentDate <= effectiveEndDate &&
    occurrenceCount < maxOccurrences
  ) {
    // Check if this occurrence falls within the view range
    if (currentDate >= viewStartDate && currentDate <= effectiveEndDate) {
      // Check if this occurrence matches the recurrence pattern
      if (matchesRecurrencePattern(currentDate, recurrenceRule, startDate)) {
        const eventStart = new Date(currentDate);
        const eventEnd = new Date(currentDate.getTime() + duration);

        events.push({
          ...baseEvent,
          startTime: eventStart.toISOString(),
          endTime: eventEnd.toISOString(),
        });

        occurrenceCount++;
      }
    }

    // Move to next potential occurrence
    currentDate = getNextOccurrence(currentDate, recurrenceRule);

    // Safety check to prevent infinite loops
    if (occurrenceCount > 1000) {
      console.warn('Generated 1000 recurring events, stopping to prevent infinite loop');
      break;
    }
  }

  return events;
}

/**
 * Check if a date matches the recurrence pattern
 */
function matchesRecurrencePattern(
  date: Date,
  rule: RecurrenceRule,
  startDate: Date
): boolean {
  switch (rule.frequency) {
    case 'daily': {
      // Every N days from start date
      const daysDiff = Math.floor(
        (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff % rule.interval === 0;
    }

    case 'weekly': {
      // Check if day of week matches
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const dayOfWeek = date.getDay();
        if (!rule.daysOfWeek.includes(dayOfWeek)) {
          return false;
        }
      }
      // Check interval (every N weeks)
      const weeksDiff = Math.floor(
        (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
      );
      return weeksDiff % rule.interval === 0;
    }

    case 'monthly': {
      // Check if day of month matches
      if (rule.dayOfMonth) {
        if (date.getDate() !== rule.dayOfMonth) {
          return false;
        }
      } else {
        // Use the start date's day of month
        if (date.getDate() !== startDate.getDate()) {
          return false;
        }
      }
      // Check interval (every N months)
      const monthsDiff =
        (date.getFullYear() - startDate.getFullYear()) * 12 +
        (date.getMonth() - startDate.getMonth());
      return monthsDiff % rule.interval === 0;
    }

    case 'yearly': {
      // Must match month and day
      if (
        date.getMonth() !== startDate.getMonth() ||
        date.getDate() !== startDate.getDate()
      ) {
        return false;
      }
      // Check interval (every N years)
      const yearsDiff = date.getFullYear() - startDate.getFullYear();
      return yearsDiff % rule.interval === 0;
    }

    default:
      return false;
  }
}

/**
 * Get the next potential occurrence date
 */
function getNextOccurrence(currentDate: Date, rule: RecurrenceRule): Date {
  const next = new Date(currentDate);

  switch (rule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;

    case 'weekly':
      next.setDate(next.getDate() + 1);
      break;

    case 'monthly':
      next.setDate(next.getDate() + 1);
      break;

    case 'yearly':
      next.setDate(next.getDate() + 1);
      break;
  }

  return next;
}

/**
 * Calculate end date based on count of occurrences
 */
function calculateEndDateFromCount(
  startDate: Date,
  rule: RecurrenceRule
): Date {
  const endDate = new Date(startDate);
  const count = rule.count || 1;

  switch (rule.frequency) {
    case 'daily':
      endDate.setDate(endDate.getDate() + count * rule.interval);
      break;

    case 'weekly':
      endDate.setDate(endDate.getDate() + count * rule.interval * 7);
      break;

    case 'monthly':
      endDate.setMonth(endDate.getMonth() + count * rule.interval);
      break;

    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + count * rule.interval);
      break;
  }

  return endDate;
}

/**
 * Create a human-readable description of a recurrence rule
 */
export function describeRecurrence(rule: RecurrenceRule): string {
  const parts: string[] = [];

  // Frequency
  switch (rule.frequency) {
    case 'daily':
      if (rule.interval === 1) {
        parts.push('Daily');
      } else {
        parts.push(`Every ${rule.interval} days`);
      }
      break;

    case 'weekly':
      if (rule.interval === 1) {
        parts.push('Weekly');
      } else {
        parts.push(`Every ${rule.interval} weeks`);
      }
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = rule.daysOfWeek.map(d => dayNames[d]).join(', ');
        parts.push(`on ${days}`);
      }
      break;

    case 'monthly':
      if (rule.interval === 1) {
        parts.push('Monthly');
      } else {
        parts.push(`Every ${rule.interval} months`);
      }
      if (rule.dayOfMonth) {
        parts.push(`on day ${rule.dayOfMonth}`);
      }
      break;

    case 'yearly':
      if (rule.interval === 1) {
        parts.push('Yearly');
      } else {
        parts.push(`Every ${rule.interval} years`);
      }
      break;
  }

  // End condition
  if (rule.endDate) {
    const date = new Date(rule.endDate);
    parts.push(`until ${date.toLocaleDateString()}`);
  } else if (rule.count) {
    parts.push(`for ${rule.count} occurrences`);
  }

  return parts.join(' ');
}

/**
 * Validate a recurrence rule
 */
export function validateRecurrenceRule(rule: RecurrenceRule): string | null {
  if (rule.interval < 1) {
    return 'Interval must be at least 1';
  }

  if (rule.frequency === 'weekly' && rule.daysOfWeek) {
    if (rule.daysOfWeek.length === 0) {
      return 'At least one day must be selected for weekly recurrence';
    }
    if (rule.daysOfWeek.some(d => d < 0 || d > 6)) {
      return 'Invalid day of week (must be 0-6)';
    }
  }

  if (rule.frequency === 'monthly' && rule.dayOfMonth) {
    if (rule.dayOfMonth < 1 || rule.dayOfMonth > 31) {
      return 'Day of month must be between 1 and 31';
    }
  }

  if (rule.endDate && rule.count) {
    return 'Cannot specify both endDate and count';
  }

  if (rule.endDate) {
    const endDate = new Date(rule.endDate);
    if (isNaN(endDate.getTime())) {
      return 'Invalid end date';
    }
  }

  if (rule.count !== undefined && rule.count < 1) {
    return 'Count must be at least 1';
  }

  return null;
}
