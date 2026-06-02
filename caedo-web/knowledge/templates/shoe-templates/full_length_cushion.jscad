/**
 * Full-Length Cushion Layer (Parametric)
 * Continuous comfort layer for footwear assemblies.
 */
import { primitives, transforms, color } from '@jscad/modeling';
const { roundedCuboid } = primitives;

export const main = (params = { size: 43 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 3;

  return color.apply([0.6, 0.6, 0.6], roundedCuboid({ 
    size: [length, width, height], 
    roundRadius: 2,
    center: [0, 0, height/2] 
  }));
};
