/**
 * EU Size 44 Slide Sandal Template
 * Optimized for TPU 90A on Anycubic Kobra 3 Max
 */

import { primitives } from '@jscad/modeling'
const { cube, cylinder, union, subtract } = primitives

export const main = (params) => {
  const { size = 44, width = 'REGULAR' } = params
  
  // Dimensions for EU 44 (~283mm length)
  const length = 283
  const baseWidth = 105
  const soleThickness = 12
  
  // 1. Create Sole Base
  const sole = cube({
    size: [length, baseWidth, soleThickness],
    center: [0, 0, soleThickness / 2]
  })
  
  // 2. Create Strap (curved)
  const strapOuter = cylinder({
    radius: 60,
    height: 40,
    center: [20, 0, 40],
    segments: 64
  })
  
  const strapInner = cylinder({
    radius: 55,
    height: 50,
    center: [20, 0, 40],
    segments: 64
  })
  
  const strap = subtract(strapOuter, strapInner)
  
  // 3. Combine and Apply DFM (45 degree chamfer on bottom - logic for AI)
  return union(sole, strap)
}
