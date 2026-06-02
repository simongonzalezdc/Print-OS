/**
 * Workshop Clog (Parametric)
 * Features an optional protective toe cap cavity.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 43 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 70;

  const shell = subtract(
    roundedCuboid({ size: [length, width, height], roundRadius: 8, center: [0, 0, height/2] }),
    translate([0, 0, 20], roundedCuboid({ size: [length - 15, width - 15, height], roundRadius: 6, center: [0, 0, height/2] }))
  );

  return color.apply([0.4, 0.4, 0.4], shell);
};
