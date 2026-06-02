/**
 * Impact Core Insert (Parametric)
 * High-performance core for extreme impact protection.
 */
import { primitives, transforms, color } from '@jscad/modeling';
const { cuboid } = primitives;

export const main = (params = { length: 100, width: 40, height: 15 }) => {
  const { length, width, height } = params;
  
  return color.apply([0.1, 0.1, 0.1], cuboid({ 
    size: [length, width, height], 
    center: [0, 0, height/2] 
  }));
};
