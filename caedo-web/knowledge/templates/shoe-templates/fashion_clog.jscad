/**
 * Fashion Platform Clog (Parametric)
 * High-fashion elevated design.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 37, platformHeight: 60 }) => {
  const { size, platformHeight } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;

  const sole = roundedCuboid({ size: [length, width, platformHeight], roundRadius: 10, center: [0, 0, platformHeight/2] });
  const upper = translate([0, 0, platformHeight], roundedCuboid({ size: [length * 0.6, width, 30], roundRadius: 10, center: [-length * 0.2, 0, 15] }));

  return color.apply([0.1, 0.1, 0.1], union(sole, upper));
};
