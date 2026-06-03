/**
 * 3D Printing Material Properties
 * 
 * Properties and settings for common FDM filaments.
 * Used for DFM recommendations and shrinkage compensation.
 */

// =============================================================================
// MATERIAL DEFINITIONS
// =============================================================================

export interface MaterialProperties {
  name: string;
  /** Bed temperature in °C */
  bedTemp: number;
  /** Nozzle temperature in °C */
  nozzleTemp: number;
  /** Maximum volumetric flow rate in mm³/s */
  maxVolumetricFlow: number;
  /** Linear shrinkage in percent */
  shrinkage: number;
  /** Whether enclosure is recommended */
  enclosureRequired: boolean;
  /** Whether material is flexible */
  flexible: boolean;
  /** Heat resistance (glass transition temp) in °C */
  heatResistance: number;
  /** Relative strength (1-10 scale) */
  strength: number;
  /** Print difficulty (1-5 scale, 1=easy) */
  difficulty: number;
  /** Common use cases */
  useCases: string[];
}

export const MATERIALS: Record<string, MaterialProperties> = {
  PLA: {
    name: 'PLA (Polylactic Acid)',
    bedTemp: 55,
    nozzleTemp: 220,
    maxVolumetricFlow: 24,
    shrinkage: 0.2,
    enclosureRequired: false,
    flexible: false,
    heatResistance: 60,
    strength: 5,
    difficulty: 1,
    useCases: [
      'Prototyping',
      'Display models',
      'Low-stress functional parts',
      'Cosplay props',
    ],
  },

  PLA_PLUS: {
    name: 'PLA+ (Enhanced PLA)',
    bedTemp: 60,
    nozzleTemp: 225,
    maxVolumetricFlow: 22,
    shrinkage: 0.3,
    enclosureRequired: false,
    flexible: false,
    heatResistance: 65,
    strength: 6,
    difficulty: 1,
    useCases: [
      'Functional parts',
      'Mechanical components',
      'Higher stress applications',
    ],
  },

  PETG: {
    name: 'PETG (Glycol-modified PET)',
    bedTemp: 80,
    nozzleTemp: 250,
    maxVolumetricFlow: 18,
    shrinkage: 0.4,
    enclosureRequired: false,
    flexible: false,
    heatResistance: 80,
    strength: 7,
    difficulty: 2,
    useCases: [
      'Functional parts',
      'Water-resistant applications',
      'Food-safe containers',
      'Outdoor use',
    ],
  },

  ABS: {
    name: 'ABS (Acrylonitrile Butadiene Styrene)',
    bedTemp: 100,
    nozzleTemp: 260,
    maxVolumetricFlow: 16,
    shrinkage: 0.8,
    enclosureRequired: true,
    flexible: false,
    heatResistance: 100,
    strength: 7,
    difficulty: 4,
    useCases: [
      'High-temp applications',
      'Automotive parts',
      'Impact-resistant parts',
      'Post-processing (acetone smoothing)',
    ],
  },

  ASA: {
    name: 'ASA (Acrylonitrile Styrene Acrylate)',
    bedTemp: 100,
    nozzleTemp: 260,
    maxVolumetricFlow: 16,
    shrinkage: 0.7,
    enclosureRequired: true,
    flexible: false,
    heatResistance: 100,
    strength: 7,
    difficulty: 4,
    useCases: [
      'Outdoor applications',
      'UV-resistant parts',
      'Automotive exterior',
    ],
  },

  TPU_95A: {
    name: 'TPU 95A (Flexible)',
    bedTemp: 50,
    nozzleTemp: 230,
    maxVolumetricFlow: 8,
    shrinkage: 0.2,
    enclosureRequired: false,
    flexible: true,
    heatResistance: 80,
    strength: 8, // Impact resistance
    difficulty: 3,
    useCases: [
      'Phone cases',
      'Gaskets and seals',
      'Vibration dampening',
      'Wearables',
    ],
  },

  TPU_90A: {
    name: 'TPU 90A (Soft Flexible)',
    bedTemp: 40,
    nozzleTemp: 225,
    maxVolumetricFlow: 6,
    shrinkage: 0.2,
    enclosureRequired: false,
    flexible: true,
    heatResistance: 80,
    strength: 7,
    difficulty: 4,
    useCases: [
      'Shoe soles and midsoles',
      'Custom insoles and orthotics',
      'Sandals and slides',
      'Soft-touch wearables',
    ],
  },

  NYLON_PA12: {
    name: 'Nylon PA12',
    bedTemp: 80,
    nozzleTemp: 270,
    maxVolumetricFlow: 14,
    shrinkage: 1.5,
    enclosureRequired: true,
    flexible: false,
    heatResistance: 110,
    strength: 9,
    difficulty: 5,
    useCases: [
      'Gears and bearings',
      'High-strength parts',
      'Living hinges',
      'Wear-resistant components',
    ],
  },

  PC: {
    name: 'Polycarbonate',
    bedTemp: 110,
    nozzleTemp: 290,
    maxVolumetricFlow: 12,
    shrinkage: 0.6,
    enclosureRequired: true,
    flexible: false,
    heatResistance: 130,
    strength: 9,
    difficulty: 5,
    useCases: [
      'High-temp applications',
      'Transparent parts',
      'Impact-resistant enclosures',
    ],
  },

  CF_PETG: {
    name: 'Carbon Fiber PETG',
    bedTemp: 80,
    nozzleTemp: 260,
    maxVolumetricFlow: 16,
    shrinkage: 0.3,
    enclosureRequired: false,
    flexible: false,
    heatResistance: 85,
    strength: 8,
    difficulty: 3,
    useCases: [
      'Stiff structural parts',
      'Drone frames',
      'Camera mounts',
    ],
  },

  CF_NYLON: {
    name: 'Carbon Fiber Nylon',
    bedTemp: 80,
    nozzleTemp: 280,
    maxVolumetricFlow: 12,
    shrinkage: 1.0,
    enclosureRequired: true,
    flexible: false,
    heatResistance: 120,
    strength: 10,
    difficulty: 5,
    useCases: [
      'High-performance parts',
      'Replacement for metal',
      'Jigs and fixtures',
    ],
  },
} as const;

