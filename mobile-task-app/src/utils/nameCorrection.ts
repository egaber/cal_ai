// Name Correction Utility for Speech Recognition

/**
 * Maps common speech recognition mistakes to correct family member names
 */
const NAME_CORRECTIONS: Record<string, string> = {
  // Hilly variations (common misrecognitions)
  'אילי': 'הילי',
  'היילי': 'הילי',
  
  // Alon variations
  'אילון': 'אלון',
  'עלון': 'אלון',
  
  // Yael variations
  'יעאל': 'יעל',
  'יאל': 'יעל',
  
  // Ella variations (note: אילה could be Hilly or Ella - we'll prefer Hilly)
  'עלה': 'אלה',
  'הילה': 'אלה',
  'אילת': 'אלה',
  
  // Eyal variations
  'איל': 'אייל',
  'עייל': 'אייל',
  'איאל': 'אייל',
};

/**
 * Corrects common speech recognition mistakes in family member names
 * @param text The text from speech recognition
 * @returns Corrected text with proper family member names
 */
export function correctFamilyNames(text: string): string {
  let corrected = text;
  
  // Apply corrections for each known mistake
  for (const [mistake, correction] of Object.entries(NAME_CORRECTIONS)) {
    // Create regex that matches the mistake with word boundaries
    // Using lookahead/lookbehind for Hebrew (space or start/end of string)
    const regex = new RegExp(`(?<=^|\\s)${mistake}(?=\\s|$)`, 'g');
    corrected = corrected.replace(regex, correction);
    
    // Also check with common Hebrew prefixes
    const prefixes = ['ל', 'ש', 'ב', 'כ', 'את '];
    for (const prefix of prefixes) {
      const prefixedMistake = prefix + mistake;
      const prefixedCorrection = prefix + correction;
      const prefixRegex = new RegExp(`(?<=^|\\s)${prefixedMistake}(?=\\s|$)`, 'g');
      corrected = corrected.replace(prefixRegex, prefixedCorrection);
    }
  }
  
  return corrected;
}

/**
 * Calculates similarity score between two strings (0-1)
 * Uses simple character matching for Hebrew text
 */
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  
  return matches / longer.length;
}

/**
 * Finds the best matching family name from a list of known names
 * @param spokenName The name as recognized by speech
 * @param knownNames List of correct family member names
 * @param threshold Minimum similarity threshold (default 0.6)
 * @returns The best matching name or the original if no good match
 */
export function findBestNameMatch(
  spokenName: string, 
  knownNames: string[], 
  threshold: number = 0.6
): string {
  let bestMatch = spokenName;
  let bestScore = 0;
  
  for (const knownName of knownNames) {
    const score = similarity(spokenName.toLowerCase(), knownName.toLowerCase());
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      bestMatch = knownName;
    }
  }
  
  return bestMatch;
}
