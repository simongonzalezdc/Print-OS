/**
 * Lacing Anchor System (Parametric)
 * Integrated eyelet components for lacing.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { cuboid, cylinder } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { eyelets: 5 }) => {
  const { eyelets } = params;
  const length = eyelets * 15;
  const strip = cuboid({ size: [length, 10, 2], center: [0, 0, 1] });
  
  const holes = [];
  for (let i = 0; i < eyelets; i++) {
    holes.push(translate([-length/2 + 7.5 + i * 15, 0, -1], cylinder({ radius: 2, height: 4 })));
  }

  return color.apply([0.2, 0.2, 0.2], subtract(strip, ...holes));
};
