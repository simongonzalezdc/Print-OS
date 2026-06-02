/**
 * Minimal Travel Slide (Parametric)
 * Ultra-lightweight and packable.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cuboid } = primitives;
const { translate } = transforms;
const { union } = booleans;

export const main = (params = { size: 39 }) => {
  const { size } = params;
  
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 8;

  const sole = roundedCuboid({ 
    size: [length, width, height], 
    roundRadius: 4,
    center: [0, 0, height/2] 
  });

  const strap = translate([length * 0.1, 0, height], cuboid({ size: [length * 0.25, width, 2], center: [0, 0, 1] }));

  return color.apply([0.25, 0.25, 0.25], union(sole, strap));
};
