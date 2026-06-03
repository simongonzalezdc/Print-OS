/**
 * Printer Profile System
 * 
 * Stores printer-specific settings that optimize generated JSCAD code
 * for the user's actual hardware.
 */

export interface PrinterProfile {
  id: string;
  name: string;
  manufacturer: string;
  
  // Build volume in mm
  buildVolume: {
    x: number;
    y: number;
    z: number;
  };
  
  // Nozzle settings
  nozzle: {
    diameter: number;        // mm (typically 0.4)
    minLayerHeight: number;  // mm
    maxLayerHeight: number;  // mm
  };
  
  // Multi-color support
  multiColor: {
    enabled: boolean;
    colorCount: number;
    system?: string;  // e.g., "ACE Pro", "AMS", "MMU"
  };
  
  // Bed type affects adhesion strategy
  bedType: 'PEI' | 'glass' | 'buildtak' | 'textured' | 'smooth';
  
  // Printer-specific DFM adjustments
  dfm: {
    minWallThickness: number;      // mm - based on nozzle × 2
    recommendedWall: number;       // mm - based on nozzle × 3
    chamferSize: number;           // mm - elephant foot prevention
    holeOversize: number;          // mm - shrinkage compensation
    minFeatureSize: number;        // mm - smallest printable detail
    maxOverhangAngle: number;      // degrees
    supportThreshold: number;      // degrees - when supports needed
  };
  
  // Slicer preferences
  slicer?: {
    name: string;                  // e.g., "Orca Slicer", "Cura", "PrusaSlicer"
    preferredFormat: '3mf' | 'stl';
  };
}

/**
 * Pre-configured printer profiles
 */
export const PRINTER_PROFILES: Record<string, PrinterProfile> = {
  'anycubic-kobra-s1-ace-pro': {
    id: 'anycubic-kobra-s1-ace-pro',
    name: 'Anycubic Kobra S1 + ACE Pro',
    manufacturer: 'Anycubic',
    
    buildVolume: {
      x: 250,
      y: 250,
      z: 250,
    },
    
    nozzle: {
      diameter: 0.4,
      minLayerHeight: 0.1,
      maxLayerHeight: 0.35,
    },
    
    multiColor: {
      enabled: true,
      colorCount: 4,
      system: 'ACE Pro',
    },
    
    bedType: 'PEI',
    
    dfm: {
      minWallThickness: 0.8,       // 2 perimeters
      recommendedWall: 1.2,        // 3 perimeters
      chamferSize: 0.3,            // PEI has good adhesion
      holeOversize: 0.15,          // Anycubic typically accurate
      minFeatureSize: 0.4,         // Nozzle width
      maxOverhangAngle: 50,        // Kobra handles overhangs well
      supportThreshold: 55,
    },
    
    slicer: {
      name: 'Orca Slicer',
      preferredFormat: '3mf',
    },
  },
  
  'anycubic-kobra-s1': {
    id: 'anycubic-kobra-s1',
    name: 'Anycubic Kobra S1',
    manufacturer: 'Anycubic',
    
    buildVolume: {
      x: 250,
      y: 250,
      z: 250,
    },
    
    nozzle: {
      diameter: 0.4,
      minLayerHeight: 0.1,
      maxLayerHeight: 0.35,
    },
    
    multiColor: {
      enabled: false,
      colorCount: 1,
    },
    
    bedType: 'PEI',
    
    dfm: {
      minWallThickness: 0.8,       // 2 perimeters
      recommendedWall: 1.2,        // 3 perimeters
      chamferSize: 0.3,            // PEI has good adhesion
      holeOversize: 0.15,          // Anycubic typically accurate
      minFeatureSize: 0.4,         // Nozzle width
      maxOverhangAngle: 50,        // Kobra handles overhangs well
      supportThreshold: 55,
    },
    
    slicer: {
      name: 'Cura',
      preferredFormat: 'stl',
    },
  },
  
  'bambu-p1s-ams': {
    id: 'bambu-p1s-ams',
    name: 'Bambu Lab P1S + AMS',
    manufacturer: 'Bambu Lab',
    
    buildVolume: {
      x: 256,
      y: 256,
      z: 256,
    },
    
    nozzle: {
      diameter: 0.4,
      minLayerHeight: 0.08,
      maxLayerHeight: 0.32,
    },
    
    multiColor: {
      enabled: true,
      colorCount: 4,
      system: 'AMS',
    },
    
    bedType: 'textured',
    
    dfm: {
      minWallThickness: 0.8,
      recommendedWall: 1.2,
      chamferSize: 0.3,
      holeOversize: 0.1,          // Very accurate printer
      minFeatureSize: 0.4,
      maxOverhangAngle: 55,       // Excellent cooling
      supportThreshold: 60,
    },
    
    slicer: {
      name: 'Bambu Studio',
      preferredFormat: '3mf',
    },
  },
  
  'prusa-mk4-mmu3': {
    id: 'prusa-mk4-mmu3',
    name: 'Prusa MK4 + MMU3',
    manufacturer: 'Prusa Research',
    
    buildVolume: {
      x: 250,
      y: 210,
      z: 220,
    },
    
    nozzle: {
      diameter: 0.4,
      minLayerHeight: 0.05,
      maxLayerHeight: 0.30,
    },
    
    multiColor: {
      enabled: true,
      colorCount: 5,
      system: 'MMU3',
    },
    
    bedType: 'textured',
    
    dfm: {
      minWallThickness: 0.8,
      recommendedWall: 1.2,
      chamferSize: 0.4,
      holeOversize: 0.1,
      minFeatureSize: 0.4,
      maxOverhangAngle: 50,
      supportThreshold: 55,
    },
    
    slicer: {
      name: 'PrusaSlicer',
      preferredFormat: '3mf',
    },
  },
  
  'ender-3-v3': {
    id: 'ender-3-v3',
    name: 'Creality Ender-3 V3',
    manufacturer: 'Creality',
    
    buildVolume: {
      x: 220,
      y: 220,
      z: 250,
    },
    
    nozzle: {
      diameter: 0.4,
      minLayerHeight: 0.1,
      maxLayerHeight: 0.35,
    },
    
    multiColor: {
      enabled: false,
      colorCount: 1,
    },
    
    bedType: 'PEI',
    
    dfm: {
      minWallThickness: 0.8,
      recommendedWall: 1.6,        // Budget printer = thicker walls
      chamferSize: 0.5,
      holeOversize: 0.2,           // Less accurate
      minFeatureSize: 0.5,
      maxOverhangAngle: 45,
      supportThreshold: 50,
    },
    
    slicer: {
      name: 'Cura',
      preferredFormat: 'stl',
    },
  },
  
  // Generic/default profile for unknown printers
  'generic': {
    id: 'generic',
    name: 'Generic FDM Printer',
    manufacturer: 'Unknown',
    
    buildVolume: {
      x: 200,
      y: 200,
      z: 200,
    },
    
    nozzle: {
      diameter: 0.4,
      minLayerHeight: 0.1,
      maxLayerHeight: 0.3,
    },
    
    multiColor: {
      enabled: false,
      colorCount: 1,
    },
    
    bedType: 'glass',
    
    dfm: {
      minWallThickness: 1.2,       // Conservative
      recommendedWall: 2.0,
      chamferSize: 0.5,
      holeOversize: 0.2,
      minFeatureSize: 0.5,
      maxOverhangAngle: 45,
      supportThreshold: 50,
    },
    
    slicer: {
      name: 'Cura',
      preferredFormat: 'stl',
    },
  },
};

