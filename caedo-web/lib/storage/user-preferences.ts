/**
 * User Preferences Storage
 * 
 * Stores user context gathered from onboarding interview and settings.
 * This context is used by the AI to generate better, personalized designs.
 */

import { get, set, del } from 'idb-keyval';

const PREFERENCES_KEY = 'caedo_user_preferences';

export interface UserPreferences {
  // Has the user completed onboarding?
  onboardingComplete: boolean;
  onboardingDate?: number;
  
  // Printer setup
  printer: {
    profileId: string;           // Reference to printer profile
    customName?: string;         // User's name for their printer
    materials: string[];         // Commonly used materials (PLA, PETG, etc.)
    primaryColor?: string;       // Most used filament color
    additionalColors?: string[]; // For multi-color setups
  };
  
  // User experience level
  experience: {
    level: 'beginner' | 'intermediate' | 'advanced';
    yearsExperience?: number;
    familiarWithCAD: boolean;
    familiarWithJSCAD: boolean;
  };
  
  // Common use cases
  useCases: {
    primary: string;             // Main thing they design
    categories: string[];        // Categories they're interested in
    // Pre-defined categories:
    // - 'functional' (brackets, mounts, enclosures)
    // - 'organizers' (storage, holders, trays)
    // - 'decorative' (art, gifts, display items)
    // - 'mechanical' (gears, hinges, mechanisms)
    // - 'electronics' (cases for RPi, Arduino, etc.)
    // - 'household' (hooks, clips, repairs)
    // - 'prototyping' (quick test parts)
  };
  
  // Components they commonly make cases for
  commonComponents: string[];    // e.g., ['Raspberry Pi 4', 'Arduino Nano', 'NEMA 17']
  
  // Design preferences
  designPreferences: {
    preferRoundedEdges: boolean;
    preferMinimalist: boolean;
    prioritizePrintSpeed: boolean;
    prioritizeStrength: boolean;
    defaultInfill?: number;      // Percentage
  };
  
  // AI interaction preferences
  aiPreferences: {
    verbosity: 'concise' | 'detailed' | 'educational';
    showDFMExplanations: boolean;
    suggestImprovements: boolean;
    autoOptimizeForPrinter: boolean;
  };
}

/**
 * Default preferences for new users
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  onboardingComplete: false,
  
  printer: {
    profileId: 'generic',
    materials: ['PLA'],
  },
  
  experience: {
    level: 'intermediate',
    familiarWithCAD: false,
    familiarWithJSCAD: false,
  },
  
  useCases: {
    primary: 'functional parts',
    categories: ['functional', 'organizers'],
  },
  
  commonComponents: [],
  
  designPreferences: {
    preferRoundedEdges: false,   // Performance: cuboid is faster
    preferMinimalist: true,
    prioritizePrintSpeed: false,
    prioritizeStrength: true,
  },
  
  aiPreferences: {
    verbosity: 'detailed',
    showDFMExplanations: true,
    suggestImprovements: true,
    autoOptimizeForPrinter: true,
  },
};

/**
 * Load user preferences from storage
 */
export async function loadUserPreferences(): Promise<UserPreferences> {
  try {
    const stored = await get(PREFERENCES_KEY);
    if (stored) {
      // Merge with defaults to handle any new fields
      return { ...DEFAULT_PREFERENCES, ...stored };
    }
  } catch (error) {
    console.warn('Failed to load user preferences:', error);
  }
  return { ...DEFAULT_PREFERENCES };
}

/**
 * Save user preferences to storage
 */
export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  try {
    await set(PREFERENCES_KEY, prefs);
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    throw error;
  }
}

/**
 * Update specific preference fields
 */
export async function updateUserPreferences(
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  const current = await loadUserPreferences();
  const updated = deepMerge(current, updates) as UserPreferences;
  await saveUserPreferences(updated);
  return updated;
}

/**
 * Clear all user preferences (reset to defaults)
 */
export async function clearUserPreferences(): Promise<void> {
  try {
    await del(PREFERENCES_KEY);
  } catch (error) {
    console.error('Failed to clear user preferences:', error);
  }
}

/**
 * Check if onboarding is needed
 */
