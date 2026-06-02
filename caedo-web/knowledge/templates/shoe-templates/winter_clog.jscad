/**
 * Winter Clog (Parametric)
 * Features an internal cavity for insulation/lining.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid } = primitives;
const { translate } = transforms;
const { subtract } = booleans;

export const main = (params = { size: 39 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 80;

  const shell = subtract(
    roundedCuboid({ size: [length, width, height], roundRadius: 20, center: [0, 0, height/2] }),
    translate([0, 0, 25], roundedCuboid({ size: [length - 20, width - 20, height], roundRadius: 15, center: [0, 0, height/2] }))
  );

  return color.apply([0.5, 0.3, 0.2], shell);
};
