/**
 * Solid Upper Shell (Parametric)
 * Protective panel for sneaker uppers.
 */
import { primitives, transforms, color } from '@jscad/modeling';
const { roundedCuboid } = primitives;

export const main = (params = { length: 150, width: 80 }) => {
  const { length, width } = params;
  const thickness = 1.6;

  return color.apply([0.2, 0.2, 0.2], roundedCuboid({ size: [length, width, thickness], roundRadius: 5, center: [0, 0, thickness/2] }));
};
