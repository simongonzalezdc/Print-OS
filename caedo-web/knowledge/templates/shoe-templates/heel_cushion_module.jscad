/**
 * Heel Cushion Module (Parametric)
 * Drop-in insert for targeted heel strike absorption.
 */
import { primitives, transforms, color } from '@jscad/modeling';
const { cylinder } = primitives;
const { scale } = transforms;

export const main = (params = { diameter: 60, height: 10 }) => {
  const { diameter, height } = params;
  
  return color.apply([0.8, 0.3, 0.3], scale([1.2, 1, 1], cylinder({ radius: diameter/2, height: height, center: [0, 0, height/2] })));
};
