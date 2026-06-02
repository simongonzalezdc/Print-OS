/**
 * Athletic Recovery Slide (Parametric)
 * Features a cushioned footbed and arch support.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { cuboid, cylinder, roundedCuboid } = primitives;
const { translate, rotate, scale } = transforms;
const { union, subtract, intersect } = booleans;

export const main = (params = { size: 42, archHeight: 24 }) => {
  const { size, archHeight } = params;
  
  // Base dimensions based on size (simplified linear mapping)
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 15;

  const sole = roundedCuboid({ 
    size: [length, width, height], 
    roundRadius: 5,
    center: [0, 0, height/2] 
  });

  // Arch support (ellipsoid-like)
  const arch = translate([length * 0.1, width * 0.2, height], scale([1, 0.5, 1], cylinder({ radius: width * 0.4, height: archHeight })));

  const strap = translate([length * 0.1, 0, height + 10], cuboid({ size: [length * 0.3, width + 10, 5], center: [0, 0, 2.5] }));

  return union(
    color.apply([0.2, 0.2, 0.2], sole),
    color.apply([0.3, 0.3, 0.3], arch),
    color.apply([0.4, 0.4, 0.4], strap)
  );
};
