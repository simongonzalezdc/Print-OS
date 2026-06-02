/**
 * Pen Holder (Hexagonal)
 * Stylish hexagonal desk organizer for pens and pencils.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cylinder } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { radius: 30, height: 100, wall: 2 }) => {
  const { radius, height, wall } = params;

  return subtract(
    cylinder({ radius: radius, height: height, segments: 6, center: [0, 0, height/2] }),
    translate([0, 0, wall], cylinder({ radius: radius - wall, height: height, segments: 6, center: [0, 0, height/2] }))
  );
};
