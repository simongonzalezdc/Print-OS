/**
 * EU Size 44 Athletic Slide (AI Generated)
 * Targeted for Anycubic Kobra 3 Max
 */

import { primitives } from '@jscad/modeling'
const { cube, union } = primitives

export const main = () => {
  // AI-generated design logic for a robust athletic slide
  const sole = cube({ size: [283, 105, 15], center: [0,0, 7.5] })
  const strap = cube({ size: [40, 110, 5], center: [20, 0, 25] })
  
  return union(sole, strap)
}
