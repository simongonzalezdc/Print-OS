/**
 * Headphone Hook (Desk Mount)
 * Clamps to the side of a desk to hold headphones.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { deskThickness: 25, hookWidth: 40 }) => {
  const { deskThickness, hookWidth } = params;
  const wall = 5;
  const depth = 50;

  const clamp = subtract(
    cuboid({ size: [depth + wall, hookWidth, deskThickness + wall*2], center: [depth/2, 0, (deskThickness + wall*2)/2] }),
    translate([wall, -hookWidth/2 - 1, wall], cuboid({ size: [depth + 2, hookWidth + 2, deskThickness] }))
  );

  const hook = translate([-(hookWidth/2), 0, 0], rotate([0, Math.PI/2, 0], cuboid({ size: [30, hookWidth, wall], center: [15, 0, wall/2] })));

  return union(clamp, hook);
};
