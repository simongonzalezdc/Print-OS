/**
 * Medical/Nursing Clog (Parametric)
 * Slip-resistant, easy-clean surface for healthcare professionals.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 38 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 55;

  const shell = subtract(
    roundedCuboid({ size: [length, width, height], roundRadius: 12, center: [0, 0, height/2] }),
    translate([0, 0, 12], roundedCuboid({ size: [length - 8, width - 8, height], roundRadius: 8, center: [0, 0, height/2] }))
  );

  return color.apply([0.9, 0.9, 0.9], shell);
};
