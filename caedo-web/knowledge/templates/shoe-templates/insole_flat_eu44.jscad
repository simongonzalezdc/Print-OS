/**
 * EU Size 44 Flat Insole Template
 * Targeted for TPU 90A
 */

import { primitives } from '@jscad/modeling'
const { cube } = primitives

export const main = (params) => {
  const { size = 44 } = params
  
  // EU 44: 283mm length, ~100mm width
  const length = 283
  const width = 100
  const thickness = 5 // Standard insole
  
  return cube({
    size: [length, width, thickness],
    center: [0, 0, thickness / 2]
  })
}
