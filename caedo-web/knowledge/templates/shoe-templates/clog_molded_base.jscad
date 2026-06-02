/**
 * Daily Clog Molded Base V2
 * 
 * Features:
 * - One-piece construction
 * - Ventilation holes
 * - Ergonomic footbed
 */

import { primitives, transforms, hulls } from '@jscad/modeling'
const { cylinder, cube, union, subtract } = primitives
const { translate, rotateX } = transforms
const { hull } = hulls

export const main = (params = {}) => {
  const { length = 280, width = 110, height = 80 } = params
  
  // 1. Create outer body
  const heel = cylinder({ radius: width/2, height: height, center: [-(length/2 - width/2), 0, height/2] })
  const toe = cylinder({ radius: width/2, height: height * 0.6, center: [length/2 - width/2, 0, height * 0.3] })
  let body = hull(heel, toe)
  
  // 2. Hollow out for foot
  const heelInner = cylinder({ radius: width/2 - 4, height: height, center: [-(length/2 - width/2), 0, height/2 + 10] })
  const toeInner = cylinder({ radius: width/2 - 4, height: height * 0.6, center: [length/2 - width/2, 0, height * 0.3 + 4] })
  const hollow = hull(heelInner, toeInner)
  
  body = subtract(body, hollow)
  
  // 3. Add ventilation holes
  for(let i = 0; i < 3; i++) {
    for(let j = 0; j < 3; j++) {
      const hole = cylinder({ radius: 3, height: 20, center: [length/2 - 40 - i*15, (j-1)*15, height*0.5] })
      body = subtract(body, hole)
    }
  }
  
  return body
}
