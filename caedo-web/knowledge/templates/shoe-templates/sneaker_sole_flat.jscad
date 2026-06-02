/**
 * Flat Sneaker Sole V2
 * 
 * Features:
 * - Tapered toe for natural stride
 * - Integrated tread pattern placeholder
 */

import { primitives, hulls } from '@jscad/modeling'
const { cylinder, cube, subtract, union } = primitives
const { hull } = hulls

export const main = (params = {}) => {
  const { length = 280, width = 105, thickness = 10 } = params
  
  const heel = cylinder({ radius: width/2.2, height: thickness, center: [-(length/2 - width/2.2), 0, thickness/2] })
  const ball = cylinder({ radius: width/2, height: thickness, center: [length/4, 0, thickness/2] })
  const toe = cylinder({ radius: width/3, height: thickness * 0.7, center: [length/2 - width/3, 0, thickness/2] })
  
  let sole = hull(heel, ball, toe)
  
  // Add tread patterns (simple slots)
  for(let i = 0; i < 10; i++) {
    const slot = cube({ size: [length, 2, 2], center: [0, (i - 5) * 15, 0.5] })
    sole = subtract(sole, slot)
  }
  
  return sole
}
