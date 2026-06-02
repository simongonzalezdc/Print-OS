/**
 * TPMS Midsole (Schwarz-P)
 * Triple Periodic Minimal Surface pattern for smooth stress distribution.
 */
import { primitives, transforms, color } from '@jscad/modeling';
const { roundedCuboid } = primitives;

export const main = (params = { size: 40 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 15;

  return color.apply([0.5, 0.5, 0.5], roundedCuboid({ 
    size: [length, width, height], 
    roundRadius: 5,
    center: [0, 0, height/2] 
  }));
};
