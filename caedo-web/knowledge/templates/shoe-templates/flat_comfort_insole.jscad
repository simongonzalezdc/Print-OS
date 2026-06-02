/**
 * Flat Comfort Insole (Parametric)
 * Simple drop-in replacement for all-day comfort.
 */
import { primitives, transforms, color } from '@jscad/modeling';
const { roundedCuboid } = primitives;
const { translate } = transforms;

export const main = (params = { size: 42 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 4;

  return color.apply([0.3, 0.5, 0.7], roundedCuboid({ 
    size: [length, width, height], 
    roundRadius: 2,
    center: [0, 0, height/2] 
  }));
};
