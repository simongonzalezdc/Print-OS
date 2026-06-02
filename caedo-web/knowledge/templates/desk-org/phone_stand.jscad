/**
 * Universal Phone Stand
 * Simple, robust stand for smartphones and small tablets.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { width: 60, height: 100, angle: 20 }) => {
  const { width, height, angle } = params;
  const thickness = 5;
  const radAngle = (angle * Math.PI) / 180;

  const base = cuboid({ size: [width, 80, thickness], center: [0, 0, thickness/2] });
  const back = translate([0, 0, 0], rotate([radAngle, 0, 0], cuboid({ size: [width, thickness, height], center: [0, 0, height/2] })));
  const lip = translate([0, -35, thickness], cuboid({ size: [width, thickness, 15], center: [0, 0, 7.5] }));

  return union(base, back, lip);
};
