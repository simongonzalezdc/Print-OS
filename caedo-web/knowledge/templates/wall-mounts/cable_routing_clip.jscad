/**
 * Cable Routing Clip (Wall Mount)
 * Guides cables along walls or under desks.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid, cylinder } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { cableDiameter: 8, width: 12 }) => {
  const { cableDiameter, width } = params;
  const wall = 2;
  const r = cableDiameter / 2;

  const body = cuboid({ size: [cableDiameter + wall*2, width, cableDiameter + wall], center: [0, 0, (cableDiameter + wall)/2] });
  const hole = translate([0, 0, r + wall], rotate([Math.PI/2, 0, 0], cylinder({ radius: r, height: width + 2 })));
  
  // Screw tab
  const tab = translate([r + wall, 0, 0], cuboid({ size: [15, width, wall], center: [7.5, 0, wall/2] }));
  const screwHole = translate([r + wall + 7.5, 0, -1], cylinder({ radius: 2, height: wall + 2 }));

  return subtract(union(body, tab), hole, screwHole);
};