// =============================================================================
// COMMON FILAMENT PROFILES (Orca Slicer Compatible)
// =============================================================================

export const COMMON_FILAMENTS = {
  'Generic PLA': {
    baseMaterial: 'PLA',
    bedTemp: 55,
    nozzleTemp: 210,
    flowRatio: 1.0,
    maxSpeed: 200,
  },
  'Generic PLA+': {
    baseMaterial: 'PLA',
    bedTemp: 60,
    nozzleTemp: 220,
    flowRatio: 0.98,
    maxSpeed: 250,
  },
  'Generic PETG': {
    baseMaterial: 'PETG',
    bedTemp: 80,
    nozzleTemp: 245,
    flowRatio: 0.95,
    maxSpeed: 150,
  },
  'Generic ABS': {
    baseMaterial: 'ABS',
    bedTemp: 100,
    nozzleTemp: 250,
    flowRatio: 0.95,
    maxSpeed: 150,
  },
  'Generic TPU 95A': {
    baseMaterial: 'TPU_95A',
    bedTemp: 50,
    nozzleTemp: 225,
    flowRatio: 1.0,
    maxSpeed: 50,
  },
  'Generic TPU 90A': {
    baseMaterial: 'TPU_90A',
    bedTemp: 40,
    nozzleTemp: 225,
    flowRatio: 1.0,
    maxSpeed: 40,
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get shrinkage compensation factor for a material
 */
export function getShrinkageCompensation(materialKey: keyof typeof MATERIALS): number {
  const material = MATERIALS[materialKey];
  if (!material) {
    throw new Error(`Material not found: ${materialKey}`);
  }
  return 1 + (material.shrinkage / 100);
}

/**
 * Recommend material based on requirements
 */
export function recommendMaterial(requirements: {
  outdoor?: boolean;
  flexible?: boolean;
  highTemp?: boolean;
  highStrength?: boolean;
  easyToPrint?: boolean;
}): string[] {
  const recommendations: string[] = [];
  
  for (const [key, material] of Object.entries(MATERIALS)) {
    let score = 0;
    
    if (requirements.outdoor && (key === 'ASA' || key === 'PETG')) score += 2;
    if (requirements.flexible && material.flexible) score += 3;
    if (requirements.highTemp && material.heatResistance >= 100) score += 2;
    if (requirements.highStrength && material.strength >= 8) score += 2;
    if (requirements.easyToPrint && material.difficulty <= 2) score += 2;
    
    if (score > 0) {
      recommendations.push(key);
    }
  }
  
  // Default to PLA if no specific requirements
  if (recommendations.length === 0) {
    recommendations.push('PLA');
  }
  
  return recommendations;
}

/**
 * Check if material needs special considerations
 */
export function getMaterialWarnings(materialKey: keyof typeof MATERIALS): string[] {
  const material = MATERIALS[materialKey];
  if (!material) {
    throw new Error(`Material not found: ${materialKey}`);
  }
  const warnings: string[] = [];
  
  if (material.enclosureRequired) {
    warnings.push('Enclosure required - material may warp without controlled environment');
  }
  
  if (material.shrinkage >= 0.5) {
    warnings.push(`High shrinkage (${material.shrinkage}%) - compensate dimensions`);
  }
  
  if (material.difficulty >= 4) {
    warnings.push('Advanced material - requires experience and tuned settings');
  }
  
  if (material.flexible) {
    warnings.push('Flexible material - use direct drive extruder, reduce print speed');
  }
  
  return warnings;
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type MaterialKey = keyof typeof MATERIALS;
export type CommonFilament = keyof typeof COMMON_FILAMENTS;

