/**
 * Wide Slide Strap V2
 * 
 * Features:
 * - Curved anatomical profile
 * - Variable thickness for comfort
 */

import { primitives, transforms } from '@jscad/modeling'
const { cylinder, subtract, intersect, cube } = primitives
const { translate, rotateX } = transforms

export const main = (params = {}) => {
  const { width = 110, height = 45, thickness = 4 } = params
  
  // Create an anatomical arch for the foot bridge
  const outer = cylinder({ radius: width / 1.8, height: 40, segments: 64 })
  const inner = cylinder({ radius: (width / 1.8) - thickness, height: 42, segments: 64 })
  
  let strap = subtract(outer, inner)
  
  // Crop to bottom half
  const cropper = cube({ size: [width * 2, width * 2, height], center: [0, 0, height/2 + 5] })
  strap = intersect(strap, cropper)
  
  // Tilt forward slightly for ergonomics
  strap = rotateX(Math.PI / 12, strap)
  strap = translate([20, 0, 0], strap)
  
  return strap
}
