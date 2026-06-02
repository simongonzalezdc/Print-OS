/**
 * Garden Clog (Parametric)
 * Durable, easy-rinse design with reinforced toe.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 40 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 50;

  const shell = subtract(
    roundedCuboid({ size: [length, width, height], roundRadius: 15, center: [0, 0, height/2] }),
    translate([0, 0, 10], roundedCuboid({ size: [length - 6, width - 6, height], roundRadius: 10, center: [0, 0, height/2] }))
  );

  const reinforcedToe = translate([-length/2 + 10, 0, 0], roundedCuboid({ size: [20, width, height], roundRadius: 5, center: [10, 0, height/2] }));

  return color.apply([0.3, 0.5, 0.2], union(shell, reinforcedToe));
};
