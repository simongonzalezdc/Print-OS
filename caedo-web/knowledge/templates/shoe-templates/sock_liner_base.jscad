/**
 * Sock Liner Base (Parametric)
 * Platform for removable insoles.
 */
import { primitives, transforms, color } from '@jscad/modeling';
const { roundedCuboid } = primitives;

export const main = (params = { size: 42 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  
  return color.apply([0.8, 0.8, 0.8], roundedCuboid({ size: [length, width, 2], roundRadius: 3, center: [0, 0, 1] }));
};
