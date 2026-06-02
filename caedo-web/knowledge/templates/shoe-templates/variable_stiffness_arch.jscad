/**
 * Variable Stiffness Arch Template
 * 
 * Uses the lattice generator with higher density in the medial arch.
 */

import { generateLattice } from '../../../lib/jscad/lattice-generator'

export const main = (params = {}) => {
  const { length = 100, width = 40, height = 25 } = params
  
  return generateLattice({
    type: 'GYROID',
    cellSize: 8,
    wallThickness: 1.5,
    bounds: [length, width, height],
    density: 0.5 // High density for support
  })
}
