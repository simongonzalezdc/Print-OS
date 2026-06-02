/**
 * Orthotic Base Shell (Parametric)
 * Rigid base for custom medical orthotics.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder } = primitives;
const { translate, rotate, scale } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 42 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 8;

  const outer = roundedCuboid({ size: [length, width, height], roundRadius: 10, center: [0, 0, height/2] });
  const inner = translate([0, 0, 2], roundedCuboid({ size: [length - 4, width - 4, height], roundRadius: 8, center: [0, 0, height/2] }));

  return color.apply([0.9, 0.9, 0.9], subtract(outer, inner));
};
