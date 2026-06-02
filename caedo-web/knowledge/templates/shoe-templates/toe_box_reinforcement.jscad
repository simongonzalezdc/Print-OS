/**
 * Toe Box Reinforcement (Parametric)
 * Protective layer for the front of the sneaker.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder } = primitives;
const { translate, scale } = transforms;
const { subtract } = booleans;

export const main = (params = { width: 90 }) => {
  const { width } = params;
  const length = 40;
  const height = 25;

  const body = roundedCuboid({ size: [length, width, height], roundRadius: 15, center: [0, 0, height/2] });
  const cut = translate([5, 0, -2], scale([1, 0.9, 1], cylinder({ radius: width * 0.45, height: height + 4 })));

  return color.apply([0.1, 0.1, 0.1], subtract(body, cut));
};
