/**
 * Forefoot Cushion Module (Parametric)
 * Targeted energy return for the forefoot area.
 */
import { primitives, transforms, color } from '@jscad/modeling';
const { cylinder } = primitives;
const { scale } = transforms;

export const main = (params = { width: 80, height: 8 }) => {
  const { width, height } = params;
  
  return color.apply([0.3, 0.8, 0.3], scale([0.6, 1, 1], cylinder({ radius: width/2, height: height, center: [0, 0, height/2] })));
};
