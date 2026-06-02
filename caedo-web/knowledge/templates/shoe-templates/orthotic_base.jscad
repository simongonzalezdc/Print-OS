/**
 * Custom Orthotic Base V2
 * 
 * Features:
 * - High heel cup
 * - Deep anatomical arch contour
 */

import { primitives, transforms, hulls } from '@jscad/modeling'
const { cylinder, subtract } = primitives
const { translate, scale } = transforms
const { hull } = hulls

export const main = (params = {}) => {
  const { length = 270, width = 95, archHeight = 25, thickness = 5 } = params
  
  // Create base anatomical landing
  const heel = cylinder({ radius: width/2, height: thickness + 15, center: [-(length/2 - width/2), 0, (thickness + 15)/2] })
  const forefoot = cylinder({ radius: width/2, height: thickness, center: [length/2 - width/2, 0, thickness/2] })
  
  let base = hull(heel, forefoot)
  
  // Arch support ramp
  const archRamp = scale([1, 1, archHeight/10], cylinder({ radius: 50, height: 10, center: [0, -20, 5] }))
  base = hull(base, archRamp)
  
  // Heel cup subtraction
  const heelCup = cylinder({ radius: width/2 - 5, height: 30, center: [-(length/2 - width/2), 0, 20] })
  base = subtract(base, heelCup)
  
  return base
}
