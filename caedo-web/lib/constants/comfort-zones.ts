/**
 * Comfort Zones and Variable Density Mappings
 * 
 * Defines how lattice density and stiffness should vary across the foot
 * to optimize for ergonomics and comfort.
 */

export interface ComfortZone {
    id: string;
    name: string;
    relativeX: [number, number]; // [min, max] as 0-1 of foot length
    relativeY: [number, number]; // [min, max] as 0-1 of foot width
    targetDensity: number;
    stiffnessLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Standard Comfort Zones for Footwear
 * Relative to foot length (X) and width (Y)
 */
export const COMFORT_ZONES: ComfortZone[] = [
    {
        id: 'heel_strike',
        name: 'Heel Strike Zone',
        relativeX: [0.0, 0.25],
        relativeY: [0.2, 0.8],
        targetDensity: 0.35,
        stiffnessLevel: 'HIGH',
    },
    {
        id: 'arch_support',
        name: 'Arch Support Zone',
        relativeX: [0.25, 0.55],
        relativeY: [0.1, 0.4], // Medial side
        targetDensity: 0.30,
        stiffnessLevel: 'MEDIUM',
    },
    {
        id: 'metatarsal',
        name: 'Metatarsal (Ball)',
        relativeX: [0.6, 0.8],
        relativeY: [0.1, 0.9],
        targetDensity: 0.25,
        stiffnessLevel: 'MEDIUM',
    },
    {
        id: 'toe_box',
        name: 'Toe Box Flex',
        relativeX: [0.8, 1.0],
        relativeY: [0.1, 0.9],
        targetDensity: 0.15,
        stiffnessLevel: 'LOW',
    }
];

/**
 * Get recommended density for a point on the foot (0-1 range)
 */
export const getDensityAtPoint = (x: number, y: number): number => {
    const zone = COMFORT_ZONES.find(z =>
        x >= z.relativeX[0] && x <= z.relativeX[1] &&
        y >= z.relativeY[0] && y <= z.relativeY[1]
    );

    return zone ? zone.targetDensity : 0.20; // Default medium density
};
