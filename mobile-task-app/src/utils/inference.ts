// Inference Rules - Smart logic for automatic context detection

import { 
  FamilyMember, 
  FamilyMemberName, 
  KnownPlace, 
  TimeBucket,
  RecurringPattern 
} from '../types/mobileTask';
import { getFamilyMember, getKnownPlace, FAMILY_MEMBERS } from './patterns';

/**
 * Infer if driving is required based on:
 * 1. If any children who need supervision are involved
 * 2. If the location requires driving
 * 3. If there's a transport action mentioned
 */
export function inferDrivingNeeds(params: {
  involvedMembers: FamilyMemberName[];
  location?: string;
  hasTransportAction: boolean;
}): {
  requiresDriving: boolean;
  drivingDuration?: number;
  drivingFrom: string;
  drivingTo?: string;
  reason?: string;
} {
  const { involvedMembers, location, hasTransportAction } = params;
  
  // Check if any involved members are children who need supervision
  const needsSupervisionMembers = involvedMembers
    .map(name => getFamilyMember(name))
    .filter((member): member is FamilyMember => 
      member !== undefined && member.isChild && member.needsSupervision
    );
  
  const hasChildrenNeedingSupervision = needsSupervisionMembers.length > 0;
  
  // Check if location requires driving
  const place = location ? getKnownPlace(location) : undefined;
  const locationRequiresDriving = place?.requiresDriving || false;
  
  // Determine if driving is needed
  const requiresDriving = (
    (hasChildrenNeedingSupervision && locationRequiresDriving) ||
    (hasTransportAction && locationRequiresDriving) ||
    (hasChildrenNeedingSupervision && hasTransportAction)
  );
  
  if (!requiresDriving) {
    return {
      requiresDriving: false,
      drivingFrom: 'home',
    };
  }
  
  // Calculate driving duration
  const drivingDuration = place?.drivingTimeFromHome;
  
  // Build reason
  let reason = 'Driving needed';
  if (hasChildrenNeedingSupervision) {
    const childNames = needsSupervisionMembers.map(m => m.name).join(', ');
    reason = `Driving needed for ${childNames}`;
  }
  if (location && place) {
    reason += ` to ${place.name}`;
  }
  
  return {
    requiresDriving: true,
    drivingDuration,
    drivingFrom: 'home',
    drivingTo: place?.name,
    reason,
  };
}

/**
 * Infer time bucket from various date/time indicators
 */
export function inferTimeBucket(params: {
  specificDate?: Date;
  hasToday?: boolean;
  hasTomorrow?: boolean;
  hasThisWeek?: boolean;
  hasNextWeek?: boolean;
}): TimeBucket {
  const { specificDate, hasToday, hasTomorrow, hasThisWeek, hasNextWeek } = params;
  
  // Explicit time bucket keywords
  if (hasToday) return 'today';
  if (hasTomorrow) return 'tomorrow';
  if (hasNextWeek) return 'next-week';
  if (hasThisWeek) return 'this-week';
  
  // Infer from specific date
  if (specificDate) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskDate = new Date(
      specificDate.getFullYear(),
      specificDate.getMonth(),
      specificDate.getDate()
    );
    
    // Check if it's today
    if (taskDate.getTime() === today.getTime()) {
      return 'today';
    }
    
    // Check if it's tomorrow
    if (taskDate.getTime() === tomorrow.getTime()) {
      return 'tomorrow';
    }
    
    // Check if it's this week (Sunday to Saturday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    if (taskDate >= startOfWeek && taskDate <= endOfWeek) {
      return 'this-week';
    }
    
    // Check if it's next week
    const startOfNextWeek = new Date(endOfWeek);
    startOfNextWeek.setDate(endOfWeek.getDate() + 1);
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    
    if (taskDate >= startOfNextWeek && taskDate <= endOfNextWeek) {
      return 'next-week';
    }
  }
  
  // Default to unlabeled
  return 'unlabeled';
}

/**
 * Infer owner from text context
 * "I need to" → primary user (Eyal)
 * "Ella needs to" → Ella
 */
export function inferOwner(params: {
  hasINeeds: boolean;
  mentionedMembers: FamilyMemberName[];
  explicitOwner?: FamilyMemberName;
}): FamilyMemberName | undefined {
  const { hasINeeds, mentionedMembers, explicitOwner } = params;
  
  // Explicit owner takes precedence
  if (explicitOwner) {
    return explicitOwner;
  }
  
  // "I need to" implies Eyal (primary user)
  if (hasINeeds) {
    return 'Eyal';
  }
  
  // If only one member mentioned, might be the owner
  if (mentionedMembers.length === 1) {
    const member = getFamilyMember(mentionedMembers[0]);
    // Only adults can be default owners
    if (member && !member.isChild) {
      return member.name;
    }
  }
  
  return undefined;
}

