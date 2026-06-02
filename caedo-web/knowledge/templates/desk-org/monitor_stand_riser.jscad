/**
 * Monitor Stand Riser (Simple)
 * Raise your monitor for better ergonomics.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { width: 200, depth: 150, height: 50, wall: 10 }) => {
  const { width, depth, height, wall } = params;

  const top = translate([0, 0, height - wall], cuboid({ size: [width, depth, wall], center: [0, 0, wall/2] }));
  const legL = translate([-width/2 + wall/2, 0, 0], cuboid({ size: [wall, depth, height], center: [0, 0, height/2] }));
  const legR = translate([width/2 - wall/2, 0, 0], cuboid({ size: [wall, depth, height], center: [0, 0, height/2] }));

  return union(top, legL, legR);
};
