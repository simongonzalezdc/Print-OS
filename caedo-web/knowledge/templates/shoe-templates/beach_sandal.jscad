/**
 * Beach Sandal (Parametric)
 * Lightweight, quick-dry design with sand-release tread.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 40 }) => {
  const { size } = params;
  
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 12;

  const sole = roundedCuboid({ 
    size: [length, width, height], 
    roundRadius: 6,
    center: [0, 0, height/2] 
  });

  // Tread pattern (simplified)
  const treads = [];
  for (let i = -length/2 + 20; i < length/2 - 20; i += 20) {
    treads.push(translate([i, 0, 0], cylinder({ radius: 5, height: 2 })));
  }

  return subtract(sole, ...treads);
};
