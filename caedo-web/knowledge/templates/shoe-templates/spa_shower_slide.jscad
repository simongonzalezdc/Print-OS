/**
 * Spa/Shower Slide (Parametric)
 * Antimicrobial-friendly with maximum drainage.
 */
import { primitives, transforms, booleans, color } from '@jscad/modeling';
const { roundedCuboid, cylinder, cuboid } = primitives;
const { translate, rotate } = transforms;
const { union, subtract } = booleans;

export const main = (params = { size: 42 }) => {
  const { size } = params;
  
  const length = 225 + (size - 36) * 7.5;
  const width = 85 + (size - 36) * 2.5;
  const height = 18;

  const sole = roundedCuboid({ 
    size: [length, width, height], 
    roundRadius: 10,
    center: [0, 0, height/2] 
  });

  // Drainage holes
  const holes = [];
  for (let x = -length/3; x < length/3; x += 25) {
    for (let y = -width/4; y < width/4; y += 20) {
      holes.push(translate([x, y, -1], cylinder({ radius: 4, height: height + 2 })));
    }
  }

  const strap = translate([length * 0.1, 0, height + 5], cuboid({ size: [length * 0.35, width + 5, 5], center: [0, 0, 2.5] }));

  return subtract(union(sole, strap), ...holes);
};