export async function needsOnboarding(): Promise<boolean> {
  const prefs = await loadUserPreferences();
  return !prefs.onboardingComplete;
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(
  collectedPrefs: Partial<UserPreferences>
): Promise<UserPreferences> {
  return updateUserPreferences({
    ...collectedPrefs,
    onboardingComplete: true,
    onboardingDate: Date.now(),
  });
}

/**
 * Deep merge helper for nested objects
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target } as T;
  
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];
    
    if (sourceValue !== undefined) {
      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }
  
  return result;
}

/**
 * Generate a context string for the AI based on user preferences
 */
export function generateUserContext(prefs: Partial<UserPreferences>): string {
  const lines: string[] = [];
  
  // Printer info (defensive - printer might be undefined)
  if (prefs.printer) {
    lines.push(`## User's Printer Setup`);
    lines.push(`- Printer: ${prefs.printer.customName || prefs.printer.profileId || 'Generic'}`);
    lines.push(`- Materials: ${prefs.printer.materials?.join(', ') || 'PLA'}`);
    if (prefs.printer.additionalColors && prefs.printer.additionalColors.length > 0) {
      lines.push(`- Available colors: ${[prefs.printer.primaryColor, ...prefs.printer.additionalColors].filter(Boolean).join(', ')}`);
    }
  }
  
  // Experience
  if (prefs.experience) {
    lines.push(`\n## User Experience Level`);
    lines.push(`- Level: ${prefs.experience.level}`);
    if (prefs.experience.level === 'beginner') {
      lines.push(`- Note: User is new to 3D printing. Be extra careful with DFM and explain decisions.`);
    }
  }
  
  // Use cases
  if (prefs.useCases) {
    lines.push(`\n## Primary Use Cases`);
    lines.push(`- Main focus: ${prefs.useCases.primary}`);
    lines.push(`- Categories: ${prefs.useCases.categories?.join(', ') || 'functional'}`);
  }
  
  // Common components
  if (prefs.commonComponents && prefs.commonComponents.length > 0) {
    lines.push(`\n## Components User Often Designs For`);
    lines.push(prefs.commonComponents.map(c => `- ${c}`).join('\n'));
  }
  
  // Design preferences
  if (prefs.designPreferences) {
    lines.push(`\n## Design Preferences`);
    if (prefs.designPreferences.preferMinimalist) {
      lines.push(`- Prefers minimalist designs`);
    }
    if (prefs.designPreferences.prioritizeStrength) {
      lines.push(`- Prioritizes strength over print speed`);
    }
    if (prefs.designPreferences.prioritizePrintSpeed) {
      lines.push(`- Prioritizes fast printing`);
    }
  }
  
  // AI preferences
  if (prefs.aiPreferences) {
    if (prefs.aiPreferences.verbosity === 'concise') {
      lines.push(`\n## Communication Style`);
      lines.push(`- User prefers concise responses without lengthy explanations`);
    } else if (prefs.aiPreferences.verbosity === 'educational') {
      lines.push(`\n## Communication Style`);
      lines.push(`- User wants to learn - explain DFM decisions and teach best practices`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Onboarding questions for the AI to ask
 */
export const ONBOARDING_QUESTIONS = [
  {
    id: 'printer',
    question: "What 3D printer do you have? (e.g., 'Anycubic Kobra S1', 'Prusa MK4', 'Ender 3')",
    followUp: "Do you have a multi-color system like AMS or ACE Pro?",
  },
  {
    id: 'experience',
    question: "How experienced are you with 3D printing?",
    options: ['Just getting started', 'I can slice and print', 'I design my own models'],
  },
  {
    id: 'useCase',
    question: "What do you mainly want to create?",
    options: [
      'Functional parts (brackets, mounts, cases)',
      'Storage & organizers',
      'Decorative items',
      'Electronics enclosures',
      'A bit of everything',
    ],
  },
  {
    id: 'components',
    question: "Any specific components you often make cases for? (e.g., Raspberry Pi, Arduino, sensors)",
  },
  {
    id: 'materials',
    question: "What filament do you usually print with?",
    options: ['PLA', 'PETG', 'ABS', 'TPU', 'Multiple types'],
  },
];

