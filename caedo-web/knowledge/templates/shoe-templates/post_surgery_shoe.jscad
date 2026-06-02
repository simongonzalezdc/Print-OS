/**
 * Post-Surgery Recovery Shoe (Parametric)
 * Extra-wide opening and adjustable volume.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 42 }) => {
  const { size } = params;
  const length = (225 + (size - 36) * 7.5) * 1.1; // 10% wider for swelling
  const width = (85 + (size - 36) * 2.5) * 1.2;
  const height = 40;

  const base = roundedCuboid({ size: [length, width, 15], roundRadius: 10, center: [0, 0, 7.5] });
  const heel = translate([length * 0.35, 0, 15], roundedCuboid({ size: [30, width, 30], roundRadius: 5, center: [15, 0, 15] }));

  return color.apply([0.2, 0.2, 0.3], union(base, heel));
};
