/**
 * Sport Sandal (Parametric)
 * Rugged sole with multi-strap adjustment system.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cuboid } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 44 }) => {
  const { size } = params;
  
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 20;

  const outsole = roundedCuboid({ 
    size: [length, width, height], 
    roundRadius: 4,
    center: [0, 0, height/2] 
  });

  // Straps
  const toeStrap = translate([-length * 0.3, 0, height], cuboid({ size: [15, width + 10, 5], center: [0, 0, 2.5] }));
  const ankleStrap = translate([length * 0.2, 0, height], cuboid({ size: [20, width + 10, 5], center: [0, 0, 2.5] }));
  const heelStrap = translate([length * 0.45, 0, height + 10], rotate([0, Math.PI/2, 0], cuboid({ size: [30, width + 10, 5], center: [15, 0, 2.5] })));

  return union(
    color.apply([0.1, 0.1, 0.1], outsole),
    color.apply([0.3, 0.1, 0.1], toeStrap, ankleStrap, heelStrap)
  );
};