/**
 * Separate involved members from potential owner
 */
export function separateOwnerAndInvolved(
  allMentioned: FamilyMemberName[]
): {
  owner?: FamilyMemberName;
  involved: FamilyMemberName[];
} {
  // If no members mentioned
  if (allMentioned.length === 0) {
    return { involved: [] };
  }
  
  // If only one member, check if adult (potential owner) or child (involved)
  if (allMentioned.length === 1) {
    const member = getFamilyMember(allMentioned[0]);
    if (member?.isChild) {
      return { involved: allMentioned };
    } else {
      return { owner: allMentioned[0], involved: [] };
    }
  }
  
  // Multiple members: first adult is owner, rest are involved
  const adults = allMentioned.filter(name => {
    const member = getFamilyMember(name);
    return member && !member.isChild;
  });
  
  const children = allMentioned.filter(name => {
    const member = getFamilyMember(name);
    return member && member.isChild;
  });
  
  if (adults.length > 0) {
    return {
      owner: adults[0],
      involved: [...adults.slice(1), ...children],
    };
  }
  
  // All children - no owner, all involved
  return { involved: allMentioned };
}

/**
 * Infer if this is a reminder vs actionable task
 */
export function inferTaskType(params: {
  hasReminderKeyword: boolean;
  hasTaskKeyword: boolean;
  hasOwner: boolean;
  hasAction: boolean;
}): {
  isReminder: boolean;
  confidence: number;
} {
  const { hasReminderKeyword, hasTaskKeyword, hasOwner, hasAction } = params;
  
  // Strong indicators
  if (hasReminderKeyword) {
    return { isReminder: true, confidence: 0.9 };
  }
  
  if (hasTaskKeyword || hasOwner || hasAction) {
    return { isReminder: false, confidence: 0.8 };
  }
  
  // Default to task (more common)
  return { isReminder: false, confidence: 0.5 };
}

/**
 * Infer recurring pattern from text
 */
export function inferRecurring(params: {
  hasDaily?: boolean;
  hasWeekly?: boolean;
  hasMonthly?: boolean;
}): RecurringPattern {
  const { hasDaily, hasWeekly, hasMonthly } = params;
  
  if (hasDaily) return 'daily';
  if (hasWeekly) return 'weekly';
  if (hasMonthly) return 'monthly';
  
  return 'none';
}

/**
 * Calculate confidence score for the entire parsing
 */
export function calculateConfidence(params: {
  hasTimeBucket: boolean;
  hasLocation: boolean;
  hasFamilyMembers: boolean;
  hasSpecificTime: boolean;
  hasMultipleIndicators: boolean;
}): number {
  const { hasTimeBucket, hasLocation, hasFamilyMembers, hasSpecificTime, hasMultipleIndicators } = params;
  
  let confidence = 0.5; // Base confidence
  
  if (hasTimeBucket) confidence += 0.15;
  if (hasLocation) confidence += 0.1;
  if (hasFamilyMembers) confidence += 0.1;
  if (hasSpecificTime) confidence += 0.1;
  if (hasMultipleIndicators) confidence += 0.05;
  
  return Math.min(confidence, 1.0);
}

/**
 * Generate warnings for potential issues
 */
export function generateWarnings(params: {
  requiresDriving: boolean;
  hasLocation: boolean;
  involvedMembers: FamilyMemberName[];
  hasTime: boolean;
  timeBucket: TimeBucket;
}): string[] {
  const warnings: string[] = [];
  const { requiresDriving, hasLocation, involvedMembers, hasTime, timeBucket } = params;
  
  // Driving without location
  if (requiresDriving && !hasLocation) {
    warnings.push('Driving detected but no location specified');
  }
  
  // Children without time
  const children = involvedMembers.filter(name => {
    const member = getFamilyMember(name);
    return member?.isChild;
  });
  
  if (children.length > 0 && !hasTime && timeBucket === 'unlabeled') {
    warnings.push('Task involves children but no time specified');
  }
  
  // Location without driving consideration
  if (hasLocation && !requiresDriving) {
    const place = getKnownPlace(hasLocation ? 'test' : '');
    if (place?.requiresDriving) {
      warnings.push('Location usually requires driving - consider adding family members');
    }
  }
  
  return warnings;
}
