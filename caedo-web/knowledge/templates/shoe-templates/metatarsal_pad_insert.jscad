/**
 * Metatarsal Pad Insert (Parametric)
 * Ball-of-foot pressure relief module.
 */
import { primitives, transforms, color } from '@jscad/modeling';
const { cylinder } = primitives;
const { scale } = transforms;

export const main = (params = { size: 'medium' }) => {
  const sizes = { small: 20, medium: 25, large: 30 };
  const radius = sizes[params.size] || 25;
  
  return color.apply([0.2, 0.8, 0.4], scale([1.5, 1, 0.2], cylinder({ radius: radius, height: 10, center: [0, 0, 5] })));
};
