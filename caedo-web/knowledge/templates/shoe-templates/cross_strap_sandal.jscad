/**
 * Cross-Strap Sandal (Parametric)
 * Secure X-pattern strap for active use.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cuboid } = primitives;
const { translate, rotate } = transforms;
const { union } = booleans;

export const main = (params = { size: 43 }) => {
  const { size } = params;
  
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 18;

  const sole = roundedCuboid({ 
    size: [length, width, height], 
    roundRadius: 5,
    center: [0, 0, height/2] 
  });

  const strapX1 = translate([0, 0, height + 10], rotate([0, 0, Math.PI/4], cuboid({ size: [width * 1.4, 15, 3] })));
  const strapX2 = translate([0, 0, height + 10], rotate([0, 0, -Math.PI/4], cuboid({ size: [width * 1.4, 15, 3] })));

  return union(
    color.apply([0.1, 0.1, 0.1], sole),
    color.apply([0.6, 0.6, 0.6], strapX1, strapX2)
  );
};
