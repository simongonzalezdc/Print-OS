/**
 * Velcro-Adjust Sandal (Parametric)
 * Easy on/off with customizable strap tension.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 45 }) => {
  const { size } = params;
  
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 22;

  const sole = roundedCuboid({ 
    size: [length, width, height], 
    roundRadius: 6,
    center: [0, 0, height/2] 
  });

  const strapBase = translate([0, 0, height], cuboid({ size: [length * 0.6, width + 10, 5], center: [0, 0, 2.5] }));
  const velcroZone = translate([0, 0, height + 5], cuboid({ size: [length * 0.4, width * 0.8, 2], center: [0, 0, 1] }));

  return union(
    color.apply([0.2, 0.2, 0.2], sole),
    color.apply([0.3, 0.3, 0.3], strapBase),
    color.apply([0.1, 0.4, 0.8], velcroZone)
  );
};
