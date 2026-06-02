/**
 * J-Hook (Wall Mount)
 * Simple heavy-duty hook for wall mounting.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid, cylinder } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 40, thickness: 8, width: 15 }) => {
  const { size, thickness, width } = params;

  const backplate = cuboid({ size: [thickness, width, size], center: [thickness/2, 0, size/2] });
  const bottom = cuboid({ size: [size, width, thickness], center: [size/2, 0, thickness/2] });
  const tip = translate([size - thickness, 0, 0], cuboid({ size: [thickness, width, thickness * 2], center: [thickness/2, 0, thickness] }));

  // Screw hole
  const screw = translate([-1, 0, size * 0.75], rotate([0, Math.PI/2, 0], cylinder({ radius: 2, height: thickness + 2 })));

  return subtract(union(backplate, bottom, tip), screw);
};
