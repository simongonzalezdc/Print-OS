/**
 * Honeycomb Midsole (Parametric)
 * Lightweight structural support with hexagonal cells.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder } = primitives;
const { translate } = transforms;
const { subtract } = booleans;

export const main = (params = { size: 44 }) => {
  const { size } = params;
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 10;

  const base = roundedCuboid({ size: [length, width, height], roundRadius: 3, center: [0, 0, height/2] });
  
  // Honeycomb cutouts (simplified)
  const cutouts = [];
  for (let x = -length/2 + 10; x < length/2 - 10; x += 15) {
    for (let y = -width/2 + 10; y < width/2 - 10; y += 15) {
      cutouts.push(translate([x, y, -1], cylinder({ radius: 5, height: height + 2, segments: 6 })));
    }
  }

  return color.apply([0.3, 0.3, 0.3], subtract(base, ...cutouts));
};
