/**
 * Orthotic Top Cover V2
 */

import { primitives } from '@jscad/modeling'
const { cube } = primitives

export const main = (params = {}) => {
  const { length = 270, width = 95 } = params
  
  return cube({ size: [length, width, 2], center: [0, 0, 1] })
}
