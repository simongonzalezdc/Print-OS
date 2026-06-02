/**
 * Padded Tongue (Parametric)
 * Ergonomic shaped component for foot comfort.
 */
import { primitives, transforms, color } from '@jscad/modeling';
const { roundedCuboid } = primitives;
const { scale } = transforms;

export const main = (params = { length: 100, width: 60 }) => {
  const { length, width } = params;
  
  return color.apply([0.3, 0.3, 0.3], scale([1, 1, 0.5], roundedCuboid({ size: [length, width, 10], roundRadius: 10, center: [0, 0, 5] })));
};
