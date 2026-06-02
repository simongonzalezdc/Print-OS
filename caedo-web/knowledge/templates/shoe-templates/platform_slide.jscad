/**
 * Platform Slide (Parametric)
 * High-profile sole for fashion and height.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cuboid } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 38, platformHeight: 40 }) => {
  const { size, platformHeight } = params;
  
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;

  const sole = roundedCuboid({ 
    size: [length, width, platformHeight], 
    roundRadius: 8,
    center: [0, 0, platformHeight/2] 
  });

  const strap = translate([length * 0.1, 0, platformHeight], cuboid({ size: [length * 0.4, width + 5, 30], center: [0, 0, 15] }));
  const innerStrap = translate([length * 0.1, 0, platformHeight + 5], cuboid({ size: [length * 0.5, width - 5, 40], center: [0, 0, 20] }));

  return union(
    color.apply([0.1, 0.1, 0.1], sole),
    subtract(strap, innerStrap)
  );
};