/**
 * Get a printer profile by ID
 */
export function getPrinterProfile(id: string): PrinterProfile {
  const profile = PRINTER_PROFILES[id];
  const fallback = PRINTER_PROFILES['generic'];
  // Both profile and fallback could technically be undefined in the type system,
  // but we know 'generic' always exists, so use non-null assertion
  return profile ?? fallback!;
}

/**
 * List all available printer profiles
 */
export function listPrinterProfiles(): PrinterProfile[] {
  return Object.values(PRINTER_PROFILES);
}

/**
 * Check if a model fits within the printer's build volume
 */
export function fitsInBuildVolume(
  profile: PrinterProfile,
  dimensions: { x: number; y: number; z: number }
): { fits: boolean; suggestions?: string[] } {
  const { buildVolume } = profile;
  const suggestions: string[] = [];
  
  let fits = true;
  
  if (dimensions.x > buildVolume.x) {
    fits = false;
    suggestions.push(`Width ${dimensions.x}mm exceeds build volume (${buildVolume.x}mm). Scale down or rotate.`);
  }
  if (dimensions.y > buildVolume.y) {
    fits = false;
    suggestions.push(`Depth ${dimensions.y}mm exceeds build volume (${buildVolume.y}mm). Scale down or rotate.`);
  }
  if (dimensions.z > buildVolume.z) {
    fits = false;
    suggestions.push(`Height ${dimensions.z}mm exceeds build volume (${buildVolume.z}mm). Consider splitting the model.`);
  }
  
  return { fits, suggestions: fits ? undefined : suggestions };
}

/**
 * Get color suggestions based on printer's multi-color capability
 */
export function getColorSuggestions(profile: PrinterProfile): string[] {
  if (!profile.multiColor.enabled) {
    return ['Single color print - no color options needed'];
  }
  
  const colorCount = profile.multiColor.colorCount;
  const suggestions = [
    `Your ${profile.multiColor.system || 'multi-color system'} supports ${colorCount} colors`,
    'Consider using different colors for:',
    '  - Functional vs decorative parts',
    '  - Labels and text',
    '  - Moving vs stationary parts',
    '  - Base vs top/lid',
  ];
  
  if (colorCount >= 4) {
    suggestions.push('  - Color-coded organization (e.g., compartments)');
  }
  
  return suggestions;
}

