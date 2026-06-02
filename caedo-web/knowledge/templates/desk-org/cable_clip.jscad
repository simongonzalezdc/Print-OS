/**
 * Cable Clip (Parametric)
 * Securely holds cables to a desk surface.
 */
import { primitives, transforms, booleans } from '@jscad/modeling';
const { cuboid, cylinder } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { cableDiameter: 6, wallThickness: 2, depth: 15 }) => {
  const { cableDiameter, wallThickness, depth } = params;
  const radius = cableDiameter / 2;
  const innerWidth = cableDiameter;
  const outerWidth = innerWidth + wallThickness * 2;
  const height = cableDiameter + wallThickness * 2;

  const body = cuboid({ size: [outerWidth, height, depth], center: [0, height/2 - wallThickness, 0] });
  const cablePath = cylinder({ radius: radius, height: depth + 2, center: [0, radius + wallThickness, 0] });
  const entryPath = cuboid({ size: [innerWidth * 0.7, wallThickness + 2, depth + 2], center: [0, height - wallThickness/2, 0] });

  return subtract(body, rotate([Math.PI/2, 0, 0], cablePath), entryPath);
};
