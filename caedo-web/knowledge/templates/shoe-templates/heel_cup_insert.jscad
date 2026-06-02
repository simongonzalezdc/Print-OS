/**
 * Heel Cup Insert (Parametric)
 * Provides relief for plantar fasciitis.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { cylinder, roundedCuboid } = primitives;
const { translate, scale } = transforms;
const { subtract } = booleans;

export const main = (params = { width: 60 }) => {
  const { width } = params;
  const length = width * 1.4;
  const height = 15;

  const base = roundedCuboid({ size: [length, width, height], roundRadius: 8, center: [0, 0, height/2] });
  const cup = translate([length * 0.1, 0, 5], scale([1, 0.8, 1], cylinder({ radius: width * 0.4, height: height })));

  return color.apply([0.4, 0.6, 0.9], subtract(base, cup));
};
