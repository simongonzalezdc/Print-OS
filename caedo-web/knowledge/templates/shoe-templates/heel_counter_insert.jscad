/**
 * Heel Counter Insert (Parametric)
 * Rigid component for heel stability and support.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder } = primitives;
const { translate, scale } = transforms;
const { subtract } = booleans;

export const main = (params = { width: 70 }) => {
  const { width } = params;
  const length = width * 0.8;
  const height = 40;

  const body = roundedCuboid({ size: [length, width, height], roundRadius: 15, center: [0, 0, height/2] });
  const cut = translate([-5, 0, 5], scale([1, 0.8, 1.2], cylinder({ radius: width * 0.45, height: height })));

  return color.apply([0.1, 0.1, 0.1], subtract(body, cut));
};
