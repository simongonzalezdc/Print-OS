/**
 * Parts Bin (Parametric)
 * Small parts storage bin for workshops and hobbyists.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { width: 50, depth: 80, height: 30, wall: 1.6 }) => {
  const { width, depth, height, wall } = params;

  const shell = subtract(
    cuboid({ size: [width, depth, height], center: [0, 0, height/2] }),
    translate([0, 0, wall], cuboid({ size: [width - wall*2, depth - wall*2, height], center: [0, 0, height/2] }))
  );

  // Sloped front for easy access
  const cutter = translate([0, -depth/2, height], rotate([Math.PI/4, 0, 0], cuboid({ size: [width + 2, depth, height] })));

  return subtract(shell, cutter);
};
