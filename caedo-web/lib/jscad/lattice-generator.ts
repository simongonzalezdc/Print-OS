/**
 * Lattice Structure Generator for CAEDO V2
 * 
 * Generates functional TPMS (Triply Periodic Minimal Surface) lattices:
 * - Gyroid (Ideal for multi-directional cushioning)
 * - Honeycomb (Ideal for vertical compression)
 * - Diamond (Ideal for structural support)
 * 
 * Uses Marching Cubes for isosurface extraction.
 */

import { geometries } from '@jscad/modeling'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { marchingCubes } = require('marching-cubes-fast')

export type LatticeType = 'GYROID' | 'HONEYCOMB' | 'DIAMOND';

export interface LatticeParams {
    type: LatticeType;
    cellSize: number;
    bounds: [number, number, number]; // [length, width, height]
    density: number; // 0.0 to 1.0, mapped to SDF threshold
}

/**
 * TPMS Signed Distance Functions
 */
const TPMS_FUNCTIONS: Record<LatticeType, (x: number, y: number, z: number) => number> = {
    GYROID: (x, y, z) => Math.sin(x) * Math.cos(y) + Math.sin(y) * Math.cos(z) + Math.sin(z) * Math.cos(x),
    HONEYCOMB: (x, y, _z) => Math.sin(x) + Math.sin(y), // Simplified 2D extrusion
    DIAMOND: (x, y, z) => Math.sin(x) * Math.sin(y) * Math.sin(z) + Math.sin(x) * Math.cos(y) * Math.cos(z) + Math.cos(x) * Math.sin(y) * Math.cos(z) + Math.cos(x) * Math.cos(y) * Math.sin(z),
};

/**
 * Generates a functional lattice structure using Marching Cubes.
 */
export const generateLattice = (params: LatticeParams) => {
    const { type, cellSize, bounds, density } = params;

    // Scale factor to map cellSize to periodic function units (2*PI)
    const scale = (2 * Math.PI) / cellSize;

    // Map density to SDF threshold
    // Gyroid: threshold ~0 is 50% density. Typical range is -1.0 to 1.0.
    const threshold = (density - 0.5) * 2.5;

    const potentialFunc = (p: [number, number, number]) => {
        const [x, y, z] = p;
        const val = TPMS_FUNCTIONS[type](x * scale, y * scale, z * scale);
        return val - threshold;
    };

    // Define world bounds for marching cubes
    const worldBounds = [
        [-bounds[0] / 2, bounds[0] / 2],
        [-bounds[1] / 2, bounds[1] / 2],
        [-bounds[2] / 2, bounds[2] / 2]
    ];

    // Extraction resolution (power of 2)
    // Higher resolution = better detail but slower. Size 32 or 64 is good for footwear.
    const res = 32;

    const { faces, vertices } = marchingCubes(res, potentialFunc, worldBounds);

    // Convert to JSCAD poly3 geometry
    const polygons = faces.map((indices: number[]) => {
        const points = indices.map(idx => vertices[idx]);
        return geometries.poly3.create(points);
    });

    return geometries.geom3.create(polygons);
}
