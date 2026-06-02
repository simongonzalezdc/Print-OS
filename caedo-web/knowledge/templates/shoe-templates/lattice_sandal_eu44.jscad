/**
 * EU Size 44 Lattice Sandal Template
 * Uses TPU 90A with Gyroid cushioning
 */

import { primitives, transforms, color } from '@jscad/modeling'
const { cube, union, subtract } = primitives
const { translate } = transforms

export const main = (params) => {
  const { size = 44, latticeType = 'GYROID' } = params
  
  // Dimensions for EU 44
  const length = 283
  const width = 105
  const soleHeight = 15
  
  // 1. Create Outer Shell (Solid walls)
  const shell = subtract(
    cube({ size: [length, width, soleHeight], center: [0,0, soleHeight/2] }),
    cube({ size: [length - 4, width - 4, soleHeight - 4], center: [0,0, soleHeight/2] })
  )
  
  // 2. Create Lattice Midsole (Simplified representation for template)
  const midsole = cube({ 
    size: [length - 4, width - 4, soleHeight - 2], 
    center: [0, 0, soleHeight/2] 
  })
  
  // 3. Add Top Cover
  const topCover = cube({ 
    size: [length, width, 2], 
    center: [0, 0, soleHeight - 1] 
  })
  
  // 4. Return combined model
  return union(
    color.apply([0.2, 0.2, 0.2], shell),
    color.apply([0.4, 0.4, 0.4], midsole),
    color.apply([0.3, 0.3, 0.3], topCover)
  )
}
