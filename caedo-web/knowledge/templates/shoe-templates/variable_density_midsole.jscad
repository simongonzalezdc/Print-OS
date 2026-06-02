/**
 * Variable-Density Midsole (Template)
 * Optimized zones for heel strike and toe-off.
 */
import { primitives, transforms, color } from '@jscad/modeling';
const { roundedCuboid } = primitives;

export const main = (params = { size: 42 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 14;

  return color.apply([0.2, 0.2, 0.2], roundedCuboid({ 
    size: [length, width, height], 
    roundRadius: 6,
    center: [0, 0, height/2] 
  }));
};
/**
 * Implementation Note: Use density maps or multi-part 
 * prints to achieve variable stiffness.
 */
