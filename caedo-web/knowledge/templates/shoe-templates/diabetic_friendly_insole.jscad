/**
 * Diabetic-Friendly Insole (Parametric)
 * Features pressure redistribution zones.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder } = primitives;
const { translate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 41 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 6;

  const base = roundedCuboid({ size: [length, width, height], roundRadius: 6, center: [0, 0, height/2] });
  
  // Soft pressure zones (subtractive holes for insert material or just thin walls)
  const zone1 = translate([-length * 0.3, 0, height - 2], cylinder({ radius: 15, height: 3 }));
  const zone2 = translate([length * 0.3, 0, height - 2], cylinder({ radius: 20, height: 3 }));

  return color.apply([0.2, 0.7, 0.5], subtract(base, zone1, zone2));
};
