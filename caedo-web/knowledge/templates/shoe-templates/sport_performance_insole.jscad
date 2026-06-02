/**
 * Sport Performance Insole (Parametric)
 * Optimized for impact absorption during active use.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder } = primitives;
const { translate } = transforms;
const { union } = booleans;

export const main = (params = { size: 44 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 5;

  const base = roundedCuboid({ size: [length, width, height], roundRadius: 4, center: [0, 0, height/2] });
  
  // Impact zones
  const heelCushion = translate([length * 0.35, 0, height], cylinder({ radius: width * 0.3, height: 2 }));
  const forefootCushion = translate([-length * 0.3, 0, height], cylinder({ radius: width * 0.25, height: 2 }));

  return union(
    color.apply([0.1, 0.1, 0.1], base),
    color.apply([0.8, 0.2, 0.2], heelCushion),
    color.apply([0.2, 0.8, 0.2], forefootCushion)
  );
};
