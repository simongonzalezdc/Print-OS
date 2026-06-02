/**
 * Sneaker Sole Unit (Parametric)
 * Integrated outsole and midsole assembly.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid } = primitives;
const { translate } = transforms;
const { union } = booleans;

export const main = (params = { size: 42 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  
  const outsole = roundedCuboid({ size: [length, width, 5], roundRadius: 3, center: [0, 0, 2.5] });
  const midsole = translate([0, 0, 5], roundedCuboid({ size: [length - 2, width - 2, 15], roundRadius: 5, center: [0, 0, 7.5] }));

  return union(
    color.apply([0.1, 0.1, 0.1], outsole),
    color.apply([0.9, 0.9, 0.9], midsole)
  );
};
