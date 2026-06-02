/**
 * Shelf Bracket (L-Bracket)
 * Reinforced bracket for small shelves.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 100, width: 20, thickness: 5 }) => {
  const { size, width, thickness } = params;

  const vertical = cuboid({ size: [thickness, width, size], center: [thickness/2, 0, size/2] });
  const horizontal = cuboid({ size: [size, width, thickness], center: [size/2, 0, thickness/2] });
  
  // Reinforcement gusset (simplified as a cube for now)
  const gusset = translate([0, -width/4, 0], rotate([0, -Math.PI/4, 0], cuboid({ size: [size * 1.2, width/2, thickness], center: [size * 0.6, 0, 0] })));

  return union(vertical, horizontal, gusset);
};
