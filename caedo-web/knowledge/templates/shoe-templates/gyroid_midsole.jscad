/**
 * Gyroid Midsole Integration Template
 * 
 * This template acts as a bridge for the lattice generator.
 */

import { generateLattice } from '../../../lib/jscad/lattice-generator'

export const main = (params = {}) => {
  const { length = 270, width = 100, height = 10, density = 0.3 } = params
  
  return generateLattice({
    type: 'GYROID',
    cellSize: 10,
    wallThickness: 1.2,
    bounds: [length, width, height],
    density: density
  })
}
