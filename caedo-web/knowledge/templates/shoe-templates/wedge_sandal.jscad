/**
 * Wedge Sandal (Parametric)
 * Graduated heel lift for style and comfort.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cuboid } = primitives;
const { translate, rotate, scale } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 37, heelHeight: 50 }) => {
  const { size, heelHeight } = params;
  
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const toeHeight = 10;

  // Wedge shape (using a skewed/scaled cuboid or hull would be better, but let's use a simpler approach)
  const wedge = union(
    roundedCuboid({ size: [length, width, toeHeight], roundRadius: 5, center: [0, 0, toeHeight/2] }),
    translate([length/4, 0, toeHeight], roundedCuboid({ size: [length/2, width, heelHeight - toeHeight], roundRadius: 5, center: [0, 0, (heelHeight - toeHeight)/2] }))
  );

  const strap = translate([-length * 0.1, 0, toeHeight + 10], cuboid({ size: [40, width + 5, 5], center: [0, 0, 2.5] }));

  return union(
    color.apply([0.15, 0.15, 0.15], wedge),
    color.apply([0.5, 0.4, 0.3], strap)
  );
};
