/**
 * 3/4 Length Orthotic (Parametric)
 * Fits into dress shoes and smaller footwear.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder } = primitives;
const { translate, scale } = transforms;
const { union } = booleans;

export const main = (params = { size: 40 }) => {
  const { size } = params;
  const fullLength = 225 + (size - 36) * 7.5;
  const length = fullLength * 0.75;
  const width = 85 + (size - 36) * 2.5;
  const height = 4;

  const base = roundedCuboid({ size: [length, width, height], roundRadius: 5, center: [length/4, 0, height/2] });
  const arch = translate([length * 0.1, width * 0.2, height], scale([1, 0.5, 1.1], cylinder({ radius: width * 0.4, height: 12 })));

  return color.apply([0.4, 0.4, 0.4], union(base, arch));
};
